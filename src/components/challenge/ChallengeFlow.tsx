"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Challenge, CREDITS_PER_GENERATION, ScoreBreakdown } from "@/types/database";
import { Toast } from "@/components/ui/Toast";
import { ScoreCounter } from "@/components/animations/ScoreCounter";
import { PurchaseModal } from "./PurchaseModal";
import { InlineLoading } from "./InlineLoading";
import { UserButton } from "@clerk/nextjs";

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

type LeftTab = "reference" | number;

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

function BreakdownBar({ label, score, max }: { label: string; score: number; max: number }) {
  const percent = Math.min((score / max) * 100, 100);
  const barColor = percent >= 80 ? "bg-green-400" : percent >= 50 ? "bg-primary" : "bg-white/30";

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-right text-[11px] text-white/40">{label}</span>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <span className="w-12 font-mono text-[11px] text-white/50">
        {score}/{max}
      </span>
    </div>
  );
}

function getScoreLabel(score: number) {
  if (score >= 80) return { text: "Exceptional", className: "text-green-400" };
  if (score >= 50) return { text: "Solid attempt", className: "text-white/60" };
  return { text: "Keep practicing", className: "text-white/40" };
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
  const [activeTab, setActiveTab] = useState<LeftTab>("reference");

  // Store draft text separately so we can show past attempt text on tab switch
  const draftTextRef = useRef("");

  const { wpm, wordCount, charCount } = useTypingStats(articulationText);

  const isLoading = flowState === "loading";
  const isActive =
    flowState === "input" || flowState === "loading" || flowState === "results";

  // Viewing a past attempt tab (not reference, not actively editing)
  const isViewingPastAttempt = typeof activeTab === "number";

  // Best score across all attempts
  const bestScore = pastAttempts.length > 0
    ? Math.max(...pastAttempts.map((a) => a.score))
    : null;

  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) {
      setArticulationText(prefill);
      draftTextRef.current = prefill;
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

  // Handle tab switching — populate textarea with past attempt's text
  const handleTabSwitch = (tab: LeftTab) => {
    if (tab === activeTab) return;

    // Save current draft when leaving reference tab
    if (activeTab === "reference") {
      draftTextRef.current = articulationText;
    }

    setActiveTab(tab);

    if (tab === "reference") {
      // Restore draft
      setArticulationText(draftTextRef.current);
    } else if (typeof tab === "number" && pastAttempts[tab]) {
      // Show past attempt's articulation
      setArticulationText(pastAttempts[tab].articulation_text);
    }
  };

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
    setActiveTab("reference");
    draftTextRef.current = trimmed;

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
      setActiveTab(0);
      // Clear draft after successful submission
      draftTextRef.current = "";
      setArticulationText(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setFlowState("input");
    }
  };

  const canGenerate =
    articulationText.trim().length >= 10 &&
    challenge !== null &&
    !isLoading &&
    !isViewingPastAttempt;

  const charLimit = challenge?.character_limit ?? 150;
  const charPercent = Math.min((charCount / charLimit) * 100, 100);
  const charBarColor =
    charPercent >= 95
      ? "bg-orange-500"
      : charPercent >= 80
      ? "bg-primary"
      : "bg-primary/40";

  const getLeftPanelImage = (): {
    src: string;
    alt: string;
    label: string;
  } | null => {
    if (activeTab === "reference" && challenge) {
      return {
        src: challenge.reference_image_url,
        alt: `Reference: ${challenge.title}`,
        label: "Reference Image",
      };
    }
    if (typeof activeTab === "number" && pastAttempts[activeTab]) {
      const attempt = pastAttempts[activeTab];
      return {
        src: attempt.generated_image_url,
        alt: `Attempt #${pastAttempts.length - activeTab}`,
        label: `Score: ${attempt.score} / 100`,
      };
    }
    return null;
  };

  const leftImage = getLeftPanelImage();

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Dark header for challenge screen */}
        <header className="mb-8 flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link href="/dashboard" className="font-handjet text-2xl tracking-wider text-white">
            ARTICULATE_
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-[11px] tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
            >
              DASHBOARD
            </Link>
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-4 py-1.5">
              <span className="text-[11px] tracking-[0.15em] text-white/40">
                CREDITS
              </span>
              <span className="font-mono text-sm font-semibold text-primary">
                {creditBalance !== null ? creditBalance : "--"}
              </span>
            </div>
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
          <div className="rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-8 text-center">
            <p className="mb-2 text-sm text-white/50">
              No active challenge
            </p>
            <p className="text-xs text-white/30">
              Check back soon for the next challenge.
            </p>
          </div>
        )}

        {flowState === "error" && !challenge && (
          <div className="rounded-xl border border-orange-500/30 bg-[#1A1A1A] p-6 text-center">
            <p className="mb-2 text-sm font-medium text-orange-400">
              Something went wrong
            </p>
            <p className="mb-4 text-sm text-white/50">
              {error || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                setError(null);
                setFlowState("input");
                fetchData();
              }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main split-panel layout */}
        {isActive && challenge && (
          <>
            {/* Challenge title + best score bar */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-white/30 transition-colors hover:text-white/60"
                >
                  &larr;
                </Link>
                <h1 className="font-handjet text-lg tracking-wide text-white">
                  {challenge.title}
                </h1>
                <span className="text-xs text-white/20">
                  {challenge.categories?.[0]}
                </span>
              </div>
              {bestScore !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/30">BEST</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {bestScore}
                  </span>
                  <span className="font-mono text-xs text-white/20">/100</span>
                </div>
              )}
            </div>

            <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-2">
              {/* LEFT PANEL: Image viewer with tabs */}
              <div className="flex flex-col">
                {/* Tab bar */}
                <div className="flex gap-1 overflow-x-auto rounded-t-xl border-b border-white/[0.06] bg-[#1A1A1A] px-2 pt-2">
                  <button
                    onClick={() => handleTabSwitch("reference")}
                    className={`shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition-all ${
                      activeTab === "reference"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    Reference
                  </button>
                  {pastAttempts.map((attempt, idx) => (
                    <button
                      key={attempt.id}
                      onClick={() => handleTabSwitch(idx)}
                      className={`shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition-all ${
                        activeTab === idx
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      #{pastAttempts.length - idx}{" "}
                      <span
                        className={
                          attempt.score >= 80
                            ? "text-green-400"
                            : attempt.score >= 50
                            ? "text-primary"
                            : "text-white/40"
                        }
                      >
                        {attempt.score}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Image display */}
                <div className="flex flex-1 items-center justify-center overflow-hidden rounded-b-xl border border-t-0 border-white/[0.06] bg-[#1A1A1A] p-4">
                  {isLoading && activeTab === "reference" ? (
                    <div className="flex flex-col items-center gap-3">
                      <InlineLoading />
                      <p className="text-xs text-white/40">
                        Generating...
                      </p>
                    </div>
                  ) : leftImage ? (
                    <div className="flex w-full flex-col items-center gap-3">
                      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
                        <Image
                          src={leftImage.src}
                          alt={leftImage.alt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority
                        />
                      </div>
                      <p className="text-xs text-white/40">
                        {leftImage.label}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* RIGHT PANEL: Articulation console */}
              <div className="flex flex-col">
                {/* Challenge metadata */}
                <div className="flex items-center gap-3 rounded-t-xl border-b border-white/[0.06] bg-[#1A1A1A] px-4 py-3 text-xs text-white/40">
                  <span className="font-medium text-primary">
                    {challenge.categories?.[0] || "General"}
                  </span>
                  <span className="text-white/10">|</span>
                  <span>Limit: {challenge.character_limit}</span>
                  <span className="text-white/10">|</span>
                  <span>Cost: {CREDITS_PER_GENERATION} cr</span>
                </div>

                {/* Score display */}
                {flowState === "results" && result && (
                  <div className="border-b border-primary/20 bg-primary/5 p-6 text-center">
                    <p className="mb-1 text-[11px] uppercase tracking-widest text-white/30">
                      Your Score
                    </p>
                    <div className="font-mono text-5xl font-bold text-primary">
                      <ScoreCounter target={result.score} />
                    </div>
                    <p className={`mt-1 text-xs ${getScoreLabel(result.score).className}`}>
                      {getScoreLabel(result.score).text}
                    </p>
                    <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-[1500ms] ease-out"
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                    {/* Score Autopsy breakdown */}
                    {result.scoreBreakdown && (
                      <div className="mx-auto mt-4 max-w-xs space-y-2">
                        <BreakdownBar label="Subject" score={result.scoreBreakdown.subject} max={35} />
                        <BreakdownBar label="Composition" score={result.scoreBreakdown.composition} max={25} />
                        <BreakdownBar label="Color" score={result.scoreBreakdown.color} max={20} />
                        <BreakdownBar label="Detail" score={result.scoreBreakdown.detail} max={20} />
                      </div>
                    )}
                    <div className="mt-3 text-[11px] text-white/30">
                      Credits spent: {result.creditsSpent} &middot; Remaining: {result.remainingBalance}
                    </div>
                  </div>
                )}

                {/* Error display */}
                {error && (
                  <div className="border-b border-orange-500/20 bg-orange-500/5 px-4 py-3">
                    <p className="text-xs text-orange-400">{error}</p>
                  </div>
                )}

                {/* Viewing past attempt indicator + breakdown */}
                {isViewingPastAttempt && !isLoading && (
                  <>
                    <div className="border-b border-white/[0.06] bg-white/[0.03] px-4 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-white/30">
                          Attempt #{pastAttempts.length - (activeTab as number)} &mdash;{" "}
                          <button
                            onClick={() => handleTabSwitch("reference")}
                            className="text-primary hover:text-primary/80"
                          >
                            back to editor
                          </button>
                        </p>
                        <span className="font-mono text-sm font-bold text-primary">
                          {pastAttempts[activeTab as number]?.score}/100
                        </span>
                      </div>
                    </div>
                    {pastAttempts[activeTab as number]?.score_breakdown && (
                      <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <div className="space-y-1.5">
                          <BreakdownBar label="Subject" score={pastAttempts[activeTab as number].score_breakdown!.subject} max={35} />
                          <BreakdownBar label="Composition" score={pastAttempts[activeTab as number].score_breakdown!.composition} max={25} />
                          <BreakdownBar label="Color" score={pastAttempts[activeTab as number].score_breakdown!.color} max={20} />
                          <BreakdownBar label="Detail" score={pastAttempts[activeTab as number].score_breakdown!.detail} max={20} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Textarea */}
                <div className="flex flex-1 flex-col bg-[#1A1A1A]">
                  <textarea
                    id="articulation-input"
                    value={articulationText}
                    onChange={(e) => {
                      if (!isViewingPastAttempt) {
                        setArticulationText(e.target.value);
                        draftTextRef.current = e.target.value;
                      }
                    }}
                    disabled={isLoading}
                    readOnly={isViewingPastAttempt}
                    maxLength={challenge.character_limit}
                    placeholder="Describe the reference image with precision..."
                    className={`flex-1 resize-none border-0 bg-transparent p-4 text-sm text-white placeholder:text-white/20 focus:outline-none disabled:opacity-50 ${
                      isViewingPastAttempt ? "italic text-white/50" : ""
                    }`}
                    style={{ minHeight: "200px" }}
                    aria-describedby="typing-stats"
                  />

                  {/* Character limit bar */}
                  <div className="mx-4 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${charBarColor}`}
                      style={{ width: `${charPercent}%` }}
                    />
                  </div>

                  {/* Stats bar */}
                  <div
                    id="typing-stats"
                    className="flex items-center justify-between px-4 py-2 text-[11px] text-white/30"
                  >
                    <div className="flex gap-4">
                      <span>
                        {charCount}/{challenge.character_limit} chars
                      </span>
                      <span>{wordCount} words</span>
                      {!isViewingPastAttempt && <span>{wpm} wpm</span>}
                    </div>
                    <span
                      className={
                        isViewingPastAttempt
                          ? "text-white/20"
                          : articulationText.trim().length >= 10
                          ? "text-green-400"
                          : charCount > 0
                          ? "text-primary"
                          : ""
                      }
                    >
                      {isViewingPastAttempt
                        ? "Read-only"
                        : charCount === 0
                        ? "Idle"
                        : articulationText.trim().length >= 10
                        ? "Ready"
                        : "Composing"}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="rounded-b-xl border-t border-white/[0.06] bg-[#1A1A1A] p-4">
                  {isViewingPastAttempt ? (
                    <button
                      onClick={() => handleTabSwitch("reference")}
                      className="w-full rounded-lg border border-white/[0.08] bg-transparent py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white"
                    >
                      Back to Editor
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-40"
                    >
                      {isLoading
                        ? "Generating..."
                        : `Submit (${CREDITS_PER_GENERATION} credits)`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {flowState === "input" && !challenge && !error && (
          <div className="rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-8 text-center">
            <p className="text-sm text-white/40">
              Loading challenge...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
