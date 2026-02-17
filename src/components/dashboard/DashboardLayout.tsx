"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChallenges, setTotalChallenges] = useState(0);

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

  const fetchChallenges = useCallback(async (month: string, pageNum: number, category?: string) => {
    setLoadingChallenges(true);
    try {
      const params = new URLSearchParams({ month, page: String(pageNum), limit: "10" });
      if (category) params.set("category", category);
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
    fetchChallenges(calendarMonth, page, category);
  }, [calendarMonth, page, selectedCategories, fetchChallenges]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [calendarMonth, selectedCategories]);

  const filteredChallenges =
    selectedCategories.length <= 1
      ? challenges
      : challenges.filter((c) =>
          c.categories.some((cat) => selectedCategories.includes(cat))
        );

  return (
    <main className="px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Header creditBalance={creditBalance} />

        {/* ═══ Top: Streak + Challenges + Calendar ═══ */}
        <section className="mb-10">
          <p className="mb-3 text-[11px] tracking-[0.2em] text-[#2a2a2a]/50">
            RECENT CHALLENGES
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
                  <div className="flex h-44 items-center justify-center rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5]">
                    <p className="text-xs tracking-wide text-[#2a2a2a]/40">No challenges</p>
                  </div>
                  <div className="h-44 rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] max-sm:hidden" />
                  <div className="h-44 rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] max-sm:hidden" />
                </>
              )}
            </div>

            {/* Right: Calendar */}
            <div>
              <ActivityCalendar
                calendarData={dashboardData?.calendarData ?? {}}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
              />
            </div>
          </div>
        </section>

        {/* ═══ Bottom: Table + Category sidebar ═══ */}
        <section>
          <p className="mb-3 text-[11px] tracking-[0.2em] text-[#2a2a2a]/50">
            ALL CHALLENGES
          </p>
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
