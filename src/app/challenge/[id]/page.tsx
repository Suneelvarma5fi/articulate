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
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <main className="px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Loading challenge...</p>
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
