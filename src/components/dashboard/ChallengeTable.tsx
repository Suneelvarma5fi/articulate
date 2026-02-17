"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

interface ChallengeRow {
  id: string;
  challenge_number: number;
  title: string;
  categories: string[];
  active_date: string;
  is_locked: boolean;
  user_best_score: number | null;
  user_attempt_count: number;
}

interface ChallengeTableProps {
  challenges: ChallengeRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

type SortKey = "challenge_number" | "active_date" | "user_best_score";
type SortDir = "asc" | "desc";

function getStatus(challenge: ChallengeRow): {
  label: string;
  dotClass: string;
  textClass: string;
} {
  if (challenge.is_locked) {
    return { label: "Locked", dotClass: "bg-[#2a2a2a]/15", textClass: "text-[#2a2a2a]/30" };
  }
  if (challenge.user_best_score !== null && challenge.user_best_score >= 0) {
    return { label: "Completed", dotClass: "bg-[#2a2a2a]", textClass: "text-[#2a2a2a]" };
  }
  const today = new Date().toISOString().split("T")[0];
  if (challenge.active_date === today) {
    return { label: "Active", dotClass: "bg-[#2a2a2a]/60", textClass: "text-[#2a2a2a]/80" };
  }
  return { label: "Open", dotClass: "bg-[#2a2a2a]/40", textClass: "text-[#2a2a2a]/60" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block text-[9px] ${active ? "text-[#2a2a2a]" : "text-[#2a2a2a]/20"}`}>
      {active ? (dir === "asc" ? "\u25B2" : "\u25BC") : "\u25BC"}
    </span>
  );
}

export function ChallengeTable({
  challenges,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
}: ChallengeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("active_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...challenges].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "challenge_number") {
        cmp = a.challenge_number - b.challenge_number;
      } else if (sortKey === "active_date") {
        cmp = a.active_date.localeCompare(b.active_date);
      } else if (sortKey === "user_best_score") {
        const scoreA = a.user_best_score ?? -1;
        const scoreB = b.user_best_score ?? -1;
        cmp = scoreA - scoreB;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [challenges, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] p-12 text-center">
        <p className="text-sm tracking-wide text-[#2a2a2a]/50">Loading...</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] p-12 text-center">
        <p className="text-sm tracking-wide text-[#2a2a2a]/60">No challenges found</p>
        <p className="mt-1 text-xs tracking-wide text-[#2a2a2a]/40">
          Try a different category or month.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5]">
      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_140px_80px_56px_88px] items-center border-b border-[#2a2a2a]/10 px-4 py-3 max-sm:hidden">
        <button onClick={() => toggleSort("challenge_number")} className="flex items-center text-[11px] tracking-wide text-[#2a2a2a]/50 hover:text-[#2a2a2a]">
          #<SortIcon active={sortKey === "challenge_number"} dir={sortDir} />
        </button>
        <span className="text-[11px] tracking-wide text-[#2a2a2a]/50">Title</span>
        <span className="text-[11px] tracking-wide text-[#2a2a2a]/50">Category</span>
        <button onClick={() => toggleSort("active_date")} className="flex items-center text-[11px] tracking-wide text-[#2a2a2a]/50 hover:text-[#2a2a2a]">
          Date<SortIcon active={sortKey === "active_date"} dir={sortDir} />
        </button>
        <button onClick={() => toggleSort("user_best_score")} className="flex items-center text-[11px] tracking-wide text-[#2a2a2a]/50 hover:text-[#2a2a2a]">
          Score<SortIcon active={sortKey === "user_best_score"} dir={sortDir} />
        </button>
        <span className="text-[11px] tracking-wide text-[#2a2a2a]/50">Status</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#2a2a2a]/5">
        {sorted.map((challenge) => {
          const status = getStatus(challenge);
          const isLocked = challenge.is_locked;

          const row = (
            <div
              className={`grid grid-cols-[40px_1fr_140px_80px_56px_88px] items-center px-4 py-3 text-sm transition-colors max-sm:grid-cols-[40px_1fr_56px] max-sm:gap-2 ${
                isLocked ? "opacity-30" : "hover:bg-[#2a2a2a]/[0.03]"
              }`}
            >
              <span className="text-xs text-[#2a2a2a]/50">
                {challenge.challenge_number}
              </span>
              <span className="truncate text-sm tracking-wide text-[#2a2a2a]">
                {challenge.title}
              </span>
              <span className="truncate text-xs tracking-wide text-[#2a2a2a]/50 max-sm:hidden">
                {challenge.categories[0] || "\u2014"}
              </span>
              <span className="text-xs tracking-wide text-[#2a2a2a]/50 max-sm:hidden">
                {formatDate(challenge.active_date)}
              </span>
              <span className={`text-xs max-sm:text-right ${challenge.user_best_score !== null ? "text-[#2a2a2a]" : "text-[#2a2a2a]/20"}`}>
                {challenge.user_best_score !== null ? challenge.user_best_score : "\u2014"}
              </span>
              <div className="flex items-center gap-1.5 max-sm:hidden">
                <div className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                <span className={`text-xs tracking-wide ${status.textClass}`}>{status.label}</span>
              </div>
            </div>
          );

          if (isLocked) {
            return <div key={challenge.id}>{row}</div>;
          }

          return (
            <Link key={challenge.id} href={`/challenge/${challenge.id}`} className="block">
              {row}
            </Link>
          );
        })}
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#2a2a2a]/10 px-4 py-3">
          <span className="text-xs tracking-wide text-[#2a2a2a]/50">
            {total} challenges
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg px-2 py-1 text-xs text-[#2a2a2a]/50 transition-colors hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a] disabled:opacity-30"
            >
              &lsaquo; Prev
            </button>
            <span className="px-2 text-xs text-[#2a2a2a]/50">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg px-2 py-1 text-xs text-[#2a2a2a]/50 transition-colors hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a] disabled:opacity-30"
            >
              Next &rsaquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
