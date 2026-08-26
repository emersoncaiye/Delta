import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { HOLD_TIERS } from "@/lib/return-value";

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const items = db.getItems();
    const orders = db.getOrders();
    const submissions = db.getSubmissions();
    const users = db.getUsers();
    const holdRecords = db.getHoldRecords();
    const charityTotal = db.getCharityTotal();

    const overview = {
      totalItems: items.length,
      totalOrders: orders.length,
      totalSubmissions: submissions.length,
      totalUsers: users.length,
      totalHoldRecords: holdRecords.length,
      charityTotal,
    };

    const inventory = {
      onSale: items.filter(i => i.status === "on_sale").length,
      sold: items.filter(i => i.status === "sold").length,
      reserved: items.filter(i => i.status === "reserved").length,
      repair: items.filter(i => i.status === "repair").length,
    };

    const orderStats = {
      pending: orders.filter(o => o.status === "pending").length,
      completed: orders.filter(o => o.status === "completed").length,
    };

    const submissionStats = {
      pending: submissions.filter(s => s.status === "pending").length,
    };

    const recentItems = items.slice(0, 5).map(i => ({
      code: i.code,
      name: i.name,
      status: i.status,
      sellingPrice: i.sellingPrice,
      updatedAt: i.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview,
        inventory,
        orders: orderStats,
        submissions: submissionStats,
        recentItems,
        holdTiers: HOLD_TIERS,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
