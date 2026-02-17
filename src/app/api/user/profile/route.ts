import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CATEGORIES } from "@/types/database";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category"); // optional filter

  // Fetch all user attempts with challenge data
  const query = supabaseAdmin
    .from("attempts")
    .select(
      `
      id,
      score,
      credits_spent,
      created_at,
      articulation_text,
      generated_image_url,
      challenges:challenge_id (
        id,
        title,
        categories,
        active_date,
        reference_image_url
      )
    `
    )
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: true });

  const { data: allAttempts, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }

  const attempts = allAttempts || [];

  // Filter by category if provided
  const filtered = category
    ? attempts.filter((a) => {
        const challenge = a.challenges as unknown as {
          categories: string[];
        } | null;
        return challenge?.categories?.includes(category);
      })
    : attempts;

  // Compute KPIs from filtered attempts
  const totalAttempts = filtered.length;
  const scores = filtered.map((a) => a.score);
  const averageScore =
    totalAttempts > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / totalAttempts)
      : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
  const totalCreditsSpent = filtered.reduce(
    (sum, a) => sum + a.credits_spent,
    0
  );

  // Unique challenges attempted
  const challengeIds = new Set(
    filtered.map((a) => {
      const challenge = a.challenges as unknown as { id: string } | null;
      return challenge?.id;
    })
  );
  const challengesAttempted = challengeIds.size;

  // Score trend: group by date, compute average score per day
  const scoreByDate = new Map<string, { total: number; count: number }>();
  for (const attempt of filtered) {
    const date = attempt.created_at.split("T")[0];
    const existing = scoreByDate.get(date);
    if (existing) {
      existing.total += attempt.score;
      existing.count += 1;
    } else {
      scoreByDate.set(date, { total: attempt.score, count: 1 });
    }
  }

  const scoreTrend = Array.from(scoreByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total, count }]) => ({
      date,
      avgScore: Math.round(total / count),
    }));

  // Category breakdown: how many attempts + avg score per category
  const categoryStats = new Map<
    string,
    { attempts: number; totalScore: number }
  >();
  for (const attempt of attempts) {
    const challenge = attempt.challenges as unknown as {
      categories: string[];
    } | null;
    if (challenge?.categories) {
      for (const cat of challenge.categories) {
        const existing = categoryStats.get(cat);
        if (existing) {
          existing.attempts += 1;
          existing.totalScore += attempt.score;
        } else {
          categoryStats.set(cat, {
            attempts: 1,
            totalScore: attempt.score,
          });
        }
      }
    }
  }

  const categoryBreakdown = Array.from(categoryStats.entries()).map(
    ([cat, { attempts: count, totalScore }]) => ({
      category: cat,
      attempts: count,
      avgScore: Math.round(totalScore / count),
    })
  );

  // All attempts (for history table) — most recent first
  const recentAttempts = [...filtered]
    .reverse()
    .map((a) => {
      const challenge = a.challenges as unknown as {
        id: string;
        title: string;
        categories: string[];
        active_date: string;
        reference_image_url: string;
      } | null;
      return {
        id: a.id,
        score: a.score,
        credits_spent: a.credits_spent,
        created_at: a.created_at,
        articulation_text: a.articulation_text,
        generated_image_url: a.generated_image_url,
        challenge_id: challenge?.id,
        challenge_title: challenge?.title || "Challenge",
        challenge_categories: challenge?.categories || [],
        challenge_date: challenge?.active_date,
        challenge_reference_url: challenge?.reference_image_url,
      };
    });

  // Get credit balance
  const { data: balanceData } = await supabaseAdmin.rpc("get_credit_balance", {
    user_id: userId,
  });

  return NextResponse.json({
    kpis: {
      totalAttempts,
      averageScore,
      bestScore,
      totalCreditsSpent,
      challengesAttempted,
      creditBalance: Number(balanceData) || 0,
    },
    scoreTrend,
    categoryBreakdown,
    recentAttempts,
    categories: [...CATEGORIES],
    activeFilter: category,
  });
}
