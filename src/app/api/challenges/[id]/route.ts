import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  const { id } = await params;

  const { data: challenge, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", id)
    .in("status", ["active", "scheduled", "archived"])
    .single();

  if (error || !challenge) {
    return NextResponse.json(
      { error: "Challenge not found" },
      { status: 404 }
    );
  }

  // Check if challenge is locked (future date)
  const today = new Date().toISOString().split("T")[0];
  if (challenge.active_date > today) {
    return NextResponse.json(
      { error: "Challenge is locked", locked: true },
      { status: 403 }
    );
  }

  // Get user's attempts for this challenge
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
