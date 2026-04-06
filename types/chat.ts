export interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  message: string;
  created_at: string;
}

export interface ParsedTransaction {
  date: string;
  category: string;
  amount: number;
  account: string;
  notes: string;
}
