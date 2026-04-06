import { Transaction } from "@/types";
import { formatCurrency, cn } from "@/lib";

interface TransactionSummaryProps {
  transactions: Transaction[];
}

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const cardClasses = "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total Income */}
      <div className={cardClasses}>
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Total Pemasukan
        </h3>
        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalIncome, "IDR", "id-ID")}
        </p>
      </div>

      {/* Total Expense */}
      <div className={cardClasses}>
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Total Pengeluaran
        </h3>
        <p className="mt-2 text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
          {formatCurrency(totalExpense, "IDR", "id-ID")}
        </p>
      </div>

      {/* Net Balance */}
      <div className={cardClasses}>
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Sisa Saldo
        </h3>
        <p
          className={cn(
            "mt-2 text-2xl font-bold tracking-tight",
            netBalance >= 0
              ? "text-zinc-900 dark:text-zinc-50"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {formatCurrency(netBalance, "IDR", "id-ID")}
        </p>
      </div>
    </div>
  );
}
