export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { guest_name, guest_phone, group_size = 1 } = await req.json();

    // 1️⃣ Create invitation
    const { data: inv, error } = await supabase
      .from("invitations")
      .insert({ guest_name, guest_phone, group_size })
      .select()
      .single();

    if (error || !inv) {
      throw error ?? new Error("Failed to create invitation");
    }

    // 2️⃣ Dynamic import (Turbopack + Node-safe)
    const QRCode = (await import("qrcode")).default;

    // 3️⃣ Generate QR payload
    const qrPayload = `${inv.id}:${process.env.QR_SECRET}`;

    // 4️⃣ Generate QR code as Data URL
    const qrToken = await QRCode.toDataURL(qrPayload);

    // 5️⃣ Save QR token
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ qr_token: qrToken })
      .eq("id", inv.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      invitation: inv,
      qr: qrToken,
    });
  } catch (err: unknown) {
    console.error("Create invitation error:", err);

    return NextResponse.json(
      { error: (err as Error).message || "Something went wrong" },
      { status: 500 }
    );
  }
}