import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateReturnValue } from "@/lib/return-value";

// GET /api/hold-records/[id] - Get hold record
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = db.getHoldRecord(id);
    
    if (!record) {
      return NextResponse.json({ success: false, error: "Hold record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/hold-records/[id] - Process return (calculate return value)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { returnDate, returnMode } = body;

    if (!returnDate || !returnMode) {
      return NextResponse.json(
        { success: false, error: "returnDate and returnMode are required" },
        { status: 400 }
      );
    }

    const record = db.getHoldRecord(id);
    if (!record) {
      return NextResponse.json({ success: false, error: "Hold record not found" }, { status: 404 });
    }

    if (record.status === "returned") {
      return NextResponse.json(
        { success: false, error: "This item has already been returned" },
        { status: 400 }
      );
    }

    // Calculate hold days
    const purchaseDate = new Date(record.purchaseDate);
    const returnD = new Date(returnDate);
    const holdDays = Math.floor((returnD.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate return value
    const result = calculateReturnValue(record.purchasePrice, holdDays, returnMode);

    // Update hold record
    const updatedRecord = db.updateHoldRecord(id, {
      returnDate,
      returnMode,
      returnAmount: result.amount,
      returnRate: result.rate,
      holdDays: result.holdDays,
      holdTier: result.holdTier,
      status: "returned",
    });

    // Update item status back to on_sale (if return mode allows re-selling)
    if (returnMode === "exchange") {
      const item = db.getItem(record.itemId);
      if (item) {
        const history = [...(item.flowHistory || [])];
        history.push({
          timestamp: new Date().toISOString(),
          action: "returned",
          note: `用户退回，持有${result.holdDays}天，回流金额 ¥${result.amount.toLocaleString()}`,
        });
        db.updateItem(item.id, {
          status: "on_sale",
          flowHistory: history,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      calculation: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
