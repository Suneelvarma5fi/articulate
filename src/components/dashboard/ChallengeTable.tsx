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
    return { label: "Locked", dotClass: "bg-muted-foreground/30", textClass: "text-muted-foreground/50" };
  }
  if (challenge.user_best_score !== null && challenge.user_best_score >= 0) {
    return { label: "Completed", dotClass: "bg-success", textClass: "text-success" };
  }
  const today = new Date().toISOString().split("T")[0];
  if (challenge.active_date === today) {
    return { label: "Active", dotClass: "bg-primary", textClass: "text-primary" };
  }
  return { label: "Open", dotClass: "bg-muted-foreground/50", textClass: "text-muted-foreground" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block text-[9px] ${active ? "text-foreground" : "text-muted-foreground/30"}`}>
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
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <p className="text-sm text-foreground/60">No challenges found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try a different category or month.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_140px_80px_56px_88px] items-center border-b border-border px-4 py-3 max-sm:hidden">
        <button onClick={() => toggleSort("challenge_number")} className="flex items-center text-[11px] text-muted-foreground hover:text-foreground">
          #<SortIcon active={sortKey === "challenge_number"} dir={sortDir} />
        </button>
        <span className="text-[11px] text-muted-foreground">Title</span>
        <span className="text-[11px] text-muted-foreground">Category</span>
        <button onClick={() => toggleSort("active_date")} className="flex items-center text-[11px] text-muted-foreground hover:text-foreground">
          Date<SortIcon active={sortKey === "active_date"} dir={sortDir} />
        </button>
        <button onClick={() => toggleSort("user_best_score")} className="flex items-center text-[11px] text-muted-foreground hover:text-foreground">
          Score<SortIcon active={sortKey === "user_best_score"} dir={sortDir} />
        </button>
        <span className="text-[11px] text-muted-foreground">Status</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {sorted.map((challenge) => {
          const status = getStatus(challenge);
          const isLocked = challenge.is_locked;

          const row = (
            <div
              className={`grid grid-cols-[40px_1fr_140px_80px_56px_88px] items-center px-4 py-3 text-sm transition-colors max-sm:grid-cols-[40px_1fr_56px] max-sm:gap-2 ${
                isLocked ? "opacity-30" : "hover:bg-secondary/50"
              }`}
            >
              <span className="font-mono text-xs text-muted-foreground">
                {challenge.challenge_number}
              </span>
              <span className="truncate text-sm text-foreground">
                {challenge.title}
              </span>
              <span className="truncate text-xs text-muted-foreground max-sm:hidden">
                {challenge.categories[0] || "\u2014"}
              </span>
              <span className="text-xs text-muted-foreground max-sm:hidden">
                {formatDate(challenge.active_date)}
              </span>
              <span className={`font-mono text-xs max-sm:text-right ${challenge.user_best_score !== null ? "font-semibold text-primary" : "text-muted-foreground/30"}`}>
                {challenge.user_best_score !== null ? challenge.user_best_score : "\u2014"}
              </span>
              <div className="flex items-center gap-1.5 max-sm:hidden">
                <div className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                <span className={`text-xs ${status.textClass}`}>{status.label}</span>
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
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {total} challenges
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
            >
              &lsaquo; Prev
            </button>
            <span className="px-2 font-mono text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
            >
              Next &rsaquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
