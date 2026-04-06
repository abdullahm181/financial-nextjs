/**
 * Transaction data types.
 * Maps directly to the "TranscationTable" Google Sheet columns.
 */

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  /** Form submission timestamp */
  timestamp: string;
  /** Email of the person who submitted */
  email: string;
  /** Transaction date */
  date: string;
  /** Raw category string (e.g. "B: PENGELUARAN~Parkir") */
  category: string;
  /** Amount in IDR */
  amount: number;
  /** Payment account (e.g. "Cash - Maya", "Bank - NeoBank") */
  account: string;
  /** Description / notes */
  notes: string;
  /** Parent category: "A: PEMASUKAN" or "B: PENGELUARAN" */
  parentCategory: string;
  /** Sub-category (e.g. "Parkir", "Makan di luar") */
  childCategory: string;
  /** Month number (1-12) */
  month: number;
  /** Year */
  year: number;
  /** Derived: income or expense */
  type: TransactionType;
}

/**
 * Summary statistics for a set of transactions.
 */
export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}
