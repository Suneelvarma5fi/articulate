"use client";

import { useMemo } from "react";

interface ScoreChartProps {
  data: Array<{ date: string; avgScore: number }>;
}

export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    // Show last 30 data points max
    const slice = data.slice(-30);
    const maxScore = 100;
    return slice.map((d) => ({
      ...d,
      height: (d.avgScore / maxScore) * 100,
      label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-[10px] text-muted-foreground">
          NO DATA // COMPLETE A CHALLENGE
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Y-axis labels + chart area */}
      <div className="flex flex-1 gap-2">
        {/* Y-axis */}
        <div className="flex flex-col justify-between py-1 font-mono text-[9px] text-muted-foreground">
          <span>100</span>
          <span>050</span>
          <span>000</span>
        </div>

        {/* Bars */}
        <div className="flex flex-1 items-end gap-px">
          {chartData.map((d, i) => (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ minWidth: 0 }}
            >
              {/* Tooltip */}
              <div className="absolute -top-8 z-10 hidden whitespace-nowrap border border-border bg-background px-2 py-1 group-hover:block">
                <span className="font-mono text-[9px] text-foreground">
                  {d.label}: {String(d.avgScore).padStart(3, "0")}
                </span>
              </div>

              {/* Bar */}
              <div
                className={`w-full transition-all ${
                  d.avgScore >= 80
                    ? "bg-terminal-green/60"
                    : d.avgScore >= 50
                    ? "bg-primary/60"
                    : "bg-muted-foreground/30"
                }`}
                style={{ height: `${d.height}%`, minHeight: "2px" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* X-axis: show first, middle, last labels */}
      <div className="mt-1 flex justify-between px-6 font-mono text-[8px] text-muted-foreground">
        <span>{chartData[0]?.label}</span>
        {chartData.length > 2 && (
          <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
        )}
        {chartData.length > 1 && (
          <span>{chartData[chartData.length - 1]?.label}</span>
        )}
      </div>
    </div>
  );
}
