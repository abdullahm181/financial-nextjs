import { ParsedTransaction } from "@/types";

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwDX4-6mjifEtl0CF7sFnTdEUEoQDraL_rwiuSvbXUCN1VCai9zKDisePg7U4AXH6qp/exec";

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
