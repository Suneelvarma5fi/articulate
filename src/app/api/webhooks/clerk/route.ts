import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabaseAdmin } from "@/lib/supabase/server";
import { INITIAL_CREDITS } from "@/types/database";

interface WebhookEvent {
  type: string;
  data: {
    id: string;
    [key: string]: unknown;
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  if (event.type === "user.created") {
    const clerkUserId = event.data.id;

    // Create user record
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({ clerk_user_id: clerkUserId });

    if (userError && !userError.message.includes("duplicate")) {
      console.error("Failed to create user:", userError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Grant signup bonus credits
    const { error: creditError } = await supabaseAdmin
      .from("credit_transactions")
      .insert({
        clerk_user_id: clerkUserId,
        amount: INITIAL_CREDITS,
        transaction_type: "signup_bonus",
      });

    if (creditError) {
      console.error("Failed to grant signup bonus:", creditError);
      return NextResponse.json(
        { error: "Failed to grant signup bonus" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
