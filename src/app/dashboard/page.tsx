import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <main className="px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </main>
        }
      >
        <DashboardLayout />
      </Suspense>
    </div>
  );
}
