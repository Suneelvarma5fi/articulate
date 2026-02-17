"use client";

interface StreakCounterProps {
  streak: number;
  averageScore: number;
}

export function StreakCounter({ streak, averageScore }: StreakCounterProps) {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] p-4">
      <div>
        <p className="text-center text-3xl tracking-wide text-[#2a2a2a]">
          {streak}
        </p>
        <p className="mt-0.5 text-center text-[10px] tracking-[0.15em] text-[#2a2a2a]/45">
          DAY STREAK
        </p>
      </div>
      <div className="h-px w-8 bg-[#2a2a2a]/10" />
      <div>
        <p className="text-center text-3xl tracking-wide text-[#2a2a2a]">
          {averageScore}
        </p>
        <p className="mt-0.5 text-center text-[10px] tracking-[0.15em] text-[#2a2a2a]/45">
          AVG SCORE
        </p>
      </div>
    </div>
  );
}
