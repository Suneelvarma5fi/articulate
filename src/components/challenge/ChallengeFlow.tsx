"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Challenge, CREDITS_PER_GENERATION, ScoreBreakdown } from "@/types/database";
import { Toast } from "@/components/ui/Toast";
import { PurchaseModal } from "./PurchaseModal";
import { InlineLoading } from "./InlineLoading";
import { ScoreBubbles } from "./ScoreBubbles";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";

type FlowState = "input" | "loading" | "results" | "error" | "no-challenge";

interface GenerationResult {
  score: number;
  scoreBreakdown: ScoreBreakdown | null;
  generatedImageUrl: string;
  creditsSpent: number;
  remainingBalance: number;
}

interface PastAttempt {
  id: string;
  score: number;
  score_breakdown: ScoreBreakdown | null;
  generated_image_url: string;
  articulation_text: string;
  credits_spent: number;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
}

interface ChallengeFlowProps {
  challengeId?: string;
}

function useTypingStats(text: string) {
  const [wpm, setWpm] = useState(0);
  const keystrokeTimestamps = useRef<number[]>([]);
  const prevLength = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (text.length > prevLength.current) {
      keystrokeTimestamps.current.push(now);
    }
    prevLength.current = text.length;

    const windowMs = 10_000;
    const cutoff = now - windowMs;
    keystrokeTimestamps.current = keystrokeTimestamps.current.filter(
      (t) => t > cutoff
    );

    const charsInWindow = keystrokeTimestamps.current.length;
    if (charsInWindow > 1) {
      const elapsed =
        (keystrokeTimestamps.current[charsInWindow - 1] -
          keystrokeTimestamps.current[0]) /
        1000;
      if (elapsed > 0) {
        const wordsInWindow = charsInWindow / 5;
        const minutesFraction = elapsed / 60;
        setWpm(Math.round(wordsInWindow / minutesFraction));
      }
    } else {
      setWpm(0);
    }
  }, [text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return { wpm, wordCount, charCount };
}

function getScoreLabel(score: number) {
  if (score >= 80) return { text: "Exceptional", className: "text-green-400" };
  if (score >= 50) return { text: "Solid attempt", className: "text-muted-foreground" };
  return { text: "Keep practicing", className: "text-muted-foreground" };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      title="Copy text"
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Copied
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy
        </>
      )}
    </button>
  );
}

function AttemptCard({
  attempt,
  challenge,
  index,
  total,
}: {
  attempt: PastAttempt;
  challenge: Challenge;
  index: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 3-column: ref image | generated image | score bubbles */}
      <div className="grid grid-cols-3 gap-0">
        {/* Reference image */}
        <div className="relative aspect-square border-r border-border p-2">
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Image
              src={challenge.reference_image_url}
              alt="Reference"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 20vw"
            />
          </div>
          <span className="absolute left-3 top-3 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/60">
            REF
          </span>
        </div>
        {/* Generated image */}
        <div className="relative aspect-square border-r border-border p-2">
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Image
              src={attempt.generated_image_url}
              alt={`Attempt #${total - index}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 20vw"
            />
          </div>
          <span className="absolute left-3 top-3 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/60">
            #{total - index}
          </span>
        </div>
        {/* Score bubbles */}
        <div className="flex items-center justify-center p-3">
          <ScoreBubbles total={attempt.score} breakdown={attempt.score_breakdown} />
        </div>
      </div>
      {/* Articulation text + copy */}
      <div className="flex items-start justify-between gap-3 border-t border-border px-4 py-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground break-words">
          {attempt.articulation_text}
        </p>
        <CopyButton text={attempt.articulation_text} />
      </div>
    </div>
  );
}

export function ChallengeFlow({ challengeId }: ChallengeFlowProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [flowState, setFlowState] = useState<FlowState>("input");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [articulationText, setArticulationText] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [pastAttempts, setPastAttempts] = useState<PastAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => { setThemeMounted(true); }, []);

  const { wpm, wordCount, charCount } = useTypingStats(articulationText);

  const isLoading = flowState === "loading";
  const isActive =
    flowState === "input" || flowState === "loading" || flowState === "results";

  const bestScore = pastAttempts.length > 0
    ? Math.max(...pastAttempts.map((a) => a.score))
    : null;

  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) {
      setArticulationText(prefill);
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname]);

  const fetchData = useCallback(async () => {
    try {
      const challengeUrl = challengeId
        ? `/api/challenges/${challengeId}`
        : "/api/challenges/today";

      const [challengeRes, creditsRes] = await Promise.all([
        fetch(challengeUrl),
        fetch("/api/credits/balance"),
      ]);

      if (challengeRes.ok) {
        const data = await challengeRes.json();
        setChallenge(data.challenge);
        if (data.attempts) {
          setPastAttempts(data.attempts);
        }
      } else {
        setFlowState("no-challenge");
      }

      if (creditsRes.ok) {
        const data = await creditsRes.json();
        setCreditBalance(data.balance);
      }
    } catch {
      setError("Failed to load challenge data");
      setFlowState("error");
    }
  }, [challengeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch leaderboard
  useEffect(() => {
    if (!challengeId) return;
    fetch(`/api/challenges/${challengeId}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.totalSubmissions != null) setTotalSubmissions(data.totalSubmissions);
      })
      .catch(() => {});
  }, [challengeId, pastAttempts.length]);

  useEffect(() => {
    if (searchParams.get("purchase") === "success") {
      const paymentId = searchParams.get("payment_id");

      const verifyAndRefresh = async () => {
        if (paymentId) {
          await fetch("/api/dodo/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          }).catch(() => {});
        }

        const res = await fetch("/api/credits/balance");
        if (res.ok) {
          const data = await res.json();
          setCreditBalance(data.balance);
        }
      };

      verifyAndRefresh();
      setToast({ message: "Credits added to your account", type: "success" });
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname]);

  const handleGenerate = async () => {
    if (!challenge) return;

    const trimmed = articulationText.trim();
    if (trimmed.length < 10) {
      setError("Articulation must be at least 10 characters");
      return;
    }

    const creditsNeeded = CREDITS_PER_GENERATION;
    if (creditBalance !== null && creditBalance < creditsNeeded) {
      setShowPurchaseModal(true);
      return;
    }

    setError(null);
    setResult(null);
    setFlowState("loading");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          articulationText: trimmed,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", res.status, text.slice(0, 200));
        throw new Error(`Server error (${res.status}). Please try again.`);
      }

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (res.status === 402) {
        setShowPurchaseModal(true);
        setFlowState("input");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      const newResult = {
        score: data.score,
        scoreBreakdown: data.scoreBreakdown || null,
        generatedImageUrl: data.generatedImageUrl,
        creditsSpent: data.creditsSpent,
        remainingBalance: data.remainingBalance,
      };

      setResult(newResult);
      setCreditBalance(data.remainingBalance);
      setFlowState("results");

      const newAttempt: PastAttempt = {
        id: `new-${Date.now()}`,
        score: data.score,
        score_breakdown: data.scoreBreakdown || null,
        generated_image_url: data.generatedImageUrl,
        articulation_text: trimmed,
        credits_spent: data.creditsSpent,
        created_at: new Date().toISOString(),
      };
      setPastAttempts((prev) => [newAttempt, ...prev]);

      // Refresh leaderboard after a delay to let the DB settle
      if (challengeId) {
        setTimeout(() => {
          fetch(`/api/challenges/${challengeId}/leaderboard`)
            .then((res) => res.json())
            .then((lbData) => {
              if (lbData.leaderboard) setLeaderboard(lbData.leaderboard);
              if (lbData.totalSubmissions != null) setTotalSubmissions(lbData.totalSubmissions);
            })
            .catch(() => {});
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setFlowState("input");
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setFlowState("input");
    // Keep text — user can refine and resubmit
    editorRef.current?.focus();
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const canGenerate =
    articulationText.trim().length >= 10 &&
    challenge !== null &&
    !isLoading;

  const charLimit = challenge?.character_limit ?? 150;
  const charPercent = Math.min((charCount / charLimit) * 100, 100);
  const charBarColor =
    charPercent >= 95
      ? "bg-orange-500"
      : charPercent >= 80
      ? "bg-primary"
      : "bg-primary/40";

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <Link href="/dashboard" className="font-handjet text-2xl tracking-wider text-foreground">
            ARTICULATE_
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-[11px] tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              DASHBOARD
            </Link>
            <Link
              href="/profile"
              className="text-[11px] tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              PROFILE
            </Link>
            <div className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5">
              <span className="text-[11px] tracking-[0.15em] text-muted-foreground">
                CREDITS
              </span>
              <span className="font-mono text-sm font-semibold text-primary">
                {creditBalance !== null ? creditBalance : "--"}
              </span>
            </div>
            {themeMounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                )}
              </button>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}

        {showPurchaseModal && (
          <PurchaseModal
            onClose={() => setShowPurchaseModal(false)}
            currentBalance={creditBalance || 0}
            creditsNeeded={CREDITS_PER_GENERATION}
          />
        )}

        {flowState === "no-challenge" && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="mb-2 text-sm text-muted-foreground">No active challenge</p>
            <p className="text-xs text-muted-foreground">Check back soon for the next challenge.</p>
          </div>
        )}

        {flowState === "error" && !challenge && (
          <div className="rounded-xl border border-orange-500/30 bg-card p-6 text-center">
            <p className="mb-2 text-sm font-medium text-orange-400">Something went wrong</p>
            <p className="mb-4 text-sm text-muted-foreground">{error || "An unexpected error occurred."}</p>
            <button
              onClick={() => { setError(null); setFlowState("input"); fetchData(); }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Main area ─── */}
        {isActive && challenge && (
          <>
            {/* Title bar */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-muted-foreground/50 transition-colors hover:text-muted-foreground">
                  &larr;
                </Link>
                <h1 className="font-handjet text-lg tracking-wide text-foreground">
                  {challenge.title}
                </h1>
                <span className="text-xs text-muted-foreground/50">{challenge.categories?.[0]}</span>
              </div>
              <div className="flex items-center gap-4">
                {bestScore !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">BEST</span>
                    <span className="font-mono text-lg font-bold text-primary">{bestScore}</span>
                    <span className="font-mono text-xs text-muted-foreground/50">/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Split panel: Reference Image | Text Input */}
            <div className="grid min-h-[50vh] grid-cols-1 gap-4 lg:grid-cols-2">
              {/* LEFT: Reference image (always visible) */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-2.5">
                  <span className="text-[11px] tracking-[0.15em] text-muted-foreground">CHALLENGE</span>
                </div>
                <div className="flex flex-1 items-center justify-center p-4">
                  {isLoading ? (
                    <InlineLoading />
                  ) : (
                    <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
                      <Image
                        src={challenge.reference_image_url}
                        alt={`Reference: ${challenge.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Text input + submit OR Score results */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                {/* Results view with score bubbles */}
                {flowState === "results" && result ? (
                  <div className="flex flex-1 flex-col">
                    {/* Score bubbles */}
                    <div className="flex flex-1 flex-col items-center justify-center p-6">
                      <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                        Your Score
                      </p>
                      <p className={`mb-4 text-xs ${getScoreLabel(result.score).className}`}>
                        {getScoreLabel(result.score).text}
                      </p>
                      <ScoreBubbles total={result.score} breakdown={result.scoreBreakdown} />
                      <p className="mt-4 text-[11px] text-muted-foreground/50">
                        Credits spent: {result.creditsSpent} &middot; Remaining: {result.remainingBalance}
                      </p>
                    </div>
                    {/* TRY AGAIN button */}
                    <div className="border-t border-border p-4">
                      <button
                        onClick={handleTryAgain}
                        className="w-full rounded-lg border border-primary/30 bg-primary/10 py-3 text-sm font-medium tracking-wider text-primary transition-all hover:bg-primary/20"
                      >
                        TRY AGAIN?
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Input view */
                  <div className="flex flex-1 flex-col">
                    {/* Metadata bar */}
                    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
                      <span className="font-medium text-primary">
                        {challenge.categories?.[0] || "General"}
                      </span>
                      <span className="text-border">|</span>
                      <span>Limit: {challenge.character_limit}</span>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="border-b border-orange-500/20 bg-orange-500/5 px-4 py-3">
                        <p className="text-xs text-orange-400">{error}</p>
                      </div>
                    )}

                    {/* Textarea */}
                    <textarea
                      ref={editorRef}
                      value={articulationText}
                      onChange={(e) => setArticulationText(e.target.value)}
                      disabled={isLoading}
                      maxLength={challenge.character_limit}
                      placeholder="Describe the reference image with precision..."
                      className="flex-1 resize-none border-0 bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                      style={{ minHeight: "200px" }}
                    />

                    {/* Character bar */}
                    <div className="mx-4 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-150 ${charBarColor}`}
                        style={{ width: `${charPercent}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground">
                      <div className="flex gap-4">
                        <span>{charCount}/{challenge.character_limit} chars</span>
                        <span>{wordCount} words</span>
                        <span>{wpm} wpm</span>
                      </div>
                      <span
                        className={
                          articulationText.trim().length >= 10
                            ? "text-green-400"
                            : charCount > 0
                            ? "text-primary"
                            : ""
                        }
                      >
                        {charCount === 0 ? "Idle" : articulationText.trim().length >= 10 ? "Ready" : "Composing"}
                      </span>
                    </div>

                    {/* Submit */}
                    <div className="border-t border-border p-4">
                      <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
                      >
                        {isLoading ? "Generating..." : `Submit (${CREDITS_PER_GENERATION} credits)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Below: Submissions (left) + Leaderboard (right) ─── */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              {/* Submissions — left */}
              <div>
                <h2 className="mb-4 text-xs font-medium tracking-[0.15em] text-muted-foreground">
                  SUBMISSIONS
                  {pastAttempts.length > 0 && (
                    <span className="ml-2 font-mono text-muted-foreground">({pastAttempts.length})</span>
                  )}
                </h2>
                {pastAttempts.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No attempts yet. Write your description above and submit.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastAttempts.map((attempt, idx) => (
                      <AttemptCard
                        key={attempt.id}
                        attempt={attempt}
                        challenge={challenge}
                        index={idx}
                        total={pastAttempts.length}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Leaderboard — right */}
              <div>
                <h2 className="mb-4 text-xs font-medium tracking-[0.15em] text-muted-foreground">
                  LEADERBOARD
                </h2>
                {leaderboard.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No scores yet.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-5 py-3.5 border-b border-border ${idx === 0 ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-6 font-mono text-sm ${idx === 0 ? "font-bold text-primary" : "text-muted-foreground"}`}>
                            {entry.rank}
                          </span>
                          <span className={`text-sm ${idx === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            @{entry.username}
                          </span>
                        </div>
                        <span className={`font-mono text-sm font-bold ${
                          entry.score >= 80 ? "text-green-400" : entry.score >= 50 ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {entry.score}
                        </span>
                      </div>
                    ))}
                    {totalSubmissions > leaderboard.length && (
                      <div className="px-5 py-3 text-center text-xs text-muted-foreground">
                        {totalSubmissions - leaderboard.length} more submission{totalSubmissions - leaderboard.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {flowState === "input" && !challenge && !error && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Loading challenge...</p>
          </div>
        )}
      </div>
    </main>
  );
}
