"use client";

import { useEffect, useState } from "react";

interface ScoreCounterProps {
  target: number;
  duration?: number;
  className?: string;
}

const GLITCH_CHARS = "ABCDE";

export function ScoreCounter({
  target,
  duration = 1500,
  className = "",
}: ScoreCounterProps) {
  const [display, setDisplay] = useState("---");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const current = Math.round(target * progress);

      // Show glitch characters during counting
      if (step < steps) {
        const glitch = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        setDisplay(`${glitch}${String(current).padStart(2, "0")}`);
      } else {
        setDisplay(String(target).padStart(3, "0"));
        setDone(true);
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [target, duration]);

  return (
    <span className={`${className} ${done ? "" : "opacity-90"}`}>
      {display}
    </span>
  );
}
