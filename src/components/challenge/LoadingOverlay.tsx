"use client";

import { useEffect, useState } from "react";

const WORD = "ARTICULATE";

export function LoadingOverlay() {
  const [frame, setFrame] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const anim = setInterval(() => setFrame((f) => (f + 1) % 20), 150);
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(anim);
      clearInterval(timer);
    };
  }, []);

  // Build diamond cascade pattern
  const maxRow = WORD.length;
  const rows: { letter: string; count: number }[] = [];
  // Expanding
  for (let i = 0; i < maxRow; i++) {
    rows.push({ letter: WORD[i], count: maxRow - i });
  }
  // Contracting
  for (let i = maxRow - 2; i >= 0; i--) {
    rows.push({ letter: WORD[maxRow - 1 - i], count: maxRow - i });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" role="alert" aria-live="assertive" aria-label="Generating image">
      <div className="text-center">
        <p className="mb-8 text-sm tracking-terminal text-muted-foreground">
          GENERATING YOUR VISION...
        </p>

        {/* Diamond cascade */}
        <div className="mb-8 font-mono leading-tight">
          {rows.map((row, rowIdx) => {
            const isActive =
              frame % rows.length === rowIdx ||
              (frame + 1) % rows.length === rowIdx;
            return (
              <div key={rowIdx} className="flex justify-center">
                {Array.from({ length: row.count }).map((_, colIdx) => (
                  <span
                    key={colIdx}
                    className={`inline-block w-5 text-center text-sm transition-all duration-150 ${
                      isActive ? "text-primary" : "text-primary/20"
                    }`}
                  >
                    {row.letter}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          This may take 5-12 seconds
        </p>
        <p className="font-mono text-xs text-muted-foreground/50">
          {elapsed}s elapsed
        </p>
      </div>
    </div>
  );
}
