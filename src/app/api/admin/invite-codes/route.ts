import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET — list all invite codes
export async function GET() {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("invite_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data });
}

// POST — generate new invite codes
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const count = Math.min(Math.max(body.count || 1, 1), 50);
  const maxUses = Math.min(Math.max(body.maxUses || 1, 1), 10000);
  const expiresAt = body.expiresAt || null;

  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push({
      code: generateCode(),
      created_by: userId,
      max_uses: maxUses,
      expires_at: expiresAt,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("invite_codes")
    .insert(codes)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data });
}

// DELETE — deactivate an invite code
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Code ID required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("invite_codes")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
