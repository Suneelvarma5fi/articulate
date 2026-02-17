"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { MatrixRain } from "@/components/animations/MatrixRain";



interface AttemptWithChallenge {
  id: string;
  articulation_text: string;
  character_count: number;
  quality_level: number;
  credits_spent: number;
  generated_image_url: string;
  score: number;
  created_at: string;
  challenges: {
    id: string;
    title: string;
    reference_image_url: string;
    categories: string[];
    character_limit: number;
    active_date: string;
  };
}

export function HistoryView() {
  const [attempts, setAttempts] = useState<AttemptWithChallenge[]>([]);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attempts/history?page=${pageNum}`);
      if (res.ok) {
        const data = await res.json();
        setAttempts((prev) =>
          append ? [...prev, ...data.attempts] : data.attempts
        );
        setHasMore(data.hasMore);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory(1);
    fetch("/api/credits/balance")
      .then((res) => res.json())
      .then((data) => setCreditBalance(data.balance))
      .catch(() => {});
  }, [fetchHistory]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistory(next, true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
              YOUR ATTEMPTS
            </h1>
            <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
              ═══════════════════════════════════════════════
            </div>
          </div>

          {!loading && attempts.length === 0 && (
            <div className="terminal-box p-8 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                No attempts yet.
              </p>
              <p className="mb-6 text-xs text-muted-foreground">
                Complete your first daily challenge to start building your
                articulation score.
              </p>
              <Link href="/dashboard" className="btn-terminal-primary inline-block">
                START TODAY&apos;S CHALLENGE
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {attempts.map((attempt) => {
              const challenge = attempt.challenges;
              const isExpanded = expandedId === attempt.id;
              return (
                <div key={attempt.id} className="terminal-box p-4">
                  {/* Summary row */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {/* Thumbnails */}
                      <div className="flex gap-2">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden border border-border sm:h-16 sm:w-16">
                          <Image
                            src={challenge.reference_image_url}
                            alt="Reference"
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden border border-border sm:h-16 sm:w-16">
                          <Image
                            src={attempt.generated_image_url}
                            alt="Generated"
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      </div>

                      {/* Meta */}
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(attempt.created_at)}
                        </p>
                        <p className="text-sm text-white">
                          {challenge.title || challenge.categories?.[0] || "Challenge"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.credits_spent} credit{attempt.credits_spent !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Score + expand */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono text-2xl font-bold text-white">
                          {String(attempt.score).padStart(3, "0")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /100
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/challenge/${challenge.id}?prefill=${encodeURIComponent(attempt.articulation_text)}`}
                          className="text-xs text-primary transition-colors hover:text-primary/80"
                        >
                          [ USE ]
                        </Link>
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : attempt.id)
                          }
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {isExpanded ? "[ HIDE ]" : "[ VIEW ]"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs tracking-wide text-muted-foreground">
                            REFERENCE
                          </p>
                          <div className="terminal-box relative aspect-square w-full overflow-hidden">
                            <Image
                              src={challenge.reference_image_url}
                              alt="Reference"
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs tracking-wide text-muted-foreground">
                            GENERATED
                          </p>
                          <div className="terminal-box relative aspect-square w-full overflow-hidden">
                            <Image
                              src={attempt.generated_image_url}
                              alt="Generated"
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-1 text-xs tracking-wide text-muted-foreground">
                          YOUR ARTICULATION:
                        </p>
                        <p className="terminal-box p-3 text-sm italic text-foreground">
                          &ldquo;{attempt.articulation_text}&rdquo;
                        </p>
                      </div>

                      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                        <span>Characters: {attempt.character_count}/{challenge.character_limit}</span>
                        <span>Score: {attempt.score}/100</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <span className="text-sm text-muted-foreground">
                Loading<span className="cursor-blink text-primary">_</span>
              </span>
            </div>
          )}

          {hasMore && !loading && (
            <div className="mt-6 text-center">
              <button onClick={loadMore} className="btn-terminal-secondary">
                LOAD MORE
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
