import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChallengeFlow } from "@/components/challenge/ChallengeFlow";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-terminal-black p-4">
          <div className="mx-auto max-w-4xl">
            <div className="border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <ChallengeFlow />
    </Suspense>
  );
}
