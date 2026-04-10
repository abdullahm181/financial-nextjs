/**
 * Budget Plan — single source of truth.
 * Update values here; both dashboard and summary pages import from this file.
 */
export const BUDGET_PLAN: Record<string, number> = {
  // SALDO AWAL
  "Saldo Bulan Lalu": 0,
  // A: PEMASUKAN
  "Gaji": 10_000_000,
  "Hutang": 0,
  "Bunga Bank": 0,
  "Lainnya": 0,
  "TOTAL PEMASUKAN": 10_000_000,
  // B1: HIDUP KELUARGA
  "KPR/Kontrakan": 920_000,
  "Belanja Harian": 465_000,
  "Belanja Bulanan": 1_300_000,
  "Makan di luar": 200_000,
  "Transportasi/Bensin": 650_000,
  "Hobi / rekreasi": 0,
  "Motor": 150_000,
  "Perawatan": 200_000,
  "Nongkrong/Hiburan/Teman": 200_000,
  "Kantor": 100_000,
  "Kesehatan": 0,
  "Infaq": 0,
  "Piutang": 0,
  "Parkir": 30_000,
  "Utilitas(Gas,Air,Internet,Listrik,DLL)": 475_000,
  "Rumah(Perbaikan,Furniture,DLL)": 0,
  "Parenting ( keperluan , Uang jajan anak)": 0,
  "Gaya Hidup & Pribadi": 300_000,
  "Biaya Admin": 15_000,
  // B2: KELUARGA INTI
  "Keperluan Keluaga Amin": 1_500_000,
  "Keperluan Keluaga Maya": 500_000,
  // B4: LIBURAN & LAINNYA
  "Biaya Liburan General": 0,
  "Hilang": 0,
  "Lainnya_B4": 200_000,
  // TOTAL PENGELUARAN
  "TOTAL PENGELUARAN": 7_205_000,
  // C: TABUNGAN
  "Dana darurat": 0,
  "Dana tabungan Rumah": 2_795_000,
  "Dana tabungan pendidikan anak": 0,
  "Dana tabungan parenting": 0,
  "Dana tabungan pensiun": 0,
  "TOTAL TABUNGAN": 2_795_000,
  // RINGKASAN
  "Pengeluaran / Pemasukan": 0,
  "Tabungan / Pemasukan": 0,
  "SALDO SYSTEM": 0,
  "SALDO REAL": 0,
  "SELISIH": 0,
  "SALDO TABUNGAN": 0,
  "TOTAL UANG": 0,
};
