import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const monthParam = searchParams.get("month"); // YYYY-MM
  const category = searchParams.get("category"); // single category filter
  const today = new Date().toISOString().split("T")[0];

  // Default to current month
  const now = new Date();
  const targetMonth = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = targetMonth.split("-").map(Number);
  const monthStart = `${targetMonth}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;

  // Don't allow future months
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (targetMonth > currentMonth) {
    return NextResponse.json({ error: "Cannot view future months" }, { status: 400 });
  }

  // Build challenge query
  let query = supabaseAdmin
    .from("challenges")
    .select("*")
    .gte("active_date", monthStart)
    .lte("active_date", monthEnd)
    .in("status", ["active", "scheduled", "archived"])
    .order("active_date", { ascending: false });

  if (category) {
    query = query.contains("categories", [category]);
  }

  const { data: challenges, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }

  if (!challenges || challenges.length === 0) {
    return NextResponse.json({ challenges: [], month: targetMonth });
  }

  // Get user's best scores for all challenges in result
  const challengeIds = challenges.map((c) => c.id);
  const { data: userAttempts } = await supabaseAdmin
    .from("attempts")
    .select("challenge_id, score")
    .eq("clerk_user_id", userId)
    .in("challenge_id", challengeIds);

  const bestScores = new Map<string, { best: number; count: number }>();
  if (userAttempts) {
    for (const a of userAttempts) {
      const current = bestScores.get(a.challenge_id);
      if (!current) {
        bestScores.set(a.challenge_id, { best: a.score, count: 1 });
      } else {
        bestScores.set(a.challenge_id, {
          best: Math.max(current.best, a.score),
          count: current.count + 1,
        });
      }
    }
  }

  // Get challenge numbering: count all challenges before the earliest in this batch
  const earliestDate = challenges[challenges.length - 1].active_date;
  const { count: challengesBefore } = await supabaseAdmin
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "scheduled", "archived"])
    .lt("active_date", earliestDate);

  const baseNumber = (challengesBefore || 0) + 1;

  // Sort ascending for numbering, then reverse for display
  const sorted = [...challenges].sort((a, b) => a.active_date.localeCompare(b.active_date));

  const enriched = sorted.map((c, idx) => {
    const scores = bestScores.get(c.id);
    const isLocked = c.active_date > today;
    return {
      id: c.id,
      challenge_number: baseNumber + idx,
      title: c.title,
      reference_image_url: isLocked ? null : c.reference_image_url,
      categories: c.categories,
      character_limit: c.character_limit,
      active_date: c.active_date,
      status: c.status,
      is_locked: isLocked,
      user_best_score: scores?.best ?? null,
      user_attempt_count: scores?.count ?? 0,
    };
  });

  // Return in descending date order (newest first)
  enriched.reverse();

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const total = enriched.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = enriched.slice(start, start + limit);

  return NextResponse.json({
    challenges: paginated,
    month: targetMonth,
    page,
    totalPages,
    total,
  });
}
