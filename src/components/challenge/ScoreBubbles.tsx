"use client";

import { ScoreBreakdown } from "@/types/database";

interface ScoreBubblesProps {
  total: number;
  breakdown: ScoreBreakdown | null;
}

const METRICS: { key: keyof ScoreBreakdown; label: string; max: number }[] = [
  { key: "subject", label: "Subject", max: 35 },
  { key: "composition", label: "Comp", max: 25 },
  { key: "color", label: "Color", max: 20 },
  { key: "detail", label: "Detail", max: 20 },
];

function getScoreColor(pct: number): string {
  if (pct >= 80) return "text-green-400 stroke-green-400";
  if (pct >= 50) return "text-primary stroke-primary";
  return "text-muted-foreground stroke-muted-foreground";
}

function getTrackColor(pct: number): string {
  if (pct >= 80) return "stroke-green-400/15";
  if (pct >= 50) return "stroke-primary/15";
  return "stroke-border";
}

function ScoreRing({
  value,
  max,
  label,
  size = 52,
  strokeWidth = 3,
}: {
  value: number;
  max: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}) {
  const pct = Math.round((value / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const colorClass = getScoreColor(pct);
  const trackClass = getTrackColor(pct);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={trackClass}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${colorClass} transition-all duration-700`}
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-[11px] font-bold ${colorClass.split(" ")[0]}`}>
            {pct}
          </span>
        </div>
      </div>
      <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function ScoreBubbles({ total, breakdown }: ScoreBubblesProps) {
  const totalPct = Math.round(total);
  const totalColorClass = getScoreColor(total);
  const totalTrackClass = getTrackColor(total);
  const totalSize = 72;
  const totalStroke = 4;
  const totalRadius = (totalSize - totalStroke) / 2;
  const totalCircumference = 2 * Math.PI * totalRadius;
  const totalOffset = totalCircumference - (totalPct / 100) * totalCircumference;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Center ring — total score */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="relative" style={{ width: totalSize, height: totalSize }}>
          <svg width={totalSize} height={totalSize} className="-rotate-90">
            <circle
              cx={totalSize / 2}
              cy={totalSize / 2}
              r={totalRadius}
              fill="none"
              strokeWidth={totalStroke}
              className={totalTrackClass}
            />
            <circle
              cx={totalSize / 2}
              cy={totalSize / 2}
              r={totalRadius}
              fill="none"
              strokeWidth={totalStroke}
              strokeLinecap="round"
              strokeDasharray={totalCircumference}
              strokeDashoffset={totalOffset}
              className={`${totalColorClass} transition-all duration-700`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-mono text-xl font-bold ${totalColorClass.split(" ")[0]}`}>
              {total}
            </span>
          </div>
        </div>
      </div>

      {/* Metric rings */}
      {breakdown &&
        METRICS.map((m) => (
          <ScoreRing
            key={m.key}
            value={breakdown[m.key]}
            max={m.max}
            label={m.label}
          />
        ))}
    </div>
  );
}
