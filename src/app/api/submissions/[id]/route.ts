import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/submissions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submission = db.getSubmission(id);
    if (!submission) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: submission });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/submissions/[id] - Review submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reviewNote } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: "status is required" }, { status: 400 });
    }

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = db.getSubmission(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      status,
      reviewNote: reviewNote || null,
      reviewedAt: new Date().toISOString(),
    };

    // If approved, auto-create item
    if (status === "approved") {
      const code = db.generateItemCode();
      const newItem = db.createItem({
        code,
        name: existing.itemName,
        description: existing.description || "",
        photos: existing.photos || [],
        category: existing.category || "",
        originalPrice: existing.expectedPrice,
        sellingPrice: existing.expectedPrice,
        status: "on_sale",
        sourceOrigin: `来自用户提交: ${existing.submitterName}`,
        flowHistory: [{ timestamp: new Date().toISOString(), action: "listed", note: "审核通过，自动上架代售" }],
      });
      updates.generatedItemId = newItem.id;
    }

    const updated = db.updateSubmission(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
