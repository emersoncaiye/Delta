import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users/[id] - Get user with their records
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = db.getUser(id);
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Get user's hold records
    const holdRecords = db.getHoldRecords().filter(r => r.userId === id);
    
    // Get user's orders (by matching buyerName since we don't have buyer_id in Order)
    const orders = db.getOrders().filter(o => o.buyerName === user.name);
    
    // Get user's submissions (by matching submitterName)
    const submissions = db.getSubmissions().filter(s => s.submitterName === user.name);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        hold_records: holdRecords,
        orders,
        submissions,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
