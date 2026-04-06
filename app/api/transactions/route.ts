import { NextResponse } from "next/server";
import { addTransaction, getTransactions } from "@/services/transaction";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get("targetDate") || undefined;
    const result = await getTransactions(targetDate);
    return NextResponse.json({ 
      success: true, 
      data: result.data, 
      saldoReal: result.saldoReal, 
      saldoTabungan: result.saldoTabungan,
      totalPengeluaran: result.totalPengeluaran,
      setorTabungan: result.setorTabungan,
      totalPemasukan: result.totalPemasukan,
      saldoBulanLalu: result.saldoBulanLalu,
      period: result.period
    });
  } catch (error: any) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { success: false, error: "GET Error: " + (error.message || error.toString()) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, category, amount, account, notes } = body;

    if (!date || !category || !amount || !account || !notes) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transaction = await addTransaction({
      date,
      category,
      amount: Number(amount),
      account,
      notes,
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { success: false, error: "POST Error: " + (error.message || error.toString()) },
      { status: 500 }
    );
  }
}
