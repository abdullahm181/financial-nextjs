import { ParsedTransaction } from "@/types";

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxyokxGBO4iYJ8zQzQ_j3lapl2XHK-eJYkfxv0hxb0oHXdmypMkfS21gY3G3SxODpzx/exec";

/**
 * Sends transaction data to a Google Apps Script Web App
 * which appends a row to the Google Spreadsheet.
 */
export async function appendToSheet(transaction: ParsedTransaction): Promise<boolean> {

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: transaction.date,
        category: transaction.category,
        amount: transaction.amount,
        account: transaction.account,
        notes: transaction.notes,
      }),
    });

    if (!response.ok) {
      console.error("Google Apps Script error:", response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to append to Google Sheet:", error);
    return false;
  }
}
