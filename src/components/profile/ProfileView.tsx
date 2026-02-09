"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { MatrixRain } from "@/components/animations/MatrixRain";

interface Stats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalCreditsSpent: number;
}

export function ProfileView() {
  const { user } = useUser();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((res) => res.json())
      .then((data) => setCreditBalance(data.balance))
      .catch(() => {});

    // Fetch attempt stats from history
    fetch("/api/attempts/history?page=1")
      .then((res) => res.json())
      .then((data) => {
        const attempts = data.attempts || [];
        const total = data.total || 0;
        if (total > 0) {
          const scores = attempts.map(
            (a: { score: number }) => a.score
          );
          const creditsSpent = attempts.reduce(
            (sum: number, a: { credits_spent: number }) =>
              sum + a.credits_spent,
            0
          );
          setStats({
            totalAttempts: total,
            averageScore: Math.round(
              scores.reduce((a: number, b: number) => a + b, 0) / scores.length
            ),
            bestScore: Math.max(...scores),
            totalCreditsSpent: creditsSpent,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <MatrixRain />
      <main className="relative z-10 min-h-screen p-4">
        <div className="mx-auto max-w-4xl">
          <Header creditBalance={creditBalance} />

          <div className="mb-6 text-center">
            <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
              ═══════════════════════════════════════════════
            </div>
            <h1 className="my-2 text-lg font-bold tracking-wide text-white">
              PROFILE
            </h1>
            <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
              ═══════════════════════════════════════════════
            </div>
          </div>

          {/* User info */}
          <div className="terminal-box mb-6 p-6">
            <div className="mb-4 text-center">
              <p className="text-lg text-white">
                {user?.firstName || user?.username || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })
                  : "--"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="terminal-box p-4 text-center">
              <p className="font-mono text-2xl font-bold text-white">
                {stats?.totalAttempts ?? "--"}
              </p>
              <p className="text-xs text-muted-foreground">ATTEMPTS</p>
            </div>
            <div className="terminal-box p-4 text-center">
              <p className="font-mono text-2xl font-bold text-white">
                {stats?.averageScore ?? "--"}
              </p>
              <p className="text-xs text-muted-foreground">AVG SCORE</p>
            </div>
            <div className="terminal-box p-4 text-center">
              <p className="font-mono text-2xl font-bold text-primary">
                {stats?.bestScore ?? "--"}
              </p>
              <p className="text-xs text-muted-foreground">BEST SCORE</p>
            </div>
            <div className="terminal-box-primary p-4 text-center">
              <p className="font-mono text-2xl font-bold text-primary">
                {creditBalance !== null ? creditBalance : "--"}
              </p>
              <p className="text-xs text-muted-foreground">CREDITS</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/submit"
              className="btn-terminal-secondary block w-full text-center"
            >
              SUBMIT A CHALLENGE
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
