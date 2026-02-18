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

  const today = new Date().toISOString().split("T")[0];

  const { data: challenge, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("active_date", today)
    .in("status", ["active", "scheduled"])
    .single();

  if (error || !challenge) {
    return NextResponse.json(
      { error: "No active challenge today" },
      { status: 404 }
    );
  }

  // Get user's attempts for this challenge today
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("id, score, score_breakdown, generated_image_url, articulation_text, credits_spent, created_at")
    .eq("clerk_user_id", userId)
    .eq("challenge_id", challenge.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    challenge,
    attempts: attempts || [],
    bestScore: attempts?.length
      ? Math.max(...attempts.map((a: { score: number }) => a.score))
      : null,
  });
}
