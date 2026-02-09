"use client";

import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";

interface LetterScrambleProps {
  text: string;
  className?: string;
  duration?: number;
}

export function LetterScramble({
  text,
  className = "",
  duration = 500,
}: LetterScrambleProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const steps = 10;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;

      const result = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i / text.length < progress) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplay(result);

      if (step >= steps) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [text, duration]);

  return <span className={className}>{display}</span>;
}
