import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch user profile
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id, display_name, bio, interests, is_public, created_at")
    .eq("clerk_user_id", id)
    .single();

  if (!user || !user.is_public) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch all attempts for this user
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("score, created_at, challenge_id")
    .eq("clerk_user_id", id)
    .order("created_at", { ascending: true });

  const allAttempts = attempts || [];

  // KPIs
  const totalAttempts = allAttempts.length;
  const scores = allAttempts.map((a) => a.score);
  const averageScore = totalAttempts > 0
    ? Math.round(scores.reduce((s, v) => s + v, 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
  const challengesAttempted = new Set(allAttempts.map((a) => a.challenge_id)).size;

  // Score trend
  const scoreByDate = new Map<string, { total: number; count: number }>();
  for (const a of allAttempts) {
    const date = a.created_at.split("T")[0];
    const existing = scoreByDate.get(date);
    if (existing) {
      existing.total += a.score;
      existing.count += 1;
    } else {
      scoreByDate.set(date, { total: a.score, count: 1 });
    }
  }
  const scoreTrend = Array.from(scoreByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total, count }]) => ({
      date,
      avgScore: Math.round(total / count),
    }));

  // Heatmap
  const heatmapMap = new Map<string, { attemptCount: number; bestScore: number | null }>();
  for (const a of allAttempts) {
    const date = a.created_at.split("T")[0];
    const existing = heatmapMap.get(date);
    if (existing) {
      existing.attemptCount += 1;
      if (existing.bestScore === null || a.score > existing.bestScore) {
        existing.bestScore = a.score;
      }
    } else {
      heatmapMap.set(date, { attemptCount: 1, bestScore: a.score });
    }
  }
  const heatmapData = Array.from(heatmapMap.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  }));

  return NextResponse.json({
    profile: {
      displayName: user.display_name,
      bio: user.bio,
      interests: user.interests || [],
      memberSince: user.created_at,
    },
    kpis: {
      totalAttempts,
      averageScore,
      bestScore,
      challengesAttempted,
    },
    scoreTrend,
    heatmapData,
  });
}
