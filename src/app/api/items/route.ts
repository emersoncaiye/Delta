import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/items - List items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const items = db.getItems();
    let filtered = items;
    if (status) filtered = filtered.filter(i => i.status === status);
    if (category) filtered = filtered.filter(i => i.category === category);

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/items - Create item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, photos, category, originalPrice, sellingPrice, sourceOrigin, submitter_id } = body;

    if (!name || !originalPrice || !sellingPrice) {
      return NextResponse.json(
        { success: false, error: "name, originalPrice, sellingPrice are required" },
        { status: 400 }
      );
    }

    const code = db.generateItemCode();
    const item = db.createItem({
      code,
      name,
      description: description || "",
      photos: photos || [],
      category: category || "",
      originalPrice,
      sellingPrice,
      status: "on_sale",
      sourceOrigin: sourceOrigin || "",
      flowHistory: [{ timestamp: new Date().toISOString(), action: "listed", note: "新建库存条目，上架代售" }],
      submissionId: submitter_id,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
