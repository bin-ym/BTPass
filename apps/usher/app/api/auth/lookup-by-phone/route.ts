export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Find user by phone
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .eq("role", "USHER")
      .eq("active", true)
      .limit(1);

    if (error) {
      console.error("User lookup error:", error);
      return NextResponse.json(
        { error: "Failed to lookup user" },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No usher found with this phone number" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user: data[0] });
  } catch (err: unknown) {
    console.error("Lookup user error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Something went wrong" },
      { status: 500 },
    );
  }
}
