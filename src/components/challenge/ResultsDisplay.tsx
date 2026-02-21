"use client";

import Image from "next/image";
import { ScoreCounter } from "@/components/animations/ScoreCounter";

interface ResultsDisplayProps {
  score: number;
  referenceImageUrl: string;
  generatedImageUrl: string;
  articulationText: string;
  creditsSpent: number;
  remainingBalance: number;
  onTryAgain: () => void;
}

export function ResultsDisplay({
  score,
  referenceImageUrl,
  generatedImageUrl,
  articulationText,
  creditsSpent,
  remainingBalance,
  onTryAgain,
}: ResultsDisplayProps) {
  return (
    <div className="score-reveal">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
          ═══════════════════════════════════════════════
        </div>
        <p className="my-2 text-sm tracking-wide text-muted-foreground">
          CHALLENGE COMPLETE
        </p>
        <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
          ═══════════════════════════════════════════════
        </div>
      </div>

      {/* Score box */}
      <div className="terminal-box-primary mx-auto mb-8 max-w-sm p-6 text-center">
        <p className="mb-1 text-xs tracking-wide text-muted-foreground">
          S C O R E
        </p>
        <div className="mb-4 text-5xl font-bold text-foreground">
          <ScoreCounter target={score} />
        </div>
        <div className="h-2 w-full overflow-hidden bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-[1500ms] ease-out"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="mb-6">
        <p className="mb-3 text-xs tracking-wide text-muted-foreground">
          COMPARISON:
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-center text-xs tracking-wide text-muted-foreground">
              REFERENCE
            </p>
            <div className="terminal-box relative aspect-square w-full overflow-hidden">
              <Image
                src={referenceImageUrl}
                alt="Reference image"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-center text-xs tracking-wide text-muted-foreground">
              GENERATED
            </p>
            <div className="terminal-box relative aspect-square w-full overflow-hidden">
              <Image
                src={generatedImageUrl}
                alt="Generated image"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Articulation text */}
      <div className="mb-6">
        <p className="mb-2 text-xs tracking-wide text-muted-foreground">
          YOUR ARTICULATION:
        </p>
        <div className="terminal-box p-4">
          <p className="text-sm italic text-foreground">
            &ldquo;{articulationText}&rdquo;
          </p>
        </div>
      </div>

      {/* Credits info */}
      <div className="mb-6 flex gap-6 font-mono text-xs text-muted-foreground">
        <span>CREDITS SPENT: {creditsSpent}</span>
        <span>REMAINING: {remainingBalance}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onTryAgain} className="btn-terminal-primary flex-1">
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}
