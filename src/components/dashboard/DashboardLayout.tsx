"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { StreakCounter } from "./StreakCounter";
import { RecentChallenges } from "./RecentChallenges";
import { ActivityCalendar } from "./ActivityCalendar";
import { CategoryFilter } from "./CategoryFilter";
import { ChallengeTable } from "./ChallengeTable";

interface DashboardData {
  streak: number;
  averageScore: number;
  recentChallenges: Array<{
    id: string;
    title: string;
    reference_image_url: string;
    active_date: string;
    challenge_number: number;
    user_best_score: number | null;
    user_attempted: boolean;
  }>;
  calendarData: Record<
    string,
    { completed: boolean; bestScore: number | null; challengeId: string }
  >;
  calendarMonth: string;
  categories: string[];
  solvedCount: number;
  totalCount: number;
}

interface ChallengeListItem {
  id: string;
  challenge_number: number;
  title: string;
  categories: string[];
  active_date: string;
  is_locked: boolean;
  user_best_score: number | null;
  user_attempt_count: number;
}

export function DashboardLayout() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [pickingOne, setPickingOne] = useState(false);

  const fetchDashboard = useCallback(async (month: string) => {
    try {
      const res = await fetch(`/api/user/dashboard?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchChallenges = useCallback(async (month: string, pageNum: number, category?: string, searchTerm?: string) => {
    setLoadingChallenges(true);
    try {
      const params = new URLSearchParams({ month, page: String(pageNum), limit: "10" });
      if (category) params.set("category", category);
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/challenges/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges);
        setTotalPages(data.totalPages);
        setTotalChallenges(data.total);
      }
    } catch {
      // silently fail
    }
    setLoadingChallenges(false);
  }, []);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((res) => res.json())
      .then((data) => setCreditBalance(data.balance))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDashboard(calendarMonth);
  }, [calendarMonth, fetchDashboard]);

  useEffect(() => {
    const category = selectedCategories.length === 1 ? selectedCategories[0] : undefined;
    fetchChallenges(calendarMonth, page, category, search || undefined);
  }, [calendarMonth, page, selectedCategories, search, fetchChallenges]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [calendarMonth, selectedCategories, search]);

  const filteredChallenges =
    selectedCategories.length <= 1
      ? challenges
      : challenges.filter((c) =>
          c.categories.some((cat) => selectedCategories.includes(cat))
        );

  const handlePickOne = async () => {
    setPickingOne(true);
    try {
      // Fetch all challenges for this month (no pagination)
      const params = new URLSearchParams({ month: calendarMonth, page: "1", limit: "50" });
      const res = await fetch(`/api/challenges/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        const unfinished = (data.challenges as ChallengeListItem[]).filter(
          (c) => !c.is_locked && c.user_best_score === null
        );
        if (unfinished.length > 0) {
          const random = unfinished[Math.floor(Math.random() * unfinished.length)];
          router.push(`/challenge/${random.id}`);
          return;
        }
      }
    } catch {
      // fall through
    }
    setPickingOne(false);
  };

  return (
    <main className="px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Header creditBalance={creditBalance} />

        {/* Top: Streak + Challenges + Calendar */}
        <section className="mb-10 mt-8">
          <p className="mb-4 font-handjet text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Recent Challenges
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
            {/* Left: Streak + 3 challenge cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StreakCounter
                streak={dashboardData?.streak ?? 0}
                averageScore={dashboardData?.averageScore ?? 0}
              />
              {dashboardData?.recentChallenges && dashboardData.recentChallenges.length > 0 ? (
                <RecentChallenges challenges={dashboardData.recentChallenges} />
              ) : (
                <>
                  <div className="flex h-44 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                    <p className="text-xs text-muted-foreground">No challenges</p>
                  </div>
                  <div className="h-44 rounded-xl border border-border bg-card shadow-sm max-sm:hidden" />
                  <div className="h-44 rounded-xl border border-border bg-card shadow-sm max-sm:hidden" />
                </>
              )}
            </div>

            {/* Right: Calendar — match card height */}
            <div className="min-w-0 h-44 max-w-[220px] max-lg:max-w-full">
              <ActivityCalendar
                calendarData={dashboardData?.calendarData ?? {}}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
              />
            </div>
          </div>
        </section>

        {/* Bottom: Table + Category sidebar */}
        <section>
          {/* Section header with search, counter, and pick-one */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {/* Search — left-aligned */}
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search challenges..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 w-44 rounded-lg border border-border bg-card pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* X / Y solved counter */}
            {dashboardData && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {dashboardData.solvedCount} / {dashboardData.totalCount}
              </span>
            )}

            <div className="flex-1" />

            {/* Pick one — dice icon */}
            <button
              onClick={handlePickOne}
              disabled={pickingOne}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              title="Pick a random challenge"
            >
              {pickingOne ? (
                <span className="text-[10px]">...</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <path d="M16 8h.01" />
                  <path d="M12 12h.01" />
                  <path d="M8 16h.01" />
                  <path d="M16 16h.01" />
                  <path d="M8 8h.01" />
                </svg>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
            <ChallengeTable
              challenges={filteredChallenges}
              loading={loadingChallenges}
              page={page}
              totalPages={totalPages}
              total={totalChallenges}
              onPageChange={setPage}
            />

            <CategoryFilter
              categories={dashboardData?.categories ?? []}
              selected={selectedCategories}
              onSelectionChange={setSelectedCategories}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
