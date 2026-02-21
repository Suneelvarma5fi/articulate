import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const trimmed = code.trim().toUpperCase();

  // Check if user already has an invite code
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("invite_code")
    .eq("clerk_user_id", userId)
    .single();

  if (user?.invite_code) {
    return NextResponse.json({ error: "You have already redeemed an invite code" }, { status: 400 });
  }

  // Validate the invite code
  const { data: invite } = await supabaseAdmin
    .from("invite_codes")
    .select("*")
    .eq("code", trimmed)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (!invite.is_active) {
    return NextResponse.json({ error: "This invite code is no longer active" }, { status: 400 });
  }

  if (invite.used_count >= invite.max_uses) {
    return NextResponse.json({ error: "This invite code has reached its usage limit" }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite code has expired" }, { status: 400 });
  }

  // Redeem: update user + increment used_count
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ invite_code: trimmed })
    .eq("clerk_user_id", userId);

  if (updateError) {
    console.error("Failed to update user invite code:", updateError);
    return NextResponse.json({ error: "Failed to redeem code" }, { status: 500 });
  }

  await supabaseAdmin
    .from("invite_codes")
    .update({ used_count: invite.used_count + 1 })
    .eq("code", trimmed);

  return NextResponse.json({ success: true });
}
