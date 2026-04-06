import { getDb } from "@/lib/db";
import { ChatMessage, ParsedTransaction } from "@/types";

/**
 * Save a message to the chat_history table.
 */
export async function saveChatMessage(
  sender: "user" | "bot",
  message: string
): Promise<void> {
  const sql = getDb();
  await sql`INSERT INTO chat_history (sender, message) VALUES (${sender}, ${message})`;
}

/**
 * Fetch all chat messages, oldest first.
 */
export async function getChatHistory(): Promise<ChatMessage[]> {
  const sql = getDb();
  const rows = await sql`SELECT id, sender, message, created_at FROM chat_history ORDER BY created_at ASC`;
  return rows as ChatMessage[];
}

/**
 * Parse a /catat command into transaction data.
 *
 * Supported formats:
 *   /catat [notes] [amount]
 *   /catat [notes] [amount] -a [account]
 *   /catat [notes] [amount] -k [category]
 *   /catat [notes] [amount] -a [account] -k [category]
 *   /catat [notes] [amount] -d [date DD/MM/YYYY]
 *
 * Defaults:
 *   account  = "Cash - Amin"
 *   category = "B: PENGELUARAN~Lainnya"
 *   date     = today
 *
 * Examples:
 *   /catat Makan Siang 50000
 *   /catat Beli Token Listrik 100000 -a Bank - NeoBank
 *   /catat Parkir 5000 -k Parkir
 *   /catat Gaji 9000000 -k A: PEMASUKAN~Gaji -a Bank - Mandiri
 */
export function parseCatatCommand(message: string): ParsedTransaction | null {
  const trimmed = message.trim();
  if (!trimmed.toLowerCase().startsWith("/catat ")) return null;

  // Remove the "/catat " prefix
  let body = trimmed.substring(7).trim();

  // Extract flags first
  let account = "Cash - Amin";
  let category = "B: PENGELUARAN~Lainnya";
  let dateStr = formatDate(new Date());

  // Extract -d flag (date)
  const dateMatch = body.match(/-d\s+(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    dateStr = dateMatch[1];
    body = body.replace(dateMatch[0], "").trim();
  }

  // Extract -k flag (category) — grab everything after -k until -a or end
  const catMatch = body.match(/-k\s+(.+?)(?=\s+-[adk]|$)/);
  if (catMatch) {
    const rawCat = catMatch[1].trim();
    // If user typed just "Parkir", auto-prefix with "B: PENGELUARAN~"
    category = rawCat.includes("~") ? rawCat : `B: PENGELUARAN~${rawCat}`;
    body = body.replace(catMatch[0], "").trim();
  }

  // Extract -a flag (account) — grab everything after -a until -k or end
  const accMatch = body.match(/-a\s+(.+?)(?=\s+-[adk]|$)/);
  if (accMatch) {
    account = accMatch[1].trim();
    body = body.replace(accMatch[0], "").trim();
  }

  // Now body should be: "[notes] [amount]"
  // Find the last number in the string as the amount
  const amountMatch = body.match(/(\d[\d.,]*)\s*$/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/[.,]/g, ""));
  if (isNaN(amount) || amount <= 0) return null;

  const notes = body.substring(0, amountMatch.index).trim();
  if (!notes) return null;

  return {
    date: dateStr,
    category,
    amount,
    account,
    notes,
  };
}

/**
 * Format a bot response based on whether a transaction was recorded.
 */
export function formatBotResponse(
  parsed: ParsedTransaction | null,
  sheetSuccess: boolean
): string {
  if (!parsed) {
    return [
      "📋 **Format perintah:**",
      "",
      "`/catat [catatan] [nominal]`",
      "",
      "**Contoh:**",
      "• `/catat Makan Siang 50000`",
      "• `/catat Beli Token 100000 -a Bank - NeoBank`",
      "• `/catat Parkir 5000 -k Parkir`",
      "• `/catat Gaji 9000000 -k A: PEMASUKAN~Gaji -a Bank - Mandiri`",
      "• `/catat Makan 25000 -d 05/04/2026`",
      "",
      "**Flag opsional:**",
      "• `-a [akun]` → default: Cash - Amin",
      "• `-k [kategori]` → default: B: PENGELUARAN~Lainnya",
      "• `-d [DD/MM/YYYY]` → default: hari ini",
    ].join("\n");
  }

  if (!sheetSuccess) {
    return `⚠️ Gagal mencatat ke Google Sheet. Coba lagi nanti.\n\n📝 Data: ${parsed.notes} — Rp ${parsed.amount.toLocaleString("id-ID")}`;
  }

  return [
    `✅ Berhasil mencatat:`,
    `📝 ${parsed.notes}`,
    `💰 Rp ${parsed.amount.toLocaleString("id-ID")}`,
    `🏦 ${parsed.account}`,
    `📂 ${parsed.category}`,
    `📅 ${parsed.date}`,
  ].join("\n");
}

/**
 * Format a Date as M/D/YYYY to match Google Sheets date format.
 */
function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}
