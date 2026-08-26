import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/items/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = db.getItem(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/items/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = db.getItem(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const allowedFields = ["name", "description", "photos", "category", "originalPrice", "sellingPrice", "status", "sourceOrigin"];
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    // Update flow history
    if (body.status && body.status !== existing.status) {
      const history = [...(existing.flowHistory || [])];
      const actionMap: Record<string, string> = {
        on_sale: "listed",
        sold: "sold",
        reserved: "reserved",
        repair: "repair",
      };
      history.push({
        timestamp: new Date().toISOString(),
        action: actionMap[body.status] || "status_change",
        note: `状态变更为 ${body.status}`,
      });
      updates.flowHistory = history;
    }

    const updated = db.updateItem(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = db.deleteItem(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
