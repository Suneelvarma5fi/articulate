"use client";

interface ArticulationInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  disabled?: boolean;
}

export function ArticulationInput({
  value,
  onChange,
  maxLength,
  disabled = false,
}: ArticulationInputProps) {
  const charCount = value.length;
  const isOverLimit = charCount > maxLength;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <div className="mb-6">
      <label
        htmlFor="articulation-input"
        className="mb-2 block text-sm tracking-wide text-muted-foreground"
      >
        ARTICULATE YOUR VISION:
      </label>
      <div className="relative">
        <textarea
          id="articulation-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          rows={4}
          placeholder="Describe the image..."
          className="input-terminal"
          aria-describedby="char-count"
        />
        <div className="mt-1 text-right" id="char-count">
          <span
            className={`font-mono text-xs ${
              isOverLimit
                ? "text-destructive"
                : isNearLimit
                  ? "text-primary"
                  : "text-muted-foreground"
            }`}
            role="status"
            aria-live="polite"
            aria-label={`${charCount} of ${maxLength} characters used`}
          >
            [{String(charCount).padStart(3, "0")}/{maxLength}]
          </span>
        </div>
      </div>
    </div>
  );
}
