import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChallengeFlow } from "@/components/challenge/ChallengeFlow";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  return (
    <div className="dark min-h-screen bg-[#111111]">
      <Suspense
        fallback={
          <main className="px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-8 text-center">
                <p className="text-sm text-white/50">Loading challenge...</p>
              </div>
            </div>
          </main>
        }
      >
        <ChallengeFlow challengeId={id} />
      </Suspense>
    </div>
  );
}
