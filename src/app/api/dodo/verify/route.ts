import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDodo } from "@/lib/dodo/client";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Verifies a Dodo payment and adds credits if not already added.
 * Fallback for race condition where webhook hasn't fired yet on redirect.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { paymentId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { paymentId } = body;
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
  }

  try {
    const payment = await getDodo().payments.retrieve(paymentId);

    // Verify this payment belongs to this user
    if (payment.metadata?.clerk_user_id !== userId) {
      return NextResponse.json({ error: "Payment mismatch" }, { status: 403 });
    }

    if (payment.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const credits = Number(payment.metadata?.credits);
    if (!credits || isNaN(credits)) {
      return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
    }

    // Check if credits were already added (by webhook or previous verify call)
    const { data: existing } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("stripe_payment_intent_id", paymentId)
      .single();

    if (existing) {
      return NextResponse.json({ alreadyProcessed: true, credits });
    }

    // Add credits
    await supabaseAdmin.from("credit_transactions").insert({
      clerk_user_id: userId,
      amount: credits,
      transaction_type: "purchase",
      stripe_payment_intent_id: paymentId, // reuse column for Dodo payment ID
    });

    return NextResponse.json({ credits, added: true });
  } catch (error) {
    console.error("Dodo verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
