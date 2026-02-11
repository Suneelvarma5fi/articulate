import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getDodo } from "@/lib/dodo/client";

export async function POST(req: NextRequest) {
  const WEBHOOK_KEY = process.env.DODO_WEBHOOK_KEY;

  if (!WEBHOOK_KEY) {
    return NextResponse.json(
      { error: "Webhook key not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  };

  let event;
  try {
    event = getDodo().webhooks.unwrap(body, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Dodo webhook verification failed:", message);
    return NextResponse.json(
      { error: `Webhook verification failed: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "payment.succeeded") {
    const payment = event.data;
    const clerkUserId = payment.metadata?.clerk_user_id;
    const credits = Number(payment.metadata?.credits);
    const paymentId = payment.payment_id;

    if (!clerkUserId || !credits || isNaN(credits)) {
      console.error("Missing metadata in Dodo payment:", paymentId);
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    // Idempotency: check if this payment was already processed
    const { data: existing } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("stripe_payment_intent_id", paymentId)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, already_processed: true });
    }

    // Add credits to user account
    const { error } = await supabaseAdmin
      .from("credit_transactions")
      .insert({
        clerk_user_id: clerkUserId,
        amount: credits,
        transaction_type: "purchase",
        stripe_payment_intent_id: paymentId, // reuse column for Dodo payment ID
      });

    if (error) {
      console.error("Failed to add credits:", error);
      return NextResponse.json(
        { error: "Failed to add credits" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
