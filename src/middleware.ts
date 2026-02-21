import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|ogg|mp3|wav)).*)",
    "/(api|trpc)(.*)",
  ],
};
