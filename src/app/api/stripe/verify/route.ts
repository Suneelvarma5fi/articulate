import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Verifies a Stripe checkout session and adds credits if not already added.
 * This is a fallback for local dev where Stripe webhooks can't reach localhost.
 * In production, the webhook at /api/webhooks/stripe handles this.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify this session belongs to this user
    if (session.metadata?.clerk_user_id !== userId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const credits = Number(session.metadata?.credits);
    if (!credits || isNaN(credits)) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    // Check if credits were already added (by webhook or previous verify call)
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    if (paymentIntentId) {
      const { data: existing } = await supabaseAdmin
        .from("credit_transactions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (existing) {
        // Already processed — just return success
        return NextResponse.json({ alreadyProcessed: true, credits });
      }
    }

    // Add credits
    await supabaseAdmin.from("credit_transactions").insert({
      clerk_user_id: userId,
      amount: credits,
      transaction_type: "purchase",
      stripe_payment_intent_id: paymentIntentId,
    });

    return NextResponse.json({ credits, added: true });
  } catch (error) {
    console.error("Stripe verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
