"use client";

interface StreakCounterProps {
  streak: number;
  averageScore: number;
}

export function StreakCounter({ streak, averageScore }: StreakCounterProps) {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="text-center font-mono text-3xl font-bold text-primary">
          {streak}
        </p>
        <p className="mt-0.5 text-center font-handjet text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Day Streak
        </p>
      </div>
      <div className="h-px w-8 bg-border" />
      <div>
        <p className="text-center font-mono text-3xl font-bold text-foreground">
          {averageScore}
        </p>
        <p className="mt-0.5 text-center font-handjet text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Avg Score
        </p>
      </div>
    </div>
  );
}
