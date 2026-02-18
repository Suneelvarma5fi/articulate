"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoreChart } from "@/components/profile/ScoreChart";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";

interface PublicProfileData {
  profile: {
    displayName: string | null;
    bio: string | null;
    interests: string[];
    memberSince: string;
  };
  kpis: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    challengesAttempted: number;
  };
  scoreTrend: Array<{ date: string; avgScore: number }>;
  heatmapData: Array<{ date: string; attemptCount: number; bestScore: number | null }>;
}

export function PublicProfile({ userId }: { userId: string }) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/user/profile/public/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [userId]);

  if (error) {
    return (
      <main className="px-6 py-16 text-center">
        <div className="mx-auto max-w-md">
          <p className="mb-2 font-handjet text-2xl text-foreground">
            Profile Not Found
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            This profile is either private or doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="btn-primary"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  const { profile, kpis } = data;

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-border pb-4">
          <Link href="/" className="font-handjet text-2xl tracking-wider text-foreground">
            ARTICULATE_
          </Link>
        </header>

        {/* User info */}
        <div className="mb-6 text-center">
          <h1 className="font-handjet text-3xl tracking-wide text-foreground">
            {profile.displayName || "Player"}
          </h1>
          {profile.bio && (
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {profile.bio}
            </p>
          )}
          {profile.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Member since{" "}
            {new Date(profile.memberSince).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* KPIs */}
        <div className="card mb-6 p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-foreground">
                {kpis.totalAttempts}
              </p>
              <p className="text-[11px] text-muted-foreground">Attempts</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-foreground">
                {kpis.averageScore}
              </p>
              <p className="text-[11px] text-muted-foreground">Avg Score</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-primary">
                {kpis.bestScore}
              </p>
              <p className="text-[11px] text-muted-foreground">Best Score</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-foreground">
                {kpis.challengesAttempted}
              </p>
              <p className="text-[11px] text-muted-foreground">Challenges</p>
            </div>
          </div>
        </div>

        {/* Score trend */}
        <div className="card mb-6 p-5">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Score Trend
          </p>
          <div className="h-32">
            <ScoreChart data={data.scoreTrend} />
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="card mb-6 overflow-x-auto p-5">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Activity
          </p>
          <ActivityHeatmap data={data.heatmapData} />
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/" className="btn-primary">
            Try Articulate
          </Link>
        </div>
      </div>
    </main>
  );
}
