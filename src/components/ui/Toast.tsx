"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onDismiss: () => void;
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const borderColor = {
    success: "border-success",
    error: "border-destructive",
    info: "border-primary",
  }[type];

  const textColor = {
    success: "text-success",
    error: "text-destructive",
    info: "text-primary",
  }[type];

  const icon = {
    success: "\u2713",
    error: "\u2717",
    info: "\u25B6",
  }[type];

  return (
    <div
      className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <div className={`border ${borderColor} bg-background px-6 py-3`}>
        <span className={`font-mono text-sm ${textColor}`}>
          {icon} {message}
        </span>
      </div>
    </div>
  );
}
