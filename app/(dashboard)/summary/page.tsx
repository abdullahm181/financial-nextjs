"use client";

import { useEffect, useState } from "react";
import { TransactionRecord } from "@/services/transaction";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { BUDGET_PLAN } from "@/lib/budget-plan";

type MonthData = {
  id: string; // The selectedMonth param e.g. "2026-04"
  monthStr: string;
  cutStart: string;
  cutEnd: string;
  serverSaldoBulanLalu: number;
  gaji: number;
  hutang: number;
  bungaBank: number;
  pemasukanLainnya: number;
  serverTotalPemasukan: number;
  serverTotalPengeluaran: number;
  serverSetorTabungan: number;
  serverSaldoTabungan: number;
  serverSaldoReal: number;
  
  b1: Record<string, number>;
  b2: Record<string, number>;
  b4: Record<string, number>;
  lainLainPengeluaran: number;
  
  c: Record<string, number>;
  lainLainTabungan: number;

  saldoSystem: number;
  totalUang: number;
  selisih: number;
  pctTabungan: number;
  pctPengeluaran: number;
};

export default function SummaryPage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    const d = new Date();
    return [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [dataSeries, setDataSeries] = useState<MonthData[]>([]);

  useEffect(() => {
    async function loadAllData() {
      if (selectedMonths.length === 0) return;
      setIsLoading(true);
      try {
        const series = await Promise.all(
          selectedMonths.map(async (monthStrParam) => {
            const targetDate = `${monthStrParam}-10`;
            const res = await fetch(`/api/transactions?targetDate=${targetDate}&t=${Date.now()}`);
            const json = await res.json();

            if (!json.success || !json.period) {
               return null;
            }

            const transactions: TransactionRecord[] = json.data || [];
            
            const serverSaldoBulanLalu = Number(json.saldoBulanLalu || 0);
            const serverTotalPengeluaran = Number(json.totalPengeluaran || 0);
            const serverSetorTabungan = Number(json.setorTabungan || 0);
            const serverTotalPemasukan = Number(json.totalPemasukan || 0);
            const serverSaldoTabungan = Number(json.saldoTabungan || 0);
            const serverSaldoReal = Number(json.saldoReal || 0);

            let gaji = 0;
            let hutang = 0;
            let bungaBank = 0;
            let pemasukanLainnya = 0;

            const b1 = {
              "KPR/Kontrakan": 0, "Belanja Harian": 0, "Belanja Bulanan": 0, "Makan di luar": 0,
              "Transportasi/Bensin": 0, "Hobi / rekreasi": 0, "Motor": 0, "Perawatan": 0,
              "Nongkrong/Hiburan/Teman": 0, "Kantor": 0, "Kesehatan": 0, "Infaq": 0,
              "Piutang": 0, "Parkir": 0, "Utilitas(Gas,Air,Internet,Listrik,DLL)": 0,
              "Rumah(Perbaikan,Furniture,DLL)": 0, "Parenting ( keperluan , Uang jajan anak)": 0,
              "Gaya Hidup & Pribadi": 0, "Biaya Admin": 0
            };
            const b2 = { "Keperluan Keluaga Amin": 0, "Keperluan Keluaga Maya": 0 };
            const b4 = { "Biaya Liburan General": 0, "Hilang": 0, "Lainnya": 0 };
            let lainLainPengeluaran = 0;

            const c = {
              "Dana darurat": 0, "Dana tabungan Rumah": 0, "Dana tabungan pendidikan anak": 0,
              "Dana tabungan parenting": 0, "Dana tabungan pensiun": 0
            };
            let lainLainTabungan = 0;

            const searchStart = new Date(json.period.cutStart); searchStart.setHours(0,0,0,0);
            const searchEnd = new Date(json.period.cutEnd); searchEnd.setHours(23,59,59,999);
            
            const gajiSearchStart = new Date(searchStart); gajiSearchStart.setDate(gajiSearchStart.getDate() - 1);
            const gajiSearchEnd = new Date(searchEnd); gajiSearchEnd.setDate(gajiSearchEnd.getDate() - 1);

            transactions.forEach(t => {
              const d = new Date(t.date);
              if (isNaN(d.getTime())) return;
              d.setHours(0,0,0,0);

              const amt = Number(t.amount) || 0;
              const parts = t.category.split("~");
              const parentCat = parts[0].trim().toUpperCase();
              const childCat = parts.slice(1).join("~").trim();

              if (d >= gajiSearchStart && d <= gajiSearchEnd && parentCat === "A: PEMASUKAN" && childCat.toUpperCase() === "GAJI") {
                gaji += amt;
                return;
              }

              if (d >= searchStart && d <= searchEnd) {
                if (parentCat === "A: PEMASUKAN" && childCat.toUpperCase() !== "GAJI") {
                  const cUp = childCat.toUpperCase();
                  if (cUp === "HUTANG") hutang += amt;
                  else if (cUp === "BUNGA BANK") bungaBank += amt;
                  else pemasukanLainnya += amt;
                } else if (parentCat === "B: PENGELUARAN") {
                  if (b1[childCat as keyof typeof b1] !== undefined) b1[childCat as keyof typeof b1] += amt;
                  else if (b2[childCat as keyof typeof b2] !== undefined) b2[childCat as keyof typeof b2] += amt;
                  else if (b4[childCat as keyof typeof b4] !== undefined) b4[childCat as keyof typeof b4] += amt;
                  else lainLainPengeluaran += amt;
                } else if (parentCat === "C: TABUNGAN") {
                  if (c[childCat as keyof typeof c] !== undefined) c[childCat as keyof typeof c] += amt;
                  else lainLainTabungan += amt;
                }
              }
            });

            const saldoSystem = serverSaldoBulanLalu + serverTotalPemasukan - serverTotalPengeluaran - serverSetorTabungan;
            const totalUang = saldoSystem + serverSaldoTabungan;
            const selisih = saldoSystem - serverSaldoReal;
            const pctTabungan = serverTotalPemasukan ? (serverSetorTabungan / serverTotalPemasukan) * 100 : 0;
            const pctPengeluaran = serverTotalPemasukan ? (serverTotalPengeluaran / serverTotalPemasukan) * 100 : 0;

            const resData: MonthData = {
              id: monthStrParam,
              monthStr: json.period.monthStr,
              cutStart: json.period.cutStart,
              cutEnd: json.period.cutEnd,
              serverSaldoBulanLalu, gaji, hutang, bungaBank, pemasukanLainnya,
              serverTotalPemasukan, serverTotalPengeluaran, serverSetorTabungan,
              serverSaldoTabungan, serverSaldoReal,
              b1, b2, b4, lainLainPengeluaran, c, lainLainTabungan,
              saldoSystem, totalUang, selisih, pctTabungan, pctPengeluaran
            };
            return resData;
          })
        );
        setDataSeries(series.filter(Boolean) as MonthData[]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllData();
  }, [selectedMonths]);

  const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

  const changeMonth = (idx: number, newVal: string) => {
    const copy = [...selectedMonths];
    copy[idx] = newVal;
    setSelectedMonths(copy);
  };

  const removeMonth = (idx: number) => {
    if (selectedMonths.length <= 1) return;
    const copy = [...selectedMonths];
    copy.splice(idx, 1);
    setSelectedMonths(copy);
  };

  const addMonth = () => {
    const last = selectedMonths[selectedMonths.length - 1];
    const [year, month] = last.split("-").map(Number);
    const nextDate = new Date(year, month, 1); 
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonths.length < 12) {
      setSelectedMonths([...selectedMonths, nextMonthStr]);
    }
  };

  const getBudgetPlan = (label: string): string => {
    const val = BUDGET_PLAN[label];
    if (val === undefined || val === 0) return "-";
    return `Rp ${fmt(val)}`;
  };

  const getBudgetPlanValue = (label: string): number => BUDGET_PLAN[label] ?? 0;

  const renderRow = (
    label: string,
    accessor: (d: MonthData) => React.ReactNode,
    hideIfZeroAll = false,
    zeroCheck?: (d: MonthData) => number,
    isHeader = false,
    numericValue?: (d: MonthData) => number,
    highlightMode?: "over" | "under"
  ) => {
    if (hideIfZeroAll && zeroCheck) {
      if (dataSeries.every(d => zeroCheck(d) === 0)) return null;
    }
    const budget = getBudgetPlanValue(label);
    return (
      <tr key={label} className={cn("group border-b border-zinc-100 dark:border-zinc-800/50", isHeader && "bg-zinc-50/50 dark:bg-zinc-800/30 font-bold")}>
        <td className="sticky left-0 z-10 py-2 pl-4 pr-4 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 text-sm truncate shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] text-left">
          {label}
        </td>
        <td className="sticky left-[200px] sm:left-[260px] z-10 py-2 px-4 text-right tabular-nums text-violet-700 dark:text-violet-400 text-sm font-medium bg-violet-50 dark:bg-violet-950 group-hover:bg-violet-100 dark:group-hover:bg-violet-900 transition-colors border-r border-violet-200 dark:border-violet-800 shadow-[1px_0_0_0_rgba(139,92,246,0.2)] min-w-[120px] max-w-[130px] w-[125px]">
          {getBudgetPlan(label)}
        </td>
        {dataSeries.map((d, i) => {
          const actual = numericValue ? numericValue(d) : null;
          const pct = (budget > 0 && actual !== null) ? (actual / budget) * 100 : null;
          const isHighlighted =
            pct !== null &&
            ((highlightMode === "over" && pct > 100) ||
             (highlightMode === "under" && pct < 100));
          return (
            <td key={i} className={cn(
              "py-2 px-4 text-right tabular-nums text-sm font-medium transition-colors",
              isHighlighted
                ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                : "text-zinc-800 dark:text-zinc-200"
            )}>
              <div className="flex flex-col items-end gap-0">
                <span>{accessor(d)}</span>
                {pct !== null && (
                  <span className={cn(
                    "text-[10px] font-bold tabular-nums leading-tight",
                    isHighlighted ? "text-rose-500 dark:text-rose-400" : "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  const renderRecordRows = (records: Record<string, number>, section: "b1" | "b2" | "b4" | "c") => {
    const highlightMode = section === "c" ? "under" : "over";
    return Object.keys(records).map((key) => {
      return renderRow(
        key,
        (d) => `Rp ` + fmt((d[section] as Record<string, number>)[key]),
        false, undefined, false,
        (d) => (d[section] as Record<string, number>)[key],
        highlightMode
      );
    });
  };

  const renderSectionHeader = (label: string, colorClass: string) => (
    <tr className={cn(colorClass)}>
      <td className="py-3 pl-4 sticky left-0 z-10 bg-inherit text-xs font-black uppercase tracking-widest shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] text-left whitespace-nowrap">
        {label}
      </td>
      <td className="sticky left-[200px] sm:left-[260px] z-10 bg-inherit border-r border-violet-200 dark:border-violet-800 min-w-[120px] max-w-[130px] w-[125px]"></td>
      {dataSeries.map((_, i) => (
        <td key={i} className="bg-inherit"></td>
      ))}
      {selectedMonths.length < 12 && <td className="bg-inherit"></td>}
    </tr>
  );

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-h-0 overflow-hidden">
        <div className="mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden relative">
          
          <div className={cn(
            "flex-1 overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 relative transition-all duration-500 min-h-0",
            isLoading && dataSeries.length > 0 && "opacity-60 saturate-[0.2] pointer-events-none"
          )}>
            {/* Animated Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 dark:bg-zinc-950/20 backdrop-blur-[1px] animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-white dark:bg-zinc-900/90 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-500">
                   <div className="relative flex items-center justify-center">
                      <div className="absolute h-12 w-12 border-4 border-emerald-500/20 rounded-full" />
                      <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                   </div>
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Sinkronisasi</span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Mohon Tunggu...</span>
                   </div>
                </div>
              </div>
            )}

            {dataSeries.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full p-20 text-zinc-500 text-sm italic font-medium">
                Pilih periode untuk melihat perbandingan data keuangan.
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-zinc-100 dark:bg-zinc-800">
                    <th className="sticky left-0 z-40 py-4 pl-6 text-sm font-black text-zinc-500 uppercase tracking-widest w-[200px] sm:w-[260px] bg-zinc-100 dark:bg-zinc-800 shadow-[1px_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_1px_0_0_rgba(255,255,255,0.05)] align-top text-left">
                       <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <Link href="/dashboard" className="p-1.5 -ml-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-500">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                               </svg>
                            </Link>
                            <span className="text-zinc-900 dark:text-zinc-100 font-black text-xs">SUMMARY REPORT</span>
                          </div>
                       </div>
                    </th>
                    <th className="sticky left-[200px] sm:left-[260px] z-40 py-4 px-4 text-right text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest min-w-[120px] max-w-[130px] w-[125px] bg-violet-50 dark:bg-violet-950 border-r border-violet-200 dark:border-violet-800 shadow-[1px_1px_0_0_rgba(139,92,246,0.25)] align-bottom">
                      Budget Plan
                    </th>
                    {selectedMonths.map((m, idx) => (
                      <th key={idx} className="py-2 px-4 text-right border-b border-zinc-200 dark:border-zinc-700 min-w-[200px] align-top bg-zinc-100 dark:bg-zinc-800">
                        <div className="flex flex-col gap-1.5 items-end">
                          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <input 
                              type="month"
                              value={m}
                              disabled={isLoading}
                              onChange={(e) => changeMonth(idx, e.target.value)}
                              className="bg-transparent px-1.5 py-1 text-xs font-black outline-none dark:text-white"
                            />
                            {selectedMonths.length > 1 && (
                              <button 
                                onClick={() => removeMonth(idx)} 
                                disabled={isLoading}
                                className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                              </button>
                            )}
                          </div>
                          {dataSeries[idx] ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-blue-600 dark:text-blue-400">{dataSeries[idx].monthStr}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {new Date(dataSeries[idx].cutStart).toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit' })} - {new Date(dataSeries[idx].cutEnd).toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          ) : (
                            <div className="h-8 animate-pulse bg-zinc-200 dark:bg-zinc-700 w-24 rounded-md" />
                          )}
                        </div>
                      </th>
                    ))}
                    {selectedMonths.length < 12 && (
                      <th className="py-2 px-4 text-right border-b border-zinc-200 dark:border-zinc-700 min-w-[140px] bg-zinc-100 dark:bg-zinc-800">
                        <button 
                          onClick={addMonth} 
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-emerald-500 bg-white dark:bg-zinc-900 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 text-xs font-black transition-all disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" /></svg>
                          Compare
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {/* SALDO AWAL */}
                  {renderSectionHeader("SALDO AWAL", "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400")}
                  {renderRow("Saldo Bulan Lalu", d => `Rp ${fmt(d.serverSaldoBulanLalu)}`, false, undefined, true)}

                  {/* A: PEMASUKAN */}
                  {renderSectionHeader("A: PEMASUKAN", "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400")}
                  {renderRow("Gaji", d => `Rp ${fmt(d.gaji)}`, false, undefined, false, d => d.gaji, "under")}
                  {renderRow("Hutang", d => `Rp ${fmt(d.hutang)}`, true, d => d.hutang, false, d => d.hutang, "under")}
                  {renderRow("Bunga Bank", d => `Rp ${fmt(d.bungaBank)}`, true, d => d.bungaBank, false, d => d.bungaBank, "under")}
                  {renderRow("Lainnya", d => `Rp ${fmt(d.pemasukanLainnya)}`, true, d => d.pemasukanLainnya, false, d => d.pemasukanLainnya, "under")}
                  {renderRow("TOTAL PEMASUKAN", d => `Rp ${fmt(d.serverTotalPemasukan)}`, false, undefined, true, d => d.serverTotalPemasukan, "under")}

                  {/* B: PENGELUARAN */}
                  {renderSectionHeader("B: PENGELUARAN", "bg-rose-50 text-rose-600 dark:bg-rose-900/10 dark:text-rose-400")}
                  <tr className="bg-zinc-50/10 dark:bg-zinc-800/10 font-black">
                    <td className="sticky left-0 z-10 py-2 pl-6 bg-white dark:bg-zinc-950 text-[10px] font-bold text-zinc-400 uppercase shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] text-left">B1: HIDUP KELUARGA</td>
                    <td className="sticky left-[200px] sm:left-[260px] z-10 bg-violet-50 dark:bg-violet-950 border-r border-violet-200 dark:border-violet-800 min-w-[120px] max-w-[130px] w-[125px]"></td>
                    {dataSeries.map((_, i) => <td key={i} className="bg-white dark:bg-zinc-950"></td>)}
                    {selectedMonths.length < 12 && <td className="bg-white dark:bg-zinc-950"></td>}
                  </tr>
                  {renderRecordRows(dataSeries[0]?.b1 || {}, "b1")}
                  
                  <tr className="bg-zinc-50/10 dark:bg-zinc-800/10 font-black">
                    <td className="sticky left-0 z-10 py-2 pl-6 bg-white dark:bg-zinc-950 text-[10px] font-bold text-zinc-400 uppercase shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] text-left">B2: KELUARGA INTI</td>
                    <td className="sticky left-[200px] sm:left-[260px] z-10 bg-violet-50 dark:bg-violet-950 border-r border-violet-200 dark:border-violet-800 min-w-[120px] max-w-[130px] w-[125px]"></td>
                    {dataSeries.map((_, i) => <td key={i} className="bg-white dark:bg-zinc-950"></td>)}
                    {selectedMonths.length < 12 && <td className="bg-white dark:bg-zinc-950"></td>}
                  </tr>
                  {renderRecordRows(dataSeries[0]?.b2 || {}, "b2")}

                  <tr className="bg-zinc-50/10 dark:bg-zinc-800/10 font-black">
                    <td className="sticky left-0 z-10 py-2 pl-6 bg-white dark:bg-zinc-950 text-[10px] font-bold text-zinc-400 uppercase shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] text-left">B4: LIBURAN & LAINNYA</td>
                    <td className="sticky left-[200px] sm:left-[260px] z-10 bg-violet-50 dark:bg-violet-950 border-r border-violet-200 dark:border-violet-800 min-w-[120px] max-w-[130px] w-[125px]"></td>
                    {dataSeries.map((_, i) => <td key={i} className="bg-white dark:bg-zinc-950"></td>)}
                    {selectedMonths.length < 12 && <td className="bg-white dark:bg-zinc-950"></td>}
                  </tr>
                  {renderRecordRows(dataSeries[0]?.b4 || {}, "b4")}
                  {renderRow("TOTAL PENGELUARAN", d => `Rp ${fmt(d.serverTotalPengeluaran)}`, false, undefined, true, d => d.serverTotalPengeluaran, "over")}

                  {/* C: TABUNGAN */}
                  {renderSectionHeader("C: TABUNGAN", "bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400")}
                  {renderRecordRows(dataSeries[0]?.c || {}, "c")}
                  {renderRow("TOTAL TABUNGAN", d => `Rp ${fmt(d.serverSetorTabungan)}`, false, undefined, true, d => d.serverSetorTabungan, "under")}

                  {/* SUMMARY & METRICS */}
                  {renderSectionHeader("RINGKASAN & REKONSILIASI", "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}
                  {renderRow("Pengeluaran / Pemasukan", d => `${d.pctPengeluaran.toFixed(1)}%`)}
                  {renderRow("Tabungan / Pemasukan", d => `${d.pctTabungan.toFixed(1)}%`)}
                  {renderRow("SALDO SYSTEM", d => `Rp ${fmt(d.saldoSystem)}`, false, undefined, true)}
                  {renderRow("SALDO REAL", d => `Rp ${fmt(d.serverSaldoReal)}`)}
                  {renderRow("SELISIH", d => (
                    <span className={cn(d.selisih === 0 ? "text-zinc-500" : d.selisih < 0 ? "text-emerald-500" : "text-rose-500")}>
                      {d.selisih > 0 ? "Kurang " : d.selisih < 0 ? "Lebih " : ""}Rp {fmt(Math.abs(d.selisih))}
                    </span>
                  ))}
                  {renderRow("SALDO TABUNGAN", d => `Rp ${fmt(d.serverSaldoTabungan)}`)}
                  {renderRow("TOTAL UANG", d => `Rp ${fmt(d.totalUang)}`, false, undefined, true)}
                  {renderRow("SALDO BISA DI PAKAI", d => {
                    const budgetPengeluaran = BUDGET_PLAN["TOTAL PENGELUARAN"] ?? 0;
                    const saldo = budgetPengeluaran - d.serverTotalPengeluaran;
                    return (
                      <span className={cn(
                        "font-black",
                        saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {saldo < 0 ? "-" : ""}Rp {fmt(Math.abs(saldo))}
                      </span>
                    );
                  }, false, undefined, true)}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
