import { supabaseAdmin } from "@/lib/supabase/server";
import { INITIAL_CREDITS } from "@/types/database";

/**
 * Ensures a user record exists in Supabase with signup credits.
 * This is a fallback for local development where Clerk webhooks
 * can't reach localhost. In production, the Clerk webhook at
 * /api/webhooks/clerk handles this on user.created.
 */
export async function ensureUser(clerkUserId: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (existing) return;

  // Create user
  await supabaseAdmin
    .from("users")
    .insert({ clerk_user_id: clerkUserId });

  // Grant signup bonus
  await supabaseAdmin.from("credit_transactions").insert({
    clerk_user_id: clerkUserId,
    amount: INITIAL_CREDITS,
    transaction_type: "signup_bonus",
  });
}
