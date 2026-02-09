"use client";

import { QualityLevel, QUALITY_CREDITS, QUALITY_LABELS } from "@/types/database";

interface QualitySelectorProps {
  value: QualityLevel;
  onChange: (value: QualityLevel) => void;
  disabled?: boolean;
}

export function QualitySelector({
  value,
  onChange,
  disabled = false,
}: QualitySelectorProps) {
  const levels: QualityLevel[] = [1, 2, 3];

  const handleKeyDown = (e: React.KeyboardEvent, level: QualityLevel) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = levels[levels.indexOf(level) + 1] || levels[0];
      onChange(next);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = levels[levels.indexOf(level) - 1] || levels[levels.length - 1];
      onChange(prev);
    }
  };

  return (
    <fieldset className="mb-6">
      <legend className="mb-3 block text-sm tracking-wide text-muted-foreground">
        SELECT QUALITY:
      </legend>
      <div className="space-y-2" role="radiogroup" aria-label="Quality level">
        {levels.map((level) => {
          const label = QUALITY_LABELS[level];
          const credits = QUALITY_CREDITS[level];
          const isSelected = value === level;

          return (
            <button
              key={level}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(level)}
              onKeyDown={(e) => handleKeyDown(e, level)}
              disabled={disabled}
              tabIndex={isSelected ? 0 : -1}
              className={`flex w-full items-center gap-3 border px-4 py-2 text-left text-sm font-mono transition-all disabled:opacity-50 ${
                isSelected
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xs" aria-hidden="true">
                {isSelected ? "(•)" : "( )"}
              </span>
              <span aria-hidden="true">{label.icon}</span>
              <span className="tracking-wide">{label.name}</span>
              <span className="ml-auto text-xs">
                [{credits} credit{credits !== 1 ? "s" : ""}]
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
