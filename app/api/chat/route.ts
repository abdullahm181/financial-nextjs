import { NextRequest, NextResponse } from "next/server";
import {
  saveChatMessage,
  getChatHistory,
  parseCatatCommand,
  formatBotResponse,
  appendToSheet,
} from "@/services";

/**
 * GET /api/chat — Fetch chat history
 */
export async function GET() {
  try {
    const messages = await getChatHistory();
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json(
      { success: false, data: [], error: "Failed to load chat history." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat — Process a chat message (double-write flow)
 *
 * Body: { message: string, sender: "user" }
 *
 * Flow:
 * 1. Save user message to DB
 * 2. If /catat → parse → append to Google Sheet
 * 3. Build & save bot response to DB
 * 4. Return bot response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sender } = body as { message: string; sender: "user" };

    if (!message || !sender) {
      return NextResponse.json(
        { success: false, error: "message and sender are required." },
        { status: 400 }
      );
    }

    // 1. Save user message
    await saveChatMessage("user", message);

    // 2. Parse and handle /catat command
    const parsed = parseCatatCommand(message);
    let sheetSuccess = false;

    if (parsed) {
      sheetSuccess = await appendToSheet(parsed);
    }

    // 3. Build bot response
    const botMessage = formatBotResponse(parsed, sheetSuccess);

    // 4. Save bot response
    await saveChatMessage("bot", botMessage);

    return NextResponse.json({
      success: true,
      data: { sender: "bot", message: botMessage },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
