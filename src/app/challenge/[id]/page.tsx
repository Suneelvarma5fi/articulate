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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#DDDDD1",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <Suspense
        fallback={
          <main className="px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-xl border border-[#2a2a2a]/15 bg-[#E0E0D5] p-8 text-center">
                <p className="text-sm tracking-wide text-[#2a2a2a]/50">Loading challenge...</p>
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
