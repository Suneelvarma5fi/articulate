import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy",
  "/terms",
  "/refund",
  "/invite/(.*)",
  "/profile/(.*)",
  "/api/health",
  "/api/webhooks/(.*)",
  "/api/user/profile/public/(.*)",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

const isEnterCodeRoute = createRouteMatcher([
  "/enter-code",
  "/api/invite/(.*)",
]);

function getSupabaseEdge() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      if (isApiRoute(req)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      await auth.protect();
      return;
    }

    // Admin bypasses invite code gate
    if (userId === process.env.ADMIN_CLERK_USER_ID) {
      return;
    }

    // Skip invite check for the enter-code page and invite API
    if (isEnterCodeRoute(req)) {
      return;
    }

    // Check if user has redeemed an invite code
    try {
      const supabase = getSupabaseEdge();
      const { data: user } = await supabase
        .from("users")
        .select("invite_code")
        .eq("clerk_user_id", userId)
        .single();

      // If user exists but has no invite code, redirect to enter-code
      if (user && !user.invite_code) {
        if (isApiRoute(req)) {
          return NextResponse.json(
            { error: "Invite code required" },
            { status: 403 }
          );
        }
        const url = req.nextUrl.clone();
        url.pathname = "/enter-code";
        return NextResponse.redirect(url);
      }
    } catch {
      // If Supabase query fails, let the request through
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|ogg|mp3|wav)).*)",
    "/(api|trpc)(.*)",
  ],
};
