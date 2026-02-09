import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { data: attempts, error, count } = await supabaseAdmin
    .from("attempts")
    .select(
      `
      id,
      articulation_text,
      character_count,
      quality_level,
      credits_spent,
      generated_image_url,
      score,
      created_at,
      challenges:challenge_id (
        id,
        title,
        reference_image_url,
        categories,
        character_limit,
        active_date
      )
    `,
      { count: "exact" }
    )
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    attempts: attempts || [],
    page,
    pageSize: PAGE_SIZE,
    total: count || 0,
    hasMore: (count || 0) > offset + PAGE_SIZE,
  });
}
