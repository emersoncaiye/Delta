import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users - List users
export async function GET() {
  try {
    const users = db.getUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/users - Create user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, deviceId } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "email and name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = db.getUsers().find(u => u.email === email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const user = db.createUser({ email, name, deviceId });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
