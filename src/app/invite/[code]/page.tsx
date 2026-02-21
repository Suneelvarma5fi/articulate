import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();

  // Store the invite code in a cookie
  cookieStore.set("invite_code", code.toUpperCase(), {
    path: "/",
    maxAge: 60 * 60, // 1 hour
    httpOnly: false, // readable by client JS on enter-code page
  });

  const { userId } = await auth();

  if (userId) {
    // Already signed in — go to enter-code page to redeem
    redirect("/enter-code");
  } else {
    // Not signed in — go to sign-up
    redirect("/sign-up");
  }
}
