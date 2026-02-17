"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Challenge, CREDITS_PER_GENERATION } from "@/types/database";
import { Header } from "@/components/layout/Header";
import { Toast } from "@/components/ui/Toast";
import { ScoreCounter } from "@/components/animations/ScoreCounter";
import { PurchaseModal } from "./PurchaseModal";
import { InlineLoading } from "./InlineLoading";

type FlowState = "input" | "loading" | "results" | "error" | "no-challenge";

interface GenerationResult {
  score: number;
  generatedImageUrl: string;
  creditsSpent: number;
  remainingBalance: number;
}

interface PastAttempt {
  id: string;
  score: number;
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

  const { wpm, wordCount, charCount } = useTypingStats(articulationText);

  const isLoading = flowState === "loading";
  const isActive =
    flowState === "input" || flowState === "loading" || flowState === "results";

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
    setActiveTab("reference");

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
        generated_image_url: data.generatedImageUrl,
        articulation_text: trimmed,
        credits_spent: data.creditsSpent,
        created_at: new Date().toISOString(),
      };
      setPastAttempts((prev) => [newAttempt, ...prev]);
      setActiveTab(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setFlowState("input");
    }
  };

  const canGenerate =
    articulationText.trim().length >= 10 && challenge !== null && !isLoading;

  const charLimit = challenge?.character_limit ?? 150;
  const charPercent = Math.min((charCount / charLimit) * 100, 100);
  const charBarColor =
    charPercent >= 95
      ? "bg-destructive"
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
        <Header creditBalance={creditBalance} />

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
          <div className="card p-8 text-center">
            <p className="mb-2 text-sm text-muted-foreground">
              No active challenge
            </p>
            <p className="text-xs text-muted-foreground/60">
              Check back soon for the next challenge.
            </p>
          </div>
        )}

        {flowState === "error" && !challenge && (
          <div className="card border-destructive/30 p-6 text-center">
            <p className="mb-2 text-sm font-medium text-destructive">
              Something went wrong
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              {error || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                setError(null);
                setFlowState("input");
                fetchData();
              }}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main split-panel layout */}
        {isActive && challenge && (
          <>
            {challengeId && (
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>&larr;</span> Back to Dashboard
              </Link>
            )}

            <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-2">
              {/* ═══ LEFT PANEL: Image viewer with tabs ═══ */}
              <div className="flex flex-col">
                {/* Tab bar */}
                <div className="flex gap-1 overflow-x-auto rounded-t-xl border-b border-border bg-card px-2 pt-2">
                  <button
                    onClick={() => setActiveTab("reference")}
                    className={`shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition-all ${
                      activeTab === "reference"
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Reference
                  </button>
                  {pastAttempts.map((attempt, idx) => (
                    <button
                      key={attempt.id}
                      onClick={() => setActiveTab(idx)}
                      className={`shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition-all ${
                        activeTab === idx
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      #{pastAttempts.length - idx}{" "}
                      <span
                        className={
                          attempt.score >= 80
                            ? "text-terminal-green"
                            : attempt.score >= 50
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        {attempt.score}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Image display */}
                <div className="card flex flex-1 items-center justify-center overflow-hidden rounded-t-none p-4">
                  {isLoading && activeTab === "reference" ? (
                    <div className="flex flex-col items-center gap-3">
                      <InlineLoading />
                      <p className="text-xs text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground">
                        {leftImage.label}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ═══ RIGHT PANEL: Articulation console ═══ */}
              <div className="flex flex-col">
                {/* Challenge metadata */}
                <div className="flex items-center gap-3 rounded-t-xl border-b border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">
                    {challenge.categories?.[0] || "General"}
                  </span>
                  <span className="text-border">|</span>
                  <span>Limit: {challenge.character_limit}</span>
                  <span className="text-border">|</span>
                  <span>Cost: {CREDITS_PER_GENERATION} cr</span>
                </div>

                {/* Score display */}
                {flowState === "results" && result && (
                  <div className="border-b border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          Score
                        </p>
                        <div className="text-3xl font-bold text-foreground">
                          <ScoreCounter target={result.score} />
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        <p>Credits spent: {result.creditsSpent}</p>
                        <p>Remaining: {result.remainingBalance}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-[1500ms] ease-out"
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error display */}
                {error && (
                  <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-3">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                {/* Textarea */}
                <div className="flex flex-1 flex-col bg-card">
                  <textarea
                    id="articulation-input"
                    value={articulationText}
                    onChange={(e) => setArticulationText(e.target.value)}
                    disabled={isLoading}
                    maxLength={challenge.character_limit}
                    placeholder="Describe the reference image with precision..."
                    className="flex-1 resize-none border-0 bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
                    style={{ minHeight: "200px" }}
                    aria-describedby="typing-stats"
                  />

                  {/* Character limit bar */}
                  <div className="mx-4 h-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${charBarColor}`}
                      style={{ width: `${charPercent}%` }}
                    />
                  </div>

                  {/* Stats bar */}
                  <div
                    id="typing-stats"
                    className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground"
                  >
                    <div className="flex gap-4">
                      <span>
                        {charCount}/{challenge.character_limit} chars
                      </span>
                      <span>{wordCount} words</span>
                      <span>{wpm} wpm</span>
                    </div>
                    <span
                      className={
                        articulationText.trim().length >= 10
                          ? "text-terminal-green"
                          : charCount > 0
                          ? "text-primary"
                          : ""
                      }
                    >
                      {charCount === 0
                        ? "Idle"
                        : articulationText.trim().length >= 10
                        ? "Ready"
                        : "Composing"}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="rounded-b-xl border-t border-border bg-card p-4">
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading
                      ? "Generating..."
                      : `Submit (${CREDITS_PER_GENERATION} credits)`}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {flowState === "input" && !challenge && !error && (
          <div className="card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Loading challenge...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
