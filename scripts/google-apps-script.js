// ============================================================
//  CONFIG
// ============================================================
var SHEET_NAME   = "TranscationTable";
var DEFAULT_EMAIL = "kerjaanamin99@gmail.com";
var CACHE_TTL    = 300;   // seconds — 5-minute cache per period
var MAX_ROWS     = 10000; // only read the last N rows (covers ~5 yrs of daily personal transactions)
var RESULTS_DAYS = 90;    // only return transactions from the last N days in the data[] array

// ============================================================
//  HELPERS
// ============================================================

/** Returns a JSON ContentService response. */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Writes a possibly-large string into ScriptCache using multiple
 * 90 KB chunks to stay under the 100 KB per-key limit.
 */
function putInChunkedCache(cache, key, value, ttl) {
  try {
    var CHUNK = 90000;
    var numChunks = Math.ceil(value.length / CHUNK);
    var entries = {};
    entries[key + "__n"] = String(numChunks);
    for (var i = 0; i < numChunks; i++) {
      entries[key + "__" + i] = value.substring(i * CHUNK, (i + 1) * CHUNK);
    }
    cache.putAll(entries, ttl);
  } catch (e) {
    // If cache fails (quota, etc.) just skip silently
  }
}

/**
 * Reads a chunked cache entry. Returns the full string or null on miss.
 */
function getFromChunkedCache(cache, key) {
  try {
    var nStr = cache.get(key + "__n");
    if (!nStr) return null;
    var numChunks = parseInt(nStr, 10);
    if (numChunks === 1) {
      // Fast path — single chunk stored directly
      var single = cache.get(key + "__0");
      return single || null;
    }
    var keys = [];
    for (var i = 0; i < numChunks; i++) keys.push(key + "__" + i);
    var values = cache.getAll(keys);
    var result = "";
    for (var j = 0; j < numChunks; j++) {
      var chunk = values[key + "__" + j];
      if (chunk === null || chunk === undefined) return null; // partial miss
      result += chunk;
    }
    return result;
  } catch (e) {
    return null;
  }
}

// ============================================================
//  POST — append a new transaction row
// ============================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return jsonResponse({ success: false, error: "Sheet not found" });

    var category      = data.category || "B: PENGELUARAN~Lainnya";
    var parts         = category.split("~");
    var parentCategory = parts[0] || "";
    var childCategory  = parts[1] || "";

    var dateStr = data.date || new Date().toISOString().split("T")[0];
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) d = new Date();

    var month = d.getMonth() + 1;
    var year  = d.getFullYear();

    // Use Utilities.formatDate for both values so the output is deterministic
    // regardless of Apps Script runtime / ICU / V8 version.
    var tz = Session.getScriptTimeZone();
    // Column A — matches old format: "3/27/2026 15:42:38"
    var timestamp     = Utilities.formatDate(new Date(), tz, "M/d/yyyy HH:mm:ss");
    // Column C — matches old format: "3/27/2026"
    var formattedDate = Utilities.formatDate(d, tz, "M/d/yyyy");

    var row = [
      timestamp,           // A — created_at
      DEFAULT_EMAIL,       // B — email
      formattedDate,       // C — date
      category,            // D — category (parent~child)
      data.amount || 0,    // E — amount
      data.account || "",  // F — account
      data.notes   || "",  // G — notes
      parentCategory,      // H — parent category
      childCategory,       // I — child category
      month,               // J — month (int)
      year                 // K — year  (int)
    ];

    // appendRow is a single Sheets API call — no row-reading needed
    sheet.appendRow(row);

    // Mark cache dirty so the very next GET bypasses the stale cache (expires in 60s)
    CacheService.getScriptCache().put("cache_dirty", "1", 60);

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
//  GET — return period stats + recent transactions
// ============================================================
function doGet(e) {
  try {

    // ---- 1. Resolve "today" (can be overridden via ?targetDate=) ----
    var today = new Date();
    var hasPeriodParam = false;   // true when caller requests a specific historical period
    if (e && e.parameter && e.parameter.targetDate) {
      var td = new Date(e.parameter.targetDate);
      if (!isNaN(td.getTime())) {
        today = td;
        hasPeriodParam = true;
      }
    }

    // ---- 2. Calculate cut-period boundaries (26th → 25th) ----
    var cutStart, cutEnd;
    if (today.getDate() <= 25) {
      cutStart = new Date(today.getFullYear(), today.getMonth() - 1, 26);
      cutEnd   = new Date(today.getFullYear(), today.getMonth(),     25);
    } else {
      cutStart = new Date(today.getFullYear(), today.getMonth(),     26);
      cutEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 25);
    }

    var MONTHS = ["Januari","Februari","Maret","April","Mei","Juni",
                  "Juli","Agustus","September","Oktober","November","Desember"];
    var currentMonthStr = MONTHS[cutEnd.getMonth()] + " " + cutEnd.getFullYear();

    // Previous period (for saldoBulanLalu)
    var prevCutStart = new Date(cutStart.getFullYear(), cutStart.getMonth() - 1, cutStart.getDate());
    var prevCutEnd   = new Date(cutEnd.getFullYear(),   cutEnd.getMonth()   - 1, cutEnd.getDate());

    var searchStart = new Date(cutStart); searchStart.setHours(0,  0,  0,  0);
    var searchEnd   = new Date(cutEnd);   searchEnd.setHours(23, 59, 59, 999);

    var prevSearchStart = new Date(prevCutStart); prevSearchStart.setHours(0,  0,  0,  0);
    var prevSearchEnd   = new Date(prevCutEnd);   prevSearchEnd.setHours(23, 59, 59, 999);

    // Gaji is entered the day before the period boundary (per existing convention)
    var gajiSearchStart = new Date(searchStart); gajiSearchStart.setDate(gajiSearchStart.getDate() - 1);
    var gajiSearchEnd   = new Date(searchEnd);   gajiSearchEnd.setDate(gajiSearchEnd.getDate()   - 1);

    // ---- 3. Cache lookup ----
    var cacheKey  = "txn__" + cutStart.toISOString().slice(0, 10) + "__" + cutEnd.toISOString().slice(0, 10);
    var cache     = CacheService.getScriptCache();
    var isDirty   = cache.get("cache_dirty");
    // noCache=1 forces a fresh fetch (e.g. user edited the spreadsheet directly)
    var forceRefresh = e && e.parameter && e.parameter.noCache;

    if (!isDirty && !forceRefresh) {
      var cached = getFromChunkedCache(cache, cacheKey);
      if (cached) {
        return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ---- 4. Read only the last MAX_ROWS rows from TransactionTable ----
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return jsonResponse({ success: false, error: "Sheet not found" });

    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      // Sheet is empty (header only)
      return jsonResponse({
        success: true, data: [],
        saldoReal: 0, saldoTabungan: 0,
        totalPengeluaran: 0, setorTabungan: 0,
        totalPemasukan: 0, saldoBulanLalu: 0,
        period: { monthStr: currentMonthStr,
                  cutStart: cutStart.toISOString(),
                  cutEnd:   cutEnd.toISOString() }
      });
    }

    // Read from (lastRow - MAX_ROWS + 1) or row 2 (skip header), whichever is later
    var startRow = Math.max(2, lastRow - MAX_ROWS + 1);
    var numRows  = lastRow - startRow + 1;
    var rawData  = sheet.getRange(startRow, 1, numRows, 11).getValues();

    // ---- 5. Determine result window for data[] ----
    // Summary page (hasPeriodParam=true)  → return full queried period (gajiSearchStart onward)
    // Dashboard     (hasPeriodParam=false) → return rolling 90-day window for a manageable payload
    var cutoffForResults;
    if (hasPeriodParam) {
      // Include every transaction in the period being queried (gaji boundary + full cut window)
      cutoffForResults = gajiSearchStart;
    } else {
      cutoffForResults = new Date(today.getTime() - RESULTS_DAYS * 864e5);
      cutoffForResults.setHours(0, 0, 0, 0);
    }

    var totalPengeluaran  = 0;
    var results = [];
    var setorTabungan     = 0;
    var totalPemasukanLain = 0;
    var totalPemasukanGaji = 0;

    for (var i = 0; i < rawData.length; i++) {
      var row = rawData[i];
      if (!row[0]) continue; // skip empty rows

      // Parse date from column C (formatted date) or fall back to column A (timestamp)
      var parsedDate = row[2] ? new Date(row[2]) : new Date(row[0]);
      if (isNaN(parsedDate.getTime())) continue;

      var isoDate    = parsedDate.toISOString();
      var amt        = Number(row[4]) || 0;
      var catString  = String(row[3]);

      var d = new Date(isoDate);
      d.setHours(0, 0, 0, 0);

      var catParts   = catString.split("~");
      var parentCat  = catParts[0].trim().toUpperCase();
      var childCat   = catParts[1] ? catParts[1].trim().toUpperCase() : "";

      // --- Aggregate stats for current period ---
      if (d >= searchStart && d <= searchEnd) {
        if (parentCat === "B: PENGELUARAN") totalPengeluaran   += amt;
        if (parentCat === "C: TABUNGAN")    setorTabungan      += amt;
        if (parentCat === "A: PEMASUKAN" && childCat !== "GAJI") totalPemasukanLain += amt;
      }

      // Gaji has a -1 day boundary
      if (d >= gajiSearchStart && d <= gajiSearchEnd) {
        if (parentCat === "A: PEMASUKAN" && childCat === "GAJI") totalPemasukanGaji += amt;
      }

      // --- Include in transaction list only for the last RESULTS_DAYS days ---
      if (d >= cutoffForResults) {
        results.push({
          id:         startRow - 1 + i, // approximate row number as ID
          created_at: row[0].toString(),
          date:       isoDate,
          category:   catString,
          amount:     amt,
          account:    String(row[5]),
          notes:      String(row[6])
        });
      }
    }

    // ---- 6. Read saldo from RiwayatSaldoReal (small summary sheet — always fast) ----
    var saldoReal         = 0;
    var saldoTabungan     = 0;
    var saldoRealPrevMonth = 0;

    var histSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RiwayatSaldoReal");
    if (histSheet) {
      var histLastRow = histSheet.getLastRow();
      if (histLastRow > 1) {
        var histData = histSheet.getRange(1, 1, histLastRow, histSheet.getLastColumn()).getValues();
        var headers  = histData[0] || [];
        var dateCol = -1, catCol = -1, amtCol = -1;

        for (var c = 0; c < headers.length; c++) {
          var h = String(headers[c]).trim().toUpperCase();
          if (h === "DATE" || h === "TANGGAL" || h === "WAKTU") dateCol = c;
          if (h === "CATEGORY" || h === "KATEGORI")             catCol  = c;
          if (h === "AMOUNT"   || h === "NOMINAL" || h === "JUMLAH") amtCol = c;
        }
        if (dateCol < 0) dateCol = 1;
        if (catCol  < 0) catCol  = 2;
        if (amtCol  < 0) amtCol  = 3;

        for (var r = 1; r < histData.length; r++) {
          var rowDateStr = histData[r][dateCol];
          if (!rowDateStr) continue;
          var rowDate = new Date(rowDateStr);
          if (isNaN(rowDate.getTime())) continue;
          rowDate.setHours(0, 0, 0, 0);

          var hCat  = String(histData[r][catCol]).trim().toUpperCase();
          var hAmt  = Number(String(histData[r][amtCol]).replace(/,/g, "")) || 0;

          if (rowDate >= searchStart && rowDate <= searchEnd) {
            if (hCat === "SALDO REAL")     saldoReal     += hAmt;
            if (hCat === "SALDO TABUNGAN") saldoTabungan += hAmt;
          }
          if (rowDate >= prevSearchStart && rowDate <= prevSearchEnd) {
            if (hCat === "SALDO REAL") saldoRealPrevMonth += hAmt;
          }
        }
      }
    }

    // ---- 7. Build response ----
    var totalPemasukan = totalPemasukanLain + totalPemasukanGaji;

    var responseObj = {
      success:          true,
      data:             results.reverse(), // newest first
      saldoReal:        saldoReal,
      saldoTabungan:    saldoTabungan,
      totalPengeluaran: totalPengeluaran,
      setorTabungan:    setorTabungan,
      totalPemasukan:   totalPemasukan,
      saldoBulanLalu:   saldoRealPrevMonth,
      period: {
        monthStr: currentMonthStr,
        cutStart: cutStart.toISOString(),
        cutEnd:   cutEnd.toISOString()
      }
    };

    var responseStr = JSON.stringify(responseObj);

    // ---- 8. Save to cache (chunked to handle > 100 KB) ----
    cache.remove("cache_dirty");
    putInChunkedCache(cache, cacheKey, responseStr, CACHE_TTL);

    return ContentService.createTextOutput(responseStr).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}
