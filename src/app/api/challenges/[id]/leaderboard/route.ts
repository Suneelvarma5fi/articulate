import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get all attempts for this challenge (admin bypasses RLS)
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("clerk_user_id, score")
    .eq("challenge_id", id)
    .order("score", { ascending: false })
    .limit(200);

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // Group by user — keep only best score per user
  const bestByUser = new Map<string, number>();
  for (const a of attempts) {
    const current = bestByUser.get(a.clerk_user_id);
    if (current === undefined || a.score > current) {
      bestByUser.set(a.clerk_user_id, a.score);
    }
  }

  // Sort by score descending, take top 10
  const sorted: { userId: string; score: number }[] = [];
  bestByUser.forEach((score, userId) => {
    sorted.push({ userId, score });
  });
  sorted.sort((a, b) => b.score - a.score);
  const top10 = sorted.slice(0, 10);

  // Fetch usernames from Clerk in parallel
  const client = await clerkClient();
  const leaderboard = await Promise.all(
    top10.map(async (entry, idx) => {
      let username = "Anonymous";
      try {
        const user = await client.users.getUser(entry.userId);
        username = user.username || user.firstName || "Anonymous";
      } catch {
        // Fall back to anonymous
      }
      return {
        rank: idx + 1,
        username,
        score: entry.score,
      };
    })
  );

  const totalSubmissions = sorted.length;
  return NextResponse.json({ leaderboard, totalSubmissions });
}
