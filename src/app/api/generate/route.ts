import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateImage, scoreImages } from "@/lib/grok/client";
import { CREDITS_PER_GENERATION } from "@/types/database";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 generations per minute per user
  const { success: withinLimit } = await rateLimit(`generate:${userId}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: { challengeId: string; articulationText: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { challengeId, articulationText } = body;

  // Validate inputs
  if (!challengeId || !articulationText) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const trimmedText = articulationText.trim();
  if (trimmedText.length < 10) {
    return NextResponse.json(
      { error: "Articulation must be at least 10 characters" },
      { status: 400 }
    );
  }

  // Fetch the challenge to validate character limit
  const { data: challenge, error: challengeError } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) {
    return NextResponse.json(
      { error: "Challenge not found" },
      { status: 404 }
    );
  }

  // Block attempts on future (locked) challenges
  const today = new Date().toISOString().split("T")[0];
  if (challenge.active_date > today) {
    return NextResponse.json(
      { error: "Challenge is locked", locked: true },
      { status: 403 }
    );
  }

  if (trimmedText.length > challenge.character_limit) {
    return NextResponse.json(
      { error: `Articulation exceeds ${challenge.character_limit} character limit` },
      { status: 400 }
    );
  }

  // Atomic credit deduction (prevents double-spend race condition)
  const creditsNeeded = CREDITS_PER_GENERATION;

  const { data: deductResult, error: deductError } = await supabaseAdmin.rpc(
    "deduct_credits",
    { p_user_id: userId, p_amount: creditsNeeded }
  );

  if (deductError) {
    console.error("Credit deduction error:", deductError);
    return NextResponse.json(
      { error: "Failed to process credits" },
      { status: 500 }
    );
  }

  const row = deductResult?.[0];
  if (!row?.success) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: Number(row?.remaining) || 0, needed: creditsNeeded },
      { status: 402 }
    );
  }

  try {
    // Generate image via Gemini API (returns Buffer directly)
    const imageBuffer = await generateImage(trimmedText);

    const attemptId = crypto.randomUUID();
    const storagePath = `${userId}/${attemptId}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      throw new Error("Failed to upload generated image");
    }
    const { data: publicUrl } = supabaseAdmin.storage
      .from("generated-images")
      .getPublicUrl(storagePath);

    const generatedImageUrl = publicUrl.publicUrl;

    // Score similarity via Grok Vision API
    const scoreResult = await scoreImages(challenge.reference_image_url, generatedImageUrl, trimmedText);

    // Save the attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("attempts")
      .insert({
        id: attemptId,
        clerk_user_id: userId,
        challenge_id: challengeId,
        articulation_text: trimmedText,
        character_count: trimmedText.length,
        quality_level: 1,
        credits_spent: creditsNeeded,
        generated_image_url: generatedImageUrl,
        score: scoreResult.total,
        score_breakdown: scoreResult.breakdown,
        is_validated: true,
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Attempt save error:", attemptError);
      throw new Error("Failed to save attempt");
    }

    // Update the credit transaction with the attempt ID
    await supabaseAdmin
      .from("credit_transactions")
      .update({ related_attempt_id: attemptId })
      .eq("clerk_user_id", userId)
      .eq("transaction_type", "image_generation")
      .is("related_attempt_id", null)
      .order("created_at", { ascending: false })
      .limit(1);

    // Get updated balance
    const { data: newBalance } = await supabaseAdmin.rpc("get_credit_balance", {
      user_id: userId,
    });

    return NextResponse.json({
      attempt,
      score: scoreResult.total,
      scoreBreakdown: scoreResult.breakdown,
      generatedImageUrl,
      creditsSpent: creditsNeeded,
      remainingBalance: Number(newBalance) || 0,
    });
  } catch (error) {
    // Refund credits on failure
    const { error: refundErr } = await supabaseAdmin.from("credit_transactions").insert({
      clerk_user_id: userId,
      amount: creditsNeeded,
      transaction_type: "image_generation",
      quality_level: 1,
    });
    if (refundErr) console.error("Refund insert failed:", refundErr);

    console.error("Generation failed:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { error: "Generation failed. Credits have been refunded.", refunded: true },
      { status: 500 }
    );
  }
}
