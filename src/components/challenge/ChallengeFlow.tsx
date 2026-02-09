"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Challenge, QualityLevel, QUALITY_CREDITS, QUALITY_LABELS } from "@/types/database";
import { Header } from "@/components/layout/Header";
import { MatrixRain } from "@/components/animations/MatrixRain";
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

export function ChallengeFlow() {
  const searchParams = useSearchParams();
  const [flowState, setFlowState] = useState<FlowState>("input");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [articulationText, setArticulationText] = useState("");
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>(2);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const isLoading = flowState === "loading";
  const isActive = flowState === "input" || flowState === "loading" || flowState === "results";

  // Pre-fill articulation text from URL param (history "USE" button)
  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) {
      setArticulationText(prefill);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    try {
      const [challengeRes, creditsRes] = await Promise.all([
        fetch("/api/challenges/today"),
        fetch("/api/credits/balance"),
      ]);

      if (challengeRes.ok) {
        const data = await challengeRes.json();
        setChallenge(data.challenge);
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle post-purchase redirect
  useEffect(() => {
    if (searchParams.get("purchase") === "success") {
      const sessionId = searchParams.get("session_id");

      const verifyAndRefresh = async () => {
        if (sessionId) {
          await fetch("/api/stripe/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
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
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!challenge) return;

    const trimmed = articulationText.trim();
    if (trimmed.length < 10) {
      setError("Articulation must be at least 10 characters");
      return;
    }

    const creditsNeeded = QUALITY_CREDITS[qualityLevel];
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
          qualityLevel,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setShowPurchaseModal(true);
        setFlowState("input");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult({
        score: data.score,
        generatedImageUrl: data.generatedImageUrl,
        creditsSpent: data.creditsSpent,
        remainingBalance: data.remainingBalance,
      });
      setCreditBalance(data.remainingBalance);
      setFlowState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setFlowState("input");
    }
  };

  const canGenerate =
    articulationText.trim().length >= 10 && challenge !== null && !isLoading;

  return (
    <>
      <MatrixRain />

      <main className="relative z-10 min-h-screen p-4">
        <div className="mx-auto max-w-5xl">
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
              creditsNeeded={QUALITY_CREDITS[qualityLevel]}
            />
          )}

          {flowState === "no-challenge" && (
            <div className="terminal-box p-8 text-center">
              <p className="mb-2 text-sm tracking-wide text-muted-foreground">
                NO ACTIVE CHALLENGE
              </p>
              <p className="text-xs text-muted-foreground">
                Check back soon for the next challenge.
              </p>
            </div>
          )}

          {flowState === "error" && (
            <div className="border border-destructive p-6 text-center">
              <p className="mb-2 text-sm font-bold tracking-wide text-destructive">
                GENERATION FAILED
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                {error || "An unexpected error occurred."}
              </p>
              <p className="mb-6 text-xs text-muted-foreground">
                Your credits have been refunded.
              </p>
              <button
                onClick={() => { setError(null); setFlowState("input"); }}
                className="btn-terminal-primary"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {/* Main challenge layout */}
          {isActive && challenge && (
            <>
              {/* Challenge header */}
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>Category: {challenge.categories?.[0] || "General"}</span>
                  <span className="text-border">|</span>
                  <span>Limit: {challenge.character_limit} chars</span>
                </div>
              </div>

              {/* Side-by-side images */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Reference image */}
                <div>
                  <p className="mb-2 text-center text-xs tracking-wide text-muted-foreground">
                    REFERENCE
                  </p>
                  <div className="terminal-box relative aspect-square w-full overflow-hidden">
                    <Image
                      src={challenge.reference_image_url}
                      alt={`Reference: ${challenge.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>

                {/* Generated image / loading / placeholder */}
                <div>
                  <p className="mb-2 text-center text-xs tracking-wide text-muted-foreground">
                    GENERATED
                  </p>
                  <div className="terminal-box relative aspect-square w-full overflow-hidden">
                    {isLoading ? (
                      <InlineLoading />
                    ) : result?.generatedImageUrl ? (
                      <Image
                        src={result.generatedImageUrl}
                        alt="Generated image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4">
                        <p className="text-center text-xs leading-relaxed text-muted-foreground">
                          Your generated image will
                          <br />
                          appear here after you submit.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results: score bar */}
              {flowState === "results" && result && (
                <div className="mb-6">
                  <div className="terminal-box-primary mx-auto max-w-md p-5 text-center">
                    <p className="mb-1 text-xs tracking-wide text-muted-foreground">
                      S C O R E
                    </p>
                    <div className="mb-3 text-4xl font-bold text-white">
                      <ScoreCounter target={result.score} />
                    </div>
                    <div className="h-2 w-full overflow-hidden bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-[1500ms] ease-out"
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-6 font-mono text-xs text-muted-foreground">
                    <span>CREDITS SPENT: {result.creditsSpent}</span>
                    <span>REMAINING: {result.remainingBalance}</span>
                  </div>
                </div>
              )}

              {/* Input controls — always visible, disabled when loading */}
              {error && (
                <p className="mb-4 text-center text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Textarea */}
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      id="articulation-input"
                      value={articulationText}
                      onChange={(e) => setArticulationText(e.target.value)}
                      disabled={isLoading}
                      maxLength={challenge.character_limit}
                      rows={4}
                      placeholder="Describe the image..."
                      className="input-terminal disabled:opacity-50"
                      aria-describedby="char-count"
                    />
                    <div className="mt-1 text-right" id="char-count">
                      <span
                        className={`font-mono text-xs ${
                          articulationText.length > challenge.character_limit * 0.9
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        [{String(articulationText.length).padStart(3, "0")}/{challenge.character_limit}]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls: quality dropdown + submit */}
                <div className="flex shrink-0 gap-3 sm:w-56 sm:flex-col">
                  <div className="flex-1 sm:flex-none">
                    <label
                      htmlFor="quality-select"
                      className="mb-1 block text-xs tracking-wide text-muted-foreground"
                    >
                      QUALITY:
                    </label>
                    <select
                      id="quality-select"
                      value={qualityLevel}
                      disabled={isLoading}
                      onChange={(e) =>
                        setQualityLevel(Number(e.target.value) as QualityLevel)
                      }
                      className="input-terminal w-full cursor-pointer disabled:opacity-50"
                    >
                      {([1, 2, 3] as QualityLevel[]).map((level) => (
                        <option key={level} value={level}>
                          {QUALITY_LABELS[level].name} [{QUALITY_CREDITS[level]} cr]
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="btn-terminal-primary mt-auto w-full whitespace-nowrap disabled:opacity-50 sm:mt-0"
                  >
                    {isLoading ? "GENERATING..." : "SUBMIT"}
                  </button>
                </div>
              </div>
            </>
          )}

          {flowState === "input" && !challenge && !error && (
            <div className="terminal-box p-8 text-center">
              <div className="inline-block">
                <span className="text-sm text-muted-foreground">
                  Loading challenge
                </span>
                <span className="cursor-blink text-primary">_</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
