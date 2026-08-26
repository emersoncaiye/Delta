import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/hold-records - List hold records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");

    let records = db.getHoldRecords();

    if (userId) {
      records = records.filter(r => r.userId === userId);
    }
    if (status) {
      records = records.filter(r => r.status === status);
    }

    // Sort by purchase date descending
    records = records.sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );

    return NextResponse.json({ success: true, data: records });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/hold-records - Create hold record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemId, orderId, purchasePrice, purchaseDate } = body;

    if (!userId || !itemId || !purchasePrice || !purchaseDate) {
      return NextResponse.json(
        { success: false, error: "userId, itemId, purchasePrice, purchaseDate are required" },
        { status: 400 }
      );
    }

    const record = db.createHoldRecord({
      userId,
      itemId,
      orderId,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
