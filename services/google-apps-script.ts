import { TransactionRecord } from "./transaction";

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxY8O_pC3sJnApOOQLhNMUF9S8SBaj9I0ASm7s_R2UcDKobi3A0rLCTDQsjcSJuIiPq/exec";

/**
 * Sends transaction data to a Google Apps Script Web App
 */
export async function appendToSheet(data: {
  date: string;
  category: string;
  amount: number;
  account: string;
  notes: string;
}) {
  const url = GOOGLE_APPS_SCRIPT_URL;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    redirect: "follow",
  });

  const text = await res.text();
  console.log("POST Apps Script response:", text);

  // Parse check
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid response from Google Script: " + text.slice(0, 50));
  }
  
  if (!json.success) {
    throw new Error("Apps Script Error: " + (json.error || "Unknown"));
  }
  
  return text;
}

/**
 * Fetches all transactions directly from the spreadsheet via Google Apps Script.
 */
export async function fetchFromSheet(targetDate?: string): Promise<{ 
  data: TransactionRecord[], 
  saldoReal: number, 
  saldoTabungan: number,
  totalPengeluaran: number,
  setorTabungan: number,
  totalPemasukan: number,
  saldoBulanLalu: number,
  period: { monthStr: string, cutStart: string, cutEnd: string } | null
}> {
  try {
    let url = GOOGLE_APPS_SCRIPT_URL;
    if (targetDate) {
      url += `?targetDate=${encodeURIComponent(targetDate)}`;
    }
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    const bodyText = await res.text();
    // console.log("GET Apps Script response:", bodyText);

    let json;
    try {
      json = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("Failed to parse GET Apps Script response as JSON. Body was:", bodyText.slice(0, 500));
      return { data: [], saldoReal: 0, saldoTabungan: 0, totalPengeluaran: 0, setorTabungan: 0, totalPemasukan: 0, saldoBulanLalu: 0, period: null };
    }

    if (json.success && Array.isArray(json.data)) {
      return {
        data: json.data,
        saldoReal: Number(json.saldoReal) || 0,
        saldoTabungan: Number(json.saldoTabungan) || 0,
        totalPengeluaran: Number(json.totalPengeluaran) || 0,
        setorTabungan: Number(json.setorTabungan) || 0,
        totalPemasukan: Number(json.totalPemasukan) || 0,
        saldoBulanLalu: Number(json.saldoBulanLalu) || 0,
        period: json.period || null
      };
    }
    
    console.error("Apps script returned failure or no data:", json);
    if (json.error) throw new Error("Apps Script Error: " + json.error);
    return { data: [], saldoReal: 0, saldoTabungan: 0, totalPengeluaran: 0, setorTabungan: 0, totalPemasukan: 0, saldoBulanLalu: 0, period: null };
  } catch (error) {
    console.error("Error fetching from Google Apps Script:", error);
    return { data: [], saldoReal: 0, saldoTabungan: 0, totalPengeluaran: 0, setorTabungan: 0, totalPemasukan: 0, saldoBulanLalu: 0, period: null };
  }
}
