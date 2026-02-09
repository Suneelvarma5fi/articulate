import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HistoryView } from "@/components/history/HistoryView";

export default async function HistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-4">
          <div className="mx-auto max-w-4xl">
            <div className="terminal-box p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <HistoryView />
    </Suspense>
  );
}
