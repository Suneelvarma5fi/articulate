"use client";

import Image from "next/image";
import { Challenge } from "@/types/database";
import { LetterScramble } from "@/components/animations/LetterScramble";

interface ChallengeDisplayProps {
  challenge: Challenge;
}

export function ChallengeDisplay({ challenge }: ChallengeDisplayProps) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
          ═══════════════════════════════════════════════
        </div>
        <h2 className="my-2 text-lg font-bold tracking-wide text-white">
          <LetterScramble text="DAILY CHALLENGE" />
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Category: {challenge.categories?.[0] || "General"}</span>
          <span className="text-border">|</span>
          <span>Limit: {challenge.character_limit} chars</span>
        </div>
        <div className="mt-2 overflow-hidden text-xs tracking-terminal text-muted-foreground">
          ═══════════════════════════════════════════════
        </div>
      </div>

      <div className="terminal-box relative mx-auto mb-6 aspect-square w-full max-w-md overflow-hidden">
        <Image
          src={challenge.reference_image_url}
          alt={`Reference image: ${challenge.title}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 448px"
          priority
        />
      </div>
    </div>
  );
}
