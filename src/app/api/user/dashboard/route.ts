import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/ensure-user";
import { CATEGORIES } from "@/types/database";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  const { searchParams } = req.nextUrl;
  const monthParam = searchParams.get("month"); // YYYY-MM format
  const today = new Date().toISOString().split("T")[0];

  // Determine calendar month
  const now = new Date();
  const calendarMonth = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = calendarMonth.split("-").map(Number);
  const monthStart = `${calendarMonth}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${calendarMonth}-${String(daysInMonth).padStart(2, "0")}`;

  // Don't allow future months
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (calendarMonth > currentMonth) {
    return NextResponse.json({ error: "Cannot view future months" }, { status: 400 });
  }

  // Fetch all data in parallel
  const [streakResult, recentResult, calendarResult] = await Promise.all([
    // 1. All user attempts (for streak + average score)
    supabaseAdmin
      .from("attempts")
      .select("created_at, score, challenge_id, challenges:challenge_id(active_date)")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false }),

    // 2. Recent challenges: today + last 2 (with user's best score)
    supabaseAdmin
      .from("challenges")
      .select("*")
      .lte("active_date", today)
      .in("status", ["active", "scheduled", "archived"])
      .order("active_date", { ascending: false })
      .limit(3),

    // 3. Calendar: challenges in the requested month with user attempts
    supabaseAdmin
      .from("challenges")
      .select("id, active_date, title, categories")
      .gte("active_date", monthStart)
      .lte("active_date", monthEnd)
      .in("status", ["active", "scheduled", "archived"])
      .order("active_date", { ascending: true }),
  ]);

  // Compute streak
  let streak = 0;
  if (streakResult.data) {
    const attemptDates = new Set<string>();
    for (const attempt of streakResult.data) {
      const challenge = attempt.challenges as unknown as { active_date: string } | null;
      if (challenge?.active_date) {
        attemptDates.add(challenge.active_date);
      }
    }

    // Count consecutive days ending at today (or yesterday if no attempt today yet)
    const sortedDates = Array.from(attemptDates).sort().reverse();
    if (sortedDates.length > 0) {
      const todayDate = new Date(today);
      const mostRecent = new Date(sortedDates[0]);
      const diffDays = Math.floor((todayDate.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

      // Streak is valid if most recent attempt is today or yesterday
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const gap = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
          if (gap === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
  }

  // Get user's best scores for recent challenges
  const recentChallenges = recentResult.data || [];
  const recentChallengeIds = recentChallenges.map((c) => c.id);

  let recentWithScores = recentChallenges.map((c) => ({
    ...c,
    challenge_number: 0, // computed below
    user_best_score: null as number | null,
    user_attempted: false,
  }));

  if (recentChallengeIds.length > 0) {
    const { data: userAttempts } = await supabaseAdmin
      .from("attempts")
      .select("challenge_id, score")
      .eq("clerk_user_id", userId)
      .in("challenge_id", recentChallengeIds);

    if (userAttempts) {
      const bestScores = new Map<string, number>();
      for (const a of userAttempts) {
        const current = bestScores.get(a.challenge_id);
        if (current === undefined || a.score > current) {
          bestScores.set(a.challenge_id, a.score);
        }
      }
      recentWithScores = recentWithScores.map((c) => ({
        ...c,
        user_best_score: bestScores.get(c.id) ?? null,
        user_attempted: bestScores.has(c.id),
      }));
    }
  }

  // Compute challenge numbers (sequential from first challenge)
  const { count: challengesBefore } = await supabaseAdmin
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "scheduled", "archived"])
    .lt("active_date", recentChallenges[recentChallenges.length - 1]?.active_date || today);

  const baseNumber = (challengesBefore || 0) + 1;
  recentWithScores = recentWithScores.map((c, idx) => ({
    ...c,
    challenge_number: baseNumber + (recentWithScores.length - 1 - idx),
  }));

  // Build calendar data
  const calendarChallenges = calendarResult.data || [];
  const calendarChallengeIds = calendarChallenges.map((c) => c.id);

  const calendarData: Record<string, { completed: boolean; bestScore: number | null; challengeId: string }> = {};

  // Initialize all challenge dates
  for (const c of calendarChallenges) {
    calendarData[c.active_date] = { completed: false, bestScore: null, challengeId: c.id };
  }

  // Fill in user's scores
  if (calendarChallengeIds.length > 0) {
    const { data: calAttempts } = await supabaseAdmin
      .from("attempts")
      .select("challenge_id, score")
      .eq("clerk_user_id", userId)
      .in("challenge_id", calendarChallengeIds);

    if (calAttempts) {
      const bestByChallenge = new Map<string, number>();
      for (const a of calAttempts) {
        const current = bestByChallenge.get(a.challenge_id);
        if (current === undefined || a.score > current) {
          bestByChallenge.set(a.challenge_id, a.score);
        }
      }

      for (const c of calendarChallenges) {
        const best = bestByChallenge.get(c.id);
        if (best !== undefined) {
          calendarData[c.active_date] = {
            ...calendarData[c.active_date],
            completed: true,
            bestScore: best,
          };
        }
      }
    }
  }

  // Compute average score from all user attempts
  let averageScore = 0;
  if (streakResult.data && streakResult.data.length > 0) {
    const total = streakResult.data.reduce(
      (sum: number, a: { score: number }) => sum + (a.score ?? 0),
      0
    );
    averageScore = Math.round(total / streakResult.data.length);
  }

  // Solved count: unique challenges the user has attempted
  const solvedChallengeIds = new Set<string>();
  if (streakResult.data) {
    for (const a of streakResult.data) {
      solvedChallengeIds.add(a.challenge_id);
    }
  }
  const solvedCount = solvedChallengeIds.size;

  // Total count: all available challenges (active_date <= today)
  const { count: totalCount } = await supabaseAdmin
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "scheduled", "archived"])
    .lte("active_date", today);

  return NextResponse.json({
    streak,
    averageScore,
    recentChallenges: recentWithScores,
    calendarData,
    calendarMonth,
    categories: [...CATEGORIES],
    solvedCount,
    totalCount: totalCount || 0,
  });
}
