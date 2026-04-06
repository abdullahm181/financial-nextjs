const SHEET_NAME = "TranscationTable";
const DEFAULT_EMAIL = "kerjaanamin99@gmail.com";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Sheet not found" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var category = data.category || "B: PENGELUARAN~Lainnya";
    var parts = category.split("~");
    var parentCategory = parts[0] || "";
    var childCategory = parts[1] || "";

    var dateStr = data.date || new Date().toISOString().split("T")[0];
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) d = new Date();

    var month = d.getMonth() + 1;
    var year = d.getFullYear();

    // Format universally (yyyy-MM-dd) so Javascript and Google Sheets NEVER confuse Day and Month
    var formattedDate = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
    var timestamp = new Date().toLocaleString("en-US");
    
    var row = [
      timestamp,           // A
      DEFAULT_EMAIL,       // B
      formattedDate,       // C
      category,            // D
      data.amount || 0,    // E
      data.account || "",  // F
      data.notes || "",    // G
      parentCategory,      // H
      childCategory,       // I
      month,               // J
      year                 // K
    ];

    var columnAValues = sheet.getRange("A1:A" + sheet.getMaxRows()).getValues();
    var lastFilledRow = 1; 
    for (var i = columnAValues.length - 1; i >= 0; i--) {
      if (columnAValues[i][0] !== "") {
        lastFilledRow = i + 1;
        break;
      }
    }

    sheet.insertRowAfter(lastFilledRow);
    sheet.getRange(lastFilledRow + 1, 1, 1, row.length).setValues([row]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET all transactions to display in the Dashboard
function doGet(e) {
  try {
    // --- Calculate Period Boundaries (cut start=26, cut end=25) ---
    var today = new Date();
    if (e && e.parameter && e.parameter.targetDate) {
      var d = new Date(e.parameter.targetDate);
      if (!isNaN(d.getTime())) today = d;
    }
    var cutStart, cutEnd, currentMonthStr;
    
    if (today.getDate() <= 25) {
      cutStart = new Date(today.getFullYear(), today.getMonth() - 1, 26);
      cutEnd   = new Date(today.getFullYear(), today.getMonth(), 25);
    } else {
      cutStart = new Date(today.getFullYear(), today.getMonth(), 26);
      cutEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 25);
    }
    
    var monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    currentMonthStr = monthNames[cutEnd.getMonth()] + " " + cutEnd.getFullYear();

    // Previous Period Boundaries
    var prevCutStart = new Date(cutStart.getFullYear(), cutStart.getMonth() - 1, cutStart.getDate());
    var prevCutEnd = new Date(cutEnd.getFullYear(), cutEnd.getMonth() - 1, cutEnd.getDate());

    var searchStart = new Date(cutStart); searchStart.setHours(0,0,0,0);
    var searchEnd = new Date(cutEnd); searchEnd.setHours(23,59,59,999);
    
    var prevSearchStart = new Date(prevCutStart); prevSearchStart.setHours(0,0,0,0);
    var prevSearchEnd = new Date(prevCutEnd); prevSearchEnd.setHours(23,59,59,999);

    // Gaji Boundaries (-1 Day)
    var gajiSearchStart = new Date(searchStart.getTime());
    gajiSearchStart.setDate(gajiSearchStart.getDate() - 1);
    
    var gajiSearchEnd = new Date(searchEnd.getTime());
    gajiSearchEnd.setDate(gajiSearchEnd.getDate() - 1);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Sheet not found" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var results = [];
    
    var totalPengeluaran = 0;
    var setorTabungan = 0;
    var totalPemasukanLain = 0;
    var totalPemasukanGaji = 0;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[0] === "") continue; 
      
      var parsedDate = row[2] ? new Date(row[2]) : new Date(row[0]);
      var isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
      
      var amt = Number(row[4]) || 0;
      var catString = String(row[3]);
      
      results.push({
        id: i,
        created_at: row[0].toString(),
        email: row[1],
        date: isoDate,
        category: catString,
        amount: amt,
        account: row[5],
        notes: row[6],
      });

      // Stats Calculation
      var d = new Date(isoDate);
      if (isNaN(d.getTime())) continue;
      d.setHours(0,0,0,0);

      var parentCat = catString.split('~')[0].trim().toUpperCase();
      var childCat = catString.split('~')[1] ? catString.split('~')[1].trim().toUpperCase() : "";

      if (d >= searchStart && d <= searchEnd) {
        if (parentCat === "B: PENGELUARAN") totalPengeluaran += amt;
        if (parentCat === "C: TABUNGAN") setorTabungan += amt;
        if (parentCat === "A: PEMASUKAN" && childCat !== "GAJI") totalPemasukanLain += amt;
      }

      if (d >= gajiSearchStart && d <= gajiSearchEnd) {
        if (parentCat === "A: PEMASUKAN" && childCat === "GAJI") totalPemasukanGaji += amt;
      }
    }

    // --- Get Saldo from RiwayatSaldoReal ---
    var saldoReal = 0;
    var saldoTabungan = 0;
    var saldoRealPrevMonth = 0;
    
    var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RiwayatSaldoReal");
    
    if (historySheet) {
      var histData = historySheet.getDataRange().getValues();
      var headers = histData[0] || [];
      var dateCol = -1, catCol = -1, amtCol = -1;
      
      for (var c = 0; c < headers.length; c++) {
        var h = String(headers[c]).trim().toUpperCase();
        if (h === "DATE" || h === "TANGGAL" || h === "WAKTU") dateCol = c;
        if (h === "CATEGORY" || h === "KATEGORI") catCol = c;
        if (h === "AMOUNT" || h === "NOMINAL" || h === "JUMLAH") amtCol = c;
      }
      
      if (dateCol === -1) dateCol = 1;
      if (catCol === -1) catCol = 2;
      if (amtCol === -1) amtCol = 3;
      
      for (var r = 1; r < histData.length; r++) {
        var rowDateStr = histData[r][dateCol];
        if (!rowDateStr) continue;
        var rowDate = new Date(rowDateStr);
        if (isNaN(rowDate.getTime())) continue;
        
        rowDate.setHours(0,0,0,0);
        
        var cat = String(histData[r][catCol]).trim().toUpperCase();
        var valStr = String(histData[r][amtCol]).replace(/,/g, '');
        var histAmt = Number(valStr) || 0;

        if (rowDate >= searchStart && rowDate <= searchEnd) {
           if (cat === "SALDO REAL") saldoReal += histAmt;
           if (cat === "SALDO TABUNGAN") saldoTabungan += histAmt;
        }

        if (rowDate >= prevSearchStart && rowDate <= prevSearchEnd) {
           if (cat === "SALDO REAL") saldoRealPrevMonth += histAmt;
        }
      }
    }

    var totalPemasukan = totalPemasukanLain + totalPemasukanGaji;

    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: true, 
        data: results.reverse(),
        saldoReal: saldoReal,
        saldoTabungan: saldoTabungan,
        totalPengeluaran: totalPengeluaran,
        setorTabungan: setorTabungan,
        totalPemasukan: totalPemasukan,
        saldoBulanLalu: saldoRealPrevMonth,
        period: {
          monthStr: currentMonthStr,
          cutStart: cutStart.toISOString(),
          cutEnd: cutEnd.toISOString()
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
