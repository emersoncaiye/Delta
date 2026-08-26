import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/submissions - List submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let submissions = db.getSubmissions();
    if (status) {
      submissions = submissions.filter(s => s.status === status);
    }

    return NextResponse.json({ success: true, data: submissions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/submissions - Create submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submitterName, submitterContact, itemName, description, photos, expectedPrice, category, submitter_id } = body;

    if (!submitterName || !submitterContact || !itemName) {
      return NextResponse.json(
        { success: false, error: "submitterName, submitterContact, itemName are required" },
        { status: 400 }
      );
    }

    const submission = db.createSubmission({
      submitterName,
      submitterContact,
      itemName,
      description: description || "",
      photos: photos || [],
      expectedPrice: expectedPrice || 0,
      category: category || "",
      status: "pending",
    });

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
