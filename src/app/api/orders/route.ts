import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let orders = db.getOrders();
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    return NextResponse.json({ success: true, data: orders, total: orders.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, buyerName, buyerContact, amount, buyer_id } = body;

    if (!itemId || !buyerName || !amount) {
      return NextResponse.json(
        { success: false, error: "itemId, buyerName, amount are required" },
        { status: 400 }
      );
    }

    // Check item exists and is on sale
    const item = db.getItem(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    if (item.status !== "on_sale") {
      return NextResponse.json({ success: false, error: "Item is not available for sale" }, { status: 400 });
    }

    // Create order
    const order = db.createOrder({
      itemId,
      itemName: item.name,
      buyerName,
      buyerContact: buyerContact || "",
      amount,
      status: "pending",
    });

    // Update item status to sold
    const history = [...(item.flowHistory || [])];
    history.push({
      timestamp: new Date().toISOString(),
      action: "sold",
      price: amount,
      note: `售出给 ${buyerName}，订单号 ${order.orderNo}`,
    });
    db.updateItem(itemId, { status: "sold", flowHistory: history });

    // Create hold record if buyer_id is provided
    if (buyer_id) {
      db.createHoldRecord({
        userId: buyer_id,
        itemId,
        orderId: order.id,
        purchasePrice: amount,
        purchaseDate: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
