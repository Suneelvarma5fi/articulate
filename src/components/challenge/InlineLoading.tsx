"use client";

import { useEffect, useState } from "react";

const WORD = "ARTICULATE";

export function InlineLoading() {
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

  const maxRow = WORD.length;
  const rows: { letter: string; count: number }[] = [];
  for (let i = 0; i < maxRow; i++) {
    rows.push({ letter: WORD[i], count: maxRow - i });
  }
  for (let i = maxRow - 2; i >= 0; i--) {
    rows.push({ letter: WORD[maxRow - 1 - i], count: maxRow - i });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <p className="mb-4 text-xs tracking-terminal text-muted-foreground">
        GENERATING...
      </p>

      <div className="mb-4 font-mono leading-tight">
        {rows.map((row, rowIdx) => {
          const isActive =
            frame % rows.length === rowIdx ||
            (frame + 1) % rows.length === rowIdx;
          return (
            <div key={rowIdx} className="flex justify-center">
              {Array.from({ length: row.count }).map((_, colIdx) => (
                <span
                  key={colIdx}
                  className={`inline-block w-4 text-center text-xs transition-all duration-150 ${
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

      <p className="font-mono text-xs text-muted-foreground/50">
        {elapsed}s
      </p>
    </div>
  );
}
