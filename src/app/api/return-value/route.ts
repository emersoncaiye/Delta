import { NextRequest, NextResponse } from "next/server";
import { calculateReturnValue, HOLD_TIERS } from "@/lib/return-value";

// GET /api/return-value - Get hold tiers
export async function GET() {
  try {
    return NextResponse.json({ success: true, data: HOLD_TIERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/return-value - Calculate return value
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalPrice, holdDays, mode } = body;

    if (!originalPrice || !holdDays || !mode) {
      return NextResponse.json(
        { success: false, error: "originalPrice, holdDays, mode are required" },
        { status: 400 }
      );
    }

    const result = calculateReturnValue(originalPrice, holdDays, mode);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
