export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 },
      );
    }

    // Check if user exists with the given email and role
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .eq("role", role)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("User check error:", error);
      return NextResponse.json(
        { error: "Failed to check user" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      exists: !!data,
    });
  } catch (err: unknown) {
    console.error("Check user error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Something went wrong" },
      { status: 500 },
    );
  }
}
