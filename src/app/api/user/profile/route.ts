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
      challenge_id,
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

  const [attemptsResult, userResult, balanceResult] = await Promise.all([
    query,
    supabaseAdmin
      .from("users")
      .select("display_name, bio, interests, is_public")
      .eq("clerk_user_id", userId)
      .single(),
    supabaseAdmin.rpc("get_credit_balance", { user_id: userId }),
  ]);

  if (attemptsResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }

  const attempts = attemptsResult.data || [];
  const userProfile = userResult.data;

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

  // Category breakdown
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

  // Heatmap data: group by date, count attempts and best score
  const heatmapMap = new Map<string, { attemptCount: number; bestScore: number | null }>();
  for (const attempt of attempts) {
    const date = attempt.created_at.split("T")[0];
    const existing = heatmapMap.get(date);
    if (existing) {
      existing.attemptCount += 1;
      if (existing.bestScore === null || attempt.score > existing.bestScore) {
        existing.bestScore = attempt.score;
      }
    } else {
      heatmapMap.set(date, { attemptCount: 1, bestScore: attempt.score });
    }
  }
  const heatmapData = Array.from(heatmapMap.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  }));

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

  return NextResponse.json({
    kpis: {
      totalAttempts,
      averageScore,
      bestScore,
      totalCreditsSpent,
      challengesAttempted,
      creditBalance: Number(balanceResult.data) || 0,
    },
    scoreTrend,
    categoryBreakdown,
    recentAttempts,
    heatmapData,
    categories: [...CATEGORIES],
    activeFilter: category,
    profile: {
      displayName: userProfile?.display_name || null,
      bio: userProfile?.bio || null,
      interests: userProfile?.interests || [],
      isPublic: userProfile?.is_public || false,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { displayName, bio, interests, isPublic } = body;

  // Validate
  if (bio && typeof bio === "string" && bio.length > 200) {
    return NextResponse.json({ error: "Bio must be 200 characters or less" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (displayName !== undefined) updates.display_name = typeof displayName === "string" ? displayName.slice(0, 50) : null;
  if (bio !== undefined) updates.bio = typeof bio === "string" ? bio.slice(0, 200) : null;
  if (interests !== undefined) updates.interests = Array.isArray(interests) ? interests.slice(0, 10) : [];
  if (isPublic !== undefined) updates.is_public = Boolean(isPublic);

  const { error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("clerk_user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
