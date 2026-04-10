import { appendToSheet, fetchFromSheet } from "./google-apps-script";

export type TransactionRecord = {
  id: number;
  date: string;
  category: string;
  amount: number;
  account: string;
  notes: string;
  created_at: string;
};

export async function addTransaction(data: {
  date: string;
  category: string;
  amount: number;
  account: string;
  notes: string;
}): Promise<TransactionRecord> {
  // Write to Google Sheets
  try {
    await appendToSheet({
      date: data.date,
      category: data.category,
      amount: data.amount,
      account: data.account,
      notes: data.notes,
    });
  } catch (error: any) {
    console.error("Google Sheets append failed:", error);
    throw new Error(error.message || "Failed to save to Google Sheets");
  }

  // Construct a mocked local response for immediate UI update
  return {
    id: Date.now(),
    date: data.date,
    category: data.category,
    amount: data.amount,
    account: data.account,
    notes: data.notes,
    created_at: new Date().toISOString(),
  };
}

export async function getTransactions(targetDate?: string, noCache?: boolean): Promise<{ 
  data: TransactionRecord[], 
  saldoReal: number, 
  saldoTabungan: number,
  totalPengeluaran: number,
  setorTabungan: number,
  totalPemasukan: number,
  saldoBulanLalu: number,
  period: { monthStr: string, cutStart: string, cutEnd: string } | null
}> {
  // Fetch directly from Google Sheets
  return await fetchFromSheet(targetDate, noCache);
}
