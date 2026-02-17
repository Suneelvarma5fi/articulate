"use client";

import { useState, useMemo } from "react";

interface CalendarDay {
  completed: boolean;
  bestScore: number | null;
  challengeId: string;
}

interface ActivityCalendarProps {
  calendarData: Record<string, CalendarDay>;
  month: string;
  onMonthChange: (month: string) => void;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivityCalendar({
  calendarData,
  month,
  onMonthChange,
}: ActivityCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const [year, monthNum] = month.split("-").map(Number);
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const monthLabel = new Date(year, monthNum - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay();

    const grid: Array<{ date: string | null; day: number | null }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push({ date: null, day: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${month}-${String(d).padStart(2, "0")}`;
      grid.push({ date, day: d });
    }

    return grid;
  }, [year, monthNum, month]);

  const goBack = () => {
    const prev = monthNum === 1 ? `${year - 1}-12` : `${year}-${String(monthNum - 1).padStart(2, "0")}`;
    onMonthChange(prev);
  };

  const goForward = () => {
    const next = monthNum === 12 ? `${year + 1}-01` : `${year}-${String(monthNum + 1).padStart(2, "0")}`;
    if (next <= currentMonth) {
      onMonthChange(next);
    }
  };

  const canGoForward = (() => {
    const next = monthNum === 12 ? `${year + 1}-01` : `${year}-${String(monthNum + 1).padStart(2, "0")}`;
    return next <= currentMonth;
  })();

  return (
    <div className="rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] p-4">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-[#2a2a2a]/50 transition-colors hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]"
        >
          &lsaquo;
        </button>
        <span className="text-xs tracking-wide text-[#2a2a2a]">
          {monthLabel}
        </span>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-[#2a2a2a]/50 transition-colors hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a] disabled:opacity-20"
        >
          &rsaquo;
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] text-[#2a2a2a]/40">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="relative grid grid-cols-7 gap-1">
        {calendarGrid.map((cell, i) => {
          if (!cell.date) {
            return <div key={i} className="aspect-square" />;
          }

          const data = calendarData[cell.date];
          const isFuture = cell.date > today;
          const isToday = cell.date === today;
          const completed = data?.completed ?? false;
          const isHovered = hoveredDate === cell.date;

          return (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => setHoveredDate(cell.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div
                className={`flex aspect-square items-center justify-center rounded-md text-[11px] transition-all ${
                  isFuture
                    ? "text-[#2a2a2a]/15"
                    : completed
                    ? "bg-[#2a2a2a]/10 font-medium text-[#2a2a2a]"
                    : "text-[#2a2a2a]/50"
                } ${isToday ? "ring-1 ring-[#2a2a2a]/40" : ""}`}
              >
                {cell.day}
              </div>

              {/* Tooltip */}
              {isHovered && data && !isFuture && (
                <div className="absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#2a2a2a]/15 bg-[#E0E0D5] px-2.5 py-1 shadow-lg">
                  <span className="text-[10px] text-[#2a2a2a]">
                    {completed
                      ? `Best: ${data.bestScore}`
                      : "Not attempted"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
