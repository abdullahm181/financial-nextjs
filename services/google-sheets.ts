import { Transaction, TransactionType } from "@/types";

/**
 * Server-side service to fetch data from the public Google Sheet CSV endpoint.
 */
export const googleSheetsService = {
  async getTransactions(): Promise<Transaction[]> {
    const sheetId = "122LEG0AaW8FYdTiifrQVe2Ha2Yjb3TXhImobKTl-s-4";
    const sheetName = "TranscationTable";

    // Google Sheets public CSV export URL
    // Note: The sheet MUST be set to "Anyone with the link can view"
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    try {
      // Fetch with next.js cache configuration
      // Revalidate every 60 seconds so it doesn't hammer Google's servers on every request
      const response = await fetch(url, {
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Sheets: ${response.statusText}`);
      }

      const csvText = await response.text();
      return this.parseCsv(csvText);
    } catch (error) {
      console.error("Error fetching transactions from Google Sheets:", error);
      return [];
    }
  },

  /**
   * Parse the specific CSV format from Google Sheets gviz endpoint
   */
  parseCsv(csvText: string): Transaction[] {
    // Basic CSV parser that handles quoted strings
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    
    // First line is header, skip it if the array is populated
    if (lines.length <= 1) return [];

    const transactions: Transaction[] = [];

    // Skip the first row (headers)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex to split by comma, respecting quotes
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => {
        // Remove surrounding quotes if they exist
        val = val.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          return val.substring(1, val.length - 1);
        }
        return val;
      });

      // Based on the specific spreadsheet columns:
      // Timestamp, Email, Date, Category, Amount, Account, Notes, ParentCategory, ChildCategory, Month, Year
      
      const parentCategory = values[7] || "";
      const type: TransactionType = parentCategory.includes("PEMASUKAN") 
        ? "INCOME" 
        : "EXPENSE";

      // Parse amount, removing any commas/separators if any ended up in the raw text
      const amountRaw = values[4] || "0";
      const amount = parseFloat(amountRaw.replace(/[^\d.-]/g, '')) || 0;

      // Handle potentially empty rows by checking required fields
      if (!values[2] || !values[3]) continue;

      transactions.push({
        timestamp: values[0] || "",
        email: values[1] || "",
        date: values[2] || "",
        category: values[3] || "",
        amount: amount,
        account: values[5] || "",
        notes: values[6] || "",
        parentCategory: parentCategory,
        childCategory: values[8] || "",
        month: parseInt(values[9] || "0", 10),
        year: parseInt(values[10] || "0", 10),
        type,
      });
    }

    // Sort descending by date (newest first)
    // The date format is MM/DD/YYYY based on the sample data
    return transactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
};
