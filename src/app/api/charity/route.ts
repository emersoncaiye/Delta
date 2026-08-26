import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/charity - Get charity records and stats
export async function GET() {
  try {
    const records = db.getCharityRecords();
    const totalAmount = db.getCharityTotal();
    const byQuarter = db.getCharityByQuarter();

    const quarterlySummary = Object.entries(byQuarter)
      .map(([quarter, data]) => ({
        quarter,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.quarter.localeCompare(a.quarter));

    return NextResponse.json({
      success: true,
      data: {
        totalAmount,
        quarterlySummary,
        records,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
