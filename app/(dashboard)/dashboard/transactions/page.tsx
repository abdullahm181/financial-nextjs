import { TransactionTable } from "@/features/transactions";
import { googleSheetsService } from "@/services";

// Optional: Force dynamic rendering if you want it to fetch completely fresh on every single load instead of caching
// export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  // Fetch transactions from Google Sheets server-side
  const transactions = await googleSheetsService.getTransactions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Transaksi
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Data disinkronkan langsung dari Google Spreadsheet ({transactions.length} baris).
        </p>
      </div>

      {transactions.length > 0 ? (
        <TransactionTable initialTransactions={transactions} />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Tidak ada data</h3>
          <p className="mt-2 text-sm text-zinc-500">
            Pastikan Google Spreadsheet dapat diakses publik atau periksa Environment Variables Anda.
          </p>
        </div>
      )}
    </div>
  );
}
