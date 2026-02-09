import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { CREDIT_PACKAGES } from "@/types/database";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: withinLimit } = rateLimit(`checkout:${userId}`, {
    windowMs: 60_000,
    max: 3,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: { packageIndex: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { packageIndex } = body;

  if (packageIndex < 0 || packageIndex >= CREDIT_PACKAGES.length) {
    return NextResponse.json(
      { error: "Invalid package selection" },
      { status: 400 }
    );
  }

  const pkg = CREDIT_PACKAGES[packageIndex];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pkg.credits} Credits - Articulation Training`,
              description: `${pkg.credits} credits for image generation`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        clerk_user_id: userId,
        credits: String(pkg.credits),
        package_index: String(packageIndex),
      },
      success_url: `${appUrl}/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?purchase=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
