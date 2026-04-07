"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib";

type TransactionRecord = {
  id: number;
  date: string;
  category: string;
  amount: number;
  account: string;
  notes: string;
  created_at: string;
};

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Layout States
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [daysFilter, setDaysFilter] = useState("7");
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [serverSaldoTabungan, setServerSaldoTabungan] = useState<number>(0);
  const [serverSaldoBulanLalu, setServerSaldoBulanLalu] = useState<number>(0);
  const [serverTotalPengeluaran, setServerTotalPengeluaran] = useState<number>(0);
  const [serverSetorTabungan, setServerSetorTabungan] = useState<number>(0);
  const [serverTotalPemasukan, setServerTotalPemasukan] = useState<number>(0);
  const [periodInfo, setPeriodInfo] = useState<{ monthStr: string, cutStart: string, cutEnd: string } | null>(null);

  // Form States
  const [formNotes, setFormNotes] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("B: PENGELUARAN~Belanja Harian");
  const [formAccount, setFormAccount] = useState("Cash - Amin");
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
  });

  const [saldoRealInput, setSaldoRealInput] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Load Transactions
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions?t=" + Date.now());
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTransactions(json.data);
        if (json.saldoReal !== undefined && json.saldoReal !== 0) {
          setSaldoRealInput(Number(json.saldoReal).toLocaleString("id-ID"));
        }
        if (json.saldoTabungan !== undefined) {
          setServerSaldoTabungan(Number(json.saldoTabungan));
        }
        if (json.saldoBulanLalu !== undefined) setServerSaldoBulanLalu(Number(json.saldoBulanLalu));
        if (json.totalPengeluaran !== undefined) setServerTotalPengeluaran(Number(json.totalPengeluaran));
        if (json.setorTabungan !== undefined) setServerSetorTabungan(Number(json.setorTabungan));
        if (json.totalPemasukan !== undefined) setServerTotalPemasukan(Number(json.totalPemasukan));
        if (json.period) {
          setPeriodInfo(json.period);
        }
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formNotes.trim() || !formAmount || isSubmitting) return;
    setIsSubmitting(true);

    const amountVal = Number(formAmount.replace(/\D/g, ""));

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          category: formCategory,
          amount: amountVal,
          account: formAccount,
          notes: formNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
        setFormNotes("");
        setFormAmount("");
        // Hide form on mobile optionally, but let's keep it visible
        notesRef.current?.focus();
      } else {
        alert("Gagal menyimpan transaksi: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setFormAmount(raw ? Number(raw).toLocaleString("id-ID") : "");
  };



  // --- Metrics Calculation (Backend strictly) ---
  const saldoSystem = serverSaldoBulanLalu + serverTotalPemasukan - serverTotalPengeluaran - serverSetorTabungan;
  const saldoTabungan = serverSaldoTabungan;
  const totalUang = saldoSystem + saldoTabungan;
  const saldoReal = Number(saldoRealInput.replace(/\D/g, "")) || 0;
  const selisih = saldoSystem - saldoReal;

  const pctTabungan = serverTotalPemasukan ? (serverSetorTabungan / serverTotalPemasukan) * 100 : 0;
  const pctPengeluaran = serverTotalPemasukan
    ? (serverTotalPengeluaran / serverTotalPemasukan) * 100
    : 0;

  const fmt = (num: number) => num.toLocaleString("id-ID");
  const formatDateShort = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  // --- Filtered List for View ---
  const filteredList = transactions.filter((t) => {
    if (daysFilter === "all") return true;
    const tDate = new Date(t.date);
    const diffDays = (Date.now() - tDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= Number(daysFilter);
  });

  // --- Group logic ---
  const groupedDates: { title: string; rawDate: Date; transactions: TransactionRecord[] }[] = [];
  filteredList.forEach((t) => {
    const d = new Date(t.date);
    const title = d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    
    let group = groupedDates.find(g => g.title === title);
    if (!group) {
      group = { title, rawDate: d, transactions: [] };
      groupedDates.push(group);
    }
    group.transactions.push(t);
  });
  
  // Sort by date descending
  groupedDates.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  
  const toggleDateGroup = (title: string) => {
    setCollapsedDates(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* HEADER / FORM */}
      <div className="shrink-0 border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 z-10 transition-all">
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="flex w-full items-center justify-between px-5 py-4 font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
            </span>
            <span>Tambah Transaksi Baru</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cn("w-5 h-5 transition-transform text-zinc-400", isFormVisible ? "rotate-180" : "rotate-0")}>
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {isFormVisible && (
          <form onSubmit={handleSubmit} className="px-5 pb-5 pt-1 space-y-4">
            <div className="flex gap-2 items-start">
              <textarea
                ref={notesRef}
                required
                rows={1}
                value={formNotes}
                onChange={(e) => {
                  setFormNotes(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Catatan Transaksi..."
                disabled={isSubmitting}
                className="flex-1 resize-none overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-600"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <input
                type="text"
                inputMode="numeric"
                required
                value={formAmount}
                onChange={handleAmountChange}
                placeholder="Rp Nominal"
                disabled={isSubmitting}
                className="h-[44px] w-[130px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 sm:w-[160px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-600"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={isSubmitting}
                className="h-[44px] w-full sm:w-[140px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
              
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                disabled={isSubmitting}
                className="h-[44px] flex-1 min-w-[50%] sm:min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <optgroup label="B: PENGELUARAN">
                  <option value="" disabled className="font-semibold text-zinc-400">── B1: BIAYA HIDUP KELUARGA ──</option>
                  <option value="B: PENGELUARAN~KPR/Kontrakan">&nbsp;&nbsp;&nbsp;&nbsp;KPR/Kontrakan</option>
                  <option value="B: PENGELUARAN~Belanja Harian">&nbsp;&nbsp;&nbsp;&nbsp;Belanja Harian</option>
                  <option value="B: PENGELUARAN~Belanja Bulanan">&nbsp;&nbsp;&nbsp;&nbsp;Belanja Bulanan</option>
                  <option value="B: PENGELUARAN~Makan di luar">&nbsp;&nbsp;&nbsp;&nbsp;Makan di luar</option>
                  <option value="B: PENGELUARAN~Transportasi/Bensin">&nbsp;&nbsp;&nbsp;&nbsp;Transportasi/Bensin</option>
                  <option value="B: PENGELUARAN~Motor">&nbsp;&nbsp;&nbsp;&nbsp;Motor</option>
                  <option value="B: PENGELUARAN~Hobi / rekreasi">&nbsp;&nbsp;&nbsp;&nbsp;Hobi / rekreasi</option>
                  <option value="B: PENGELUARAN~Perawatan">&nbsp;&nbsp;&nbsp;&nbsp;Perawatan</option>
                  <option value="B: PENGELUARAN~Nongkrong/Hiburan/Teman">&nbsp;&nbsp;&nbsp;&nbsp;Nongkrong/Hiburan/Teman</option>
                  <option value="B: PENGELUARAN~Kantor">&nbsp;&nbsp;&nbsp;&nbsp;Kantor</option>
                  <option value="B: PENGELUARAN~Kesehatan">&nbsp;&nbsp;&nbsp;&nbsp;Kesehatan</option>
                  <option value="B: PENGELUARAN~Infaq">&nbsp;&nbsp;&nbsp;&nbsp;Infaq</option>
                  <option value="B: PENGELUARAN~Piutang">&nbsp;&nbsp;&nbsp;&nbsp;Piutang</option>
                  <option value="B: PENGELUARAN~Parkir">&nbsp;&nbsp;&nbsp;&nbsp;Parkir</option>
                  <option value="B: PENGELUARAN~Utilitas(Gas,Air,Internet,Listrik,DLL)">&nbsp;&nbsp;&nbsp;&nbsp;Utilitas(Gas,Air,Internet,Listrik,DLL)</option>
                  <option value="B: PENGELUARAN~Rumah(Perbaikan,Furniture,DLL)">&nbsp;&nbsp;&nbsp;&nbsp;Rumah(Perbaikan,Furniture,DLL)</option>
                  <option value="B: PENGELUARAN~Parenting ( keperluan , Uang jajan anak)">&nbsp;&nbsp;&nbsp;&nbsp;Parenting</option>
                  <option value="B: PENGELUARAN~Gaya Hidup & Pribadi">&nbsp;&nbsp;&nbsp;&nbsp;Gaya Hidup & Pribadi</option>
                  <option value="B: PENGELUARAN~Biaya Admin">&nbsp;&nbsp;&nbsp;&nbsp;Biaya Admin</option>
                  
                  <option value="" disabled className="font-semibold text-zinc-400">── B2: BIAYA KELUARGA INTI ──</option>
                  <option value="B: PENGELUARAN~Keperluan Keluaga Amin">&nbsp;&nbsp;&nbsp;&nbsp;Keperluan Keluaga Amin</option>
                  <option value="B: PENGELUARAN~Keperluan Keluaga Maya">&nbsp;&nbsp;&nbsp;&nbsp;Keperluan Keluaga Maya</option>
                  
                  <option value="" disabled className="font-semibold text-zinc-400">── B4: BIAYA LIBURAN & LAINNYA ──</option>
                  <option value="B: PENGELUARAN~Biaya Liburan General">&nbsp;&nbsp;&nbsp;&nbsp;Biaya Liburan General</option>
                  <option value="B: PENGELUARAN~Hilang">&nbsp;&nbsp;&nbsp;&nbsp;Hilang</option>
                  <option value="B: PENGELUARAN~Lainnya">&nbsp;&nbsp;&nbsp;&nbsp;Lainnya</option>
                </optgroup>

                <optgroup label="A: PEMASUKAN">
                  <option value="A: PEMASUKAN~Gaji">&nbsp;&nbsp;&nbsp;&nbsp;Gaji</option>
                  <option value="A: PEMASUKAN~Hutang">&nbsp;&nbsp;&nbsp;&nbsp;Hutang</option>
                  <option value="A: PEMASUKAN~Bunga Bank">&nbsp;&nbsp;&nbsp;&nbsp;Bunga Bank</option>
                  <option value="A: PEMASUKAN~Lainnya">&nbsp;&nbsp;&nbsp;&nbsp;Lainnya</option>
                </optgroup>
                
                <optgroup label="C: TABUNGAN">
                  <option value="C: TABUNGAN~Dana darurat">&nbsp;&nbsp;&nbsp;&nbsp;Dana darurat</option>
                  <option value="C: TABUNGAN~Dana tabungan Rumah">&nbsp;&nbsp;&nbsp;&nbsp;Dana tabungan Rumah</option>
                  <option value="C: TABUNGAN~Dana tabungan pendidikan anak">&nbsp;&nbsp;&nbsp;&nbsp;Dana tabungan pendidikan anak</option>
                  <option value="C: TABUNGAN~Dana tabungan parenting">&nbsp;&nbsp;&nbsp;&nbsp;Dana tabungan parenting</option>
                  <option value="C: TABUNGAN~Dana tabungan pensiun">&nbsp;&nbsp;&nbsp;&nbsp;Dana tabungan pensiun</option>
                </optgroup>
              </select>

              <select
                value={formAccount}
                onChange={(e) => setFormAccount(e.target.value)}
                disabled={isSubmitting}
                className="h-[44px] flex-1 min-w-[30%] sm:min-w-0 sm:w-[130px] sm:flex-none rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="Cash - Amin">Cash - Amin</option>
                <option value="Cash - Maya">Cash - Maya</option>
                <option value="Bank - Blu BCA Maya">Bank - Blu BCA Maya</option>
                <option value="Bank - SeaBank">Bank - SeaBank</option>
                <option value="Bank - Mandiri">Bank - Mandiri</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting || !formNotes.trim() || !formAmount}
                className="h-[44px] w-full sm:w-auto rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MIDDLE: Transaction List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Riwayat Transaksi</h2>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              className="rounded-lg border-none bg-transparent px-2 py-1 text-sm font-medium text-zinc-500 outline-none hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
            >
              <option value="7">7 Hari Terakhir</option>
              <option value="15">15 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada transaksi di rentang waktu ini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedDates.map((group) => {
                const isCollapsed = collapsedDates[group.title];
                
                // Hitung total harian dari group ini
                let dailyPemasukan = 0;
                let dailyPengeluaran = 0;
                group.transactions.forEach(t => {
                  const amt = Number(t.amount);
                  if (t.category.startsWith("A:")) dailyPemasukan += amt;
                  else if (t.category.startsWith("B:")) dailyPengeluaran += amt;
                });
                
                return (
                  <div key={group.title} className="flex flex-col space-y-2">
                    <button 
                      onClick={() => toggleDateGroup(group.title)}
                      className="flex items-center justify-between py-1 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md px-1 -mx-1 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{group.title}</span>
                        <div className="flex items-center text-xs font-semibold gap-2">
                          {dailyPemasukan > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{fmt(dailyPemasukan)}</span>}
                          {dailyPengeluaran > 0 && <span className="text-red-500 dark:text-red-400">-{fmt(dailyPengeluaran)}</span>}
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cn("w-4 h-4 text-zinc-400 transition-transform", isCollapsed ? "rotate-0" : "rotate-180")}>
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {!isCollapsed && (
                      <div className="grid gap-3">
                        {group.transactions.map((t) => {
                          const isIncome = t.category.startsWith("A:");
                          const isTabungan = t.category.startsWith("C:");
                          const icon = isIncome ? "💰" : isTabungan ? "🏦" : "💸";
                          const amountColor = isIncome ? "text-emerald-600 dark:text-emerald-400" : isTabungan ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100";
                          const sign = isIncome ? "+" : isTabungan ? "-" : "-";
                          
                          return (
                            <div key={t.id} className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all dark:border-zinc-800 dark:bg-zinc-900/50">
                              <div className="flex justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
                                    {icon}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                      {t.notes}
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                      {t.category.split("~")[1] || t.category} • {t.account}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                  <span className={cn("font-bold", amountColor)}>
                                    {sign}Rp {fmt(t.amount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: Summary Metrics */}
      <div className="fixed bottom-0 left-0 w-full z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-xl shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] dark:border-zinc-800 dark:bg-zinc-950/95 transition-all">
        <button
          onClick={() => setIsSummaryVisible(!isSummaryVisible)}
          className="flex w-full items-center justify-between px-5 py-3.5 focus:outline-none"
        >
          {isSummaryVisible ? (
             <div className="flex flex-col text-left min-w-0 pr-2">
               <span className="font-bold text-zinc-800 dark:text-zinc-100 truncate">Ringkasan Keuangan</span>
               <span className="text-xs text-zinc-500 font-medium truncate">
                 {periodInfo?.monthStr} &middot; {formatDateShort(periodInfo?.cutStart || "")} ~ {formatDateShort(periodInfo?.cutEnd || "")}
               </span>
             </div>
          ) : (
             <div className="flex flex-col text-left min-w-0 pr-2">
               <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{periodInfo?.monthStr || "-"}</span>
               <span className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">
                 {formatDateShort(periodInfo?.cutStart || "")} ~ {formatDateShort(periodInfo?.cutEnd || "")}
               </span>
             </div>
          )}
          
          <div className="flex items-center gap-3 shrink-0">
            {!isSummaryVisible && (
              <div className="flex flex-col items-end justify-center">
                <span className="text-[8px] sm:text-xs font-medium text-zinc-500 uppercase leading-tight mb-1">
                  System : <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">Rp {fmt(saldoSystem)}</span>
                </span>
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded leading-none">
                  <span className="text-[8px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase">Total :</span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Rp {fmt(totalUang)}</span>
                </div>
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cn("w-5 h-5 shrink-0 transition-transform text-zinc-400", isSummaryVisible ? "rotate-180" : "rotate-0")}>
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {isSummaryVisible && (
          <div className="px-5 pb-5 pt-1 overflow-y-auto max-h-[60vh] sm:max-h-[75vh]">
            <div className="mx-auto max-w-3xl grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
              
              {/* Saldo Boxes */}
              <div className="col-span-1 flex flex-col justify-center rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">SALDO MENURUT SYSTEM</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Rp {fmt(saldoSystem)}</span>
              </div>
              <div className="col-span-1 flex flex-col justify-center rounded-xl bg-blue-50 p-3 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">SALDO TABUNGAN</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">Rp {fmt(saldoTabungan)}</span>
              </div>
              <div className="col-span-2 flex justify-between items-center rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">TOTAL UANG</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">Rp {fmt(totalUang)}</span>
              </div>

              {/* Rekonsiliasi (Real vs System) */}
              <div className="col-span-2 flex flex-col gap-3 py-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">SALDO REAL</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={saldoRealInput}
                    readOnly
                    placeholder="Sinkronisasi dari Google Sheets..."
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold outline-none sm:w-[200px] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-not-allowed opacity-80"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Selisih System vs Real</span>
                  <span className={cn(
                    "font-bold text-base",
                    selisih === 0 ? "text-zinc-400" : selisih < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                  )}>
                    {selisih > 0 ? "Kurang " : selisih < 0 ? "Lebih " : ""}
                    Rp {fmt(Math.abs(selisih))}
                  </span>
                </div>
              </div>

              {/* Rincian Pemasukan & Pengeluaran Bulan Ini */}
              <div className="col-span-2 flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Saldo Bulan Lalu</span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Rp {fmt(serverSaldoBulanLalu)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Pemasukan <span className="font-normal text-[10px] text-zinc-400">(Bulan Ini)</span></span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rp {fmt(serverTotalPemasukan)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Pengeluaran <span className="font-normal text-[10px] text-zinc-400">(Bulan Ini)</span></span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Rp {fmt(serverTotalPengeluaran)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Setor Tabungan <span className="font-normal text-[10px] text-zinc-400">(Bulan Ini)</span></span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Rp {fmt(serverSetorTabungan)}</span>
                </div>
              </div>

              {/* Progress Bars / Percentages */}
              <div className="col-span-1 flex flex-col justify-end gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">TABUNGAN / PEMASUKAN</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{pctTabungan.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden text-left">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(pctTabungan, 100)}%` }} />
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-end gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">PENGELUARAN / PEMASUKAN</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-orange-500">{pctPengeluaran.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden text-left">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(pctPengeluaran, 100)}%` }} />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
