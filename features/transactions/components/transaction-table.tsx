"use client";

import { useMemo, useState } from "react";
import { Transaction } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib";
import { TransactionSummary } from "./transaction-summary";

interface TransactionTableProps {
  initialTransactions: Transaction[];
}

export function TransactionTable({ initialTransactions }: TransactionTableProps) {
  const [filterMonth, setFilterMonth] = useState<number | "ALL">("ALL");

  // Extract unique months from data for the filter
  const availableMonths = useMemo(() => {
    const months = new Set(initialTransactions.map((t) => t.month));
    return Array.from(months).sort((a, b) => b - a); // Descending (latest first)
  }, [initialTransactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    if (filterMonth === "ALL") return initialTransactions;
    return initialTransactions.filter((t) => t.month === filterMonth);
  }, [initialTransactions, filterMonth]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Riwayat Transaksi
        </h2>
        
        <div className="flex items-center gap-2">
          <label htmlFor="month-filter" className="text-sm text-zinc-600 dark:text-zinc-400">
            Bulan:
          </label>
          <select
            id="month-filter"
            value={filterMonth}
            onChange={(e) =>
              setFilterMonth(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
          >
            <option value="ALL">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Bulan {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <TransactionSummary transactions={filteredTransactions} />

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Catatan</th>
                <th className="px-6 py-4 font-medium">Akun</th>
                <th className="px-6 py-4 font-medium text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Tidak ada transaksi pada bulan ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr
                    key={`${tx.timestamp}-${idx}`}
                    className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {formatDate(tx.date, "id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {tx.childCategory}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {tx.parentCategory}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 max-w-[200px] truncate" title={tx.notes}>
                      {tx.notes}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {tx.account}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-6 py-4 text-right font-medium",
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-900 dark:text-zinc-100"
                      )}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(tx.amount, "IDR", "id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
