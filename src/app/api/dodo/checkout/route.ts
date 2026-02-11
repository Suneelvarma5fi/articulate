import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDodo } from "@/lib/dodo/client";
import { CREDIT_PACKAGES, DODO_PRODUCT_IDS } from "@/types/database";
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

  const productId = DODO_PRODUCT_IDS[packageIndex];
  if (!productId) {
    return NextResponse.json(
      { error: "Product not configured" },
      { status: 500 }
    );
  }

  const pkg = CREDIT_PACKAGES[packageIndex];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || "";

    const payment = await getDodo().payments.create({
      billing: { country: "US" },
      customer: { email, name: user?.fullName || "Customer" },
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${appUrl}/dashboard?purchase=success&payment_id={PAYMENT_ID}`,
      metadata: {
        clerk_user_id: userId,
        credits: String(pkg.credits),
        package_index: String(packageIndex),
      },
    });

    return NextResponse.json({ url: payment.payment_link });
  } catch (error) {
    console.error("Dodo checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
