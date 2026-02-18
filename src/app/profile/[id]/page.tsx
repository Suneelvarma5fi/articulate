import { Suspense } from "react";
import { PublicProfile } from "./PublicProfile";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <main className="px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-4xl">
              <div className="card p-8 text-center">
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              </div>
            </div>
          </main>
        }
      >
        <PublicProfile userId={id} />
      </Suspense>
    </div>
  );
}
