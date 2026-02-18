import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the top scorer for this challenge (using admin to bypass RLS)
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("clerk_user_id, score")
    .eq("challenge_id", id)
    .order("score", { ascending: false })
    .limit(20);

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ topScorer: null });
  }

  // Group by user to get their best score
  const bestByUser = new Map<string, number>();
  for (const a of attempts) {
    const current = bestByUser.get(a.clerk_user_id);
    if (current === undefined || a.score > current) {
      bestByUser.set(a.clerk_user_id, a.score);
    }
  }

  // Find top scorer
  let topUserId = "";
  let topScore = 0;
  bestByUser.forEach((score, userId) => {
    if (score > topScore) {
      topScore = score;
      topUserId = userId;
    }
  });

  // Fetch username from Clerk
  let username = "Anonymous";
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(topUserId);
    username = user.username || user.firstName || "Anonymous";
  } catch {
    // Fall back to anonymous
  }

  return NextResponse.json({
    topScorer: {
      username,
      score: topScore,
    },
    totalAttempts: attempts.length,
  });
}
