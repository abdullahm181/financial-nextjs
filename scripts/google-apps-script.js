/**
 * Google Apps Script — Paste this into your spreadsheet's script editor.
 *
 * Setup Instructions:
 * 1. Open your Google Spreadsheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click "Deploy" → "New deployment"
 * 5. Select type: "Web app"
 * 6. Set "Execute as": "Me"
 * 7. Set "Who has access": "Anyone"
 * 8. Click "Deploy" and copy the Web App URL
 * 9. Add that URL to your .env file as GOOGLE_APPS_SCRIPT_URL
 *
 * IMPORTANT: After deployment, if you edit the script,
 * you must create a NEW deployment for changes to take effect.
 */

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

    // Parse category into parent and child
    var category = data.category || "B: PENGELUARAN~Lainnya";
    var parts = category.split("~");
    var parentCategory = parts[0] || "";
    var childCategory = parts[1] || "";

    // Parse date to extract month and year
    // Expected format: M/D/YYYY
    var dateStr = data.date || "";
    var dateParts = dateStr.split("/");
    var month = dateParts.length >= 1 ? parseInt(dateParts[0]) : new Date().getMonth() + 1;
    var year = dateParts.length >= 3 ? parseInt(dateParts[2]) : new Date().getFullYear();

    // Build the row matching the spreadsheet columns:
    // Timestamp | Email | Date | Category | Amount | Account | Notes | ParentCategory | ChildCategory | Month | Year
    var timestamp = new Date().toLocaleString("en-US");
    var row = [
      timestamp,           // A: Timestamp (auto)
      DEFAULT_EMAIL,       // B: Email Address
      dateStr,             // C: Date
      category,            // D: Category (full)
      data.amount || 0,    // E: Amount
      data.account || "",  // F: Account
      data.notes || "",    // G: Notes
      parentCategory,      // H: Parent Category (auto)
      childCategory,       // I: Child Category (auto)
      month,               // J: Month (auto)
      year                 // K: Year (auto)
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Required for GET requests (optional — useful for testing)
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok", message: "Financial Tracker Apps Script is running." })
  ).setMimeType(ContentService.MimeType.JSON);
}
