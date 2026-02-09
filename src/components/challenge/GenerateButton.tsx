"use client";

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export function GenerateButton({
  onClick,
  disabled,
  loading,
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="btn-terminal-primary w-full"
    >
      {loading ? "G E N E R A T I N G . . ." : "[ G E N E R A T E ]"}
    </button>
  );
}
