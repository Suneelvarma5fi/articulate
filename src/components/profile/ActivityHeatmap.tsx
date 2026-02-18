"use client";

import { useMemo, useState } from "react";

interface HeatmapDay {
  date: string;
  attemptCount: number;
  bestScore: number | null;
}

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-secondary";
  if (count === 1) return "bg-primary/20";
  if (count === 2) return "bg-primary/40";
  if (count <= 4) return "bg-primary/60";
  return "bg-primary";
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const dataMap = new Map<string, HeatmapDay>();
    for (const d of data) {
      dataMap.set(d.date, d);
    }

    // Build 52 weeks ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks: Array<Array<HeatmapDay & { dayOfWeek: number; isToday: boolean }>> = [];
    const monthLabels: Array<{ label: string; weekIndex: number }> = [];
    let currentWeek: Array<HeatmapDay & { dayOfWeek: number; isToday: boolean }> = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    let weekIndex = 0;

    while (cursor <= today || currentWeek.length > 0) {
      if (cursor > today && currentWeek.length < 7) {
        // Pad the final week
        break;
      }

      const dateStr = cursor.toISOString().split("T")[0];
      const existing = dataMap.get(dateStr);
      const isToday = dateStr === today.toISOString().split("T")[0];

      currentWeek.push({
        date: dateStr,
        attemptCount: existing?.attemptCount ?? 0,
        bestScore: existing?.bestScore ?? null,
        dayOfWeek: cursor.getDay(),
        isToday,
      });

      // Track month labels
      if (cursor.getMonth() !== lastMonth) {
        lastMonth = cursor.getMonth();
        monthLabels.push({
          label: cursor.toLocaleDateString("en-US", { month: "short" }),
          weekIndex,
        });
      }

      cursor.setDate(cursor.getDate() + 1);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [data]);

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="mb-1 flex pl-8">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[9px] text-muted-foreground"
            style={{
              position: "absolute",
              left: `${32 + m.weekIndex * 13}px`,
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-[11px] w-6 items-center justify-end text-[8px] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-[11px] w-[11px] rounded-[2px] transition-colors ${getIntensityClass(day.attemptCount)} ${
                  day.isToday ? "ring-1 ring-primary/50" : ""
                }`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const label = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const scoreText = day.bestScore !== null ? `, best: ${day.bestScore}` : "";
                  setTooltip({
                    text: `${label}: ${day.attemptCount} attempt${day.attemptCount !== 1 ? "s" : ""}${scoreText}`,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded border border-border bg-card px-2 py-1 shadow-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="whitespace-nowrap font-mono text-[9px] text-foreground">
            {tooltip.text}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground">
        <span>Less</span>
        <div className="h-[9px] w-[9px] rounded-[2px] bg-secondary" />
        <div className="h-[9px] w-[9px] rounded-[2px] bg-primary/20" />
        <div className="h-[9px] w-[9px] rounded-[2px] bg-primary/40" />
        <div className="h-[9px] w-[9px] rounded-[2px] bg-primary/60" />
        <div className="h-[9px] w-[9px] rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
