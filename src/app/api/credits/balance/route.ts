import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/ensure-user";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  const { data, error } = await supabaseAdmin.rpc("get_credit_balance", {
    user_id: userId,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }

  return NextResponse.json({ balance: Number(data) || 0 });
}
