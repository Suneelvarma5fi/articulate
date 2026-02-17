import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

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
            <div className="mx-auto max-w-4xl">
              <div className="rounded-xl border border-[#2a2a2a]/15 bg-[#E0E0D5] p-8 text-center">
                <p className="text-sm tracking-wide text-[#2a2a2a]/50">Loading...</p>
              </div>
            </div>
          </main>
        }
      >
        <ProfileView />
      </Suspense>
    </div>
  );
}
