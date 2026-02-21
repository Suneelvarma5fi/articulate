"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CREDIT_PACKAGES } from "@/types/database";

interface PurchaseModalProps {
  onClose: () => void;
  currentBalance: number;
  creditsNeeded: number;
}

export function PurchaseModal({
  onClose,
  currentBalance,
  creditsNeeded,
}: PurchaseModalProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && loading === null) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    // Focus the modal on mount
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  const handlePurchase = async (packageIndex: number) => {
    setLoading(packageIndex);

    try {
      const res = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIndex, returnPath: pathname }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Purchase credits"
    >
      <div className="terminal-box w-full max-w-md p-6" ref={modalRef} tabIndex={-1}>
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-bold tracking-wide text-foreground">
            INSUFFICIENT CREDITS
          </p>
          <p className="text-xs text-muted-foreground">
            You need {creditsNeeded} credits to generate.
          </p>
          <p className="text-xs text-muted-foreground">
            Your balance: {currentBalance} credits
          </p>
        </div>

        <p className="mb-4 text-center text-sm tracking-wide text-muted-foreground">
          PURCHASE CREDITS
        </p>

        <div className="space-y-3">
          {CREDIT_PACKAGES.map((pkg, index) => (
            <div key={index} className="terminal-box p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {pkg.label}
                </span>
                <div className="flex items-center gap-2">
                  {"badge" in pkg && pkg.badge && (
                    <span className="border border-primary px-2 py-0.5 text-xs text-primary">
                      {pkg.badge}
                    </span>
                  )}
                  <span className="text-sm text-foreground">{pkg.priceLabel}</span>
                </div>
              </div>
              <div className="mb-3 text-xs text-muted-foreground">
                {pkg.credits} credits ({pkg.credits / 5} generations)
              </div>
              <button
                onClick={() => handlePurchase(index)}
                disabled={loading !== null}
                className="btn-terminal-primary w-full py-2 text-xs"
              >
                {loading === index ? "REDIRECTING..." : "[ SELECT ]"}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          disabled={loading !== null}
          className="btn-terminal-secondary mt-4 w-full py-2 text-xs"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
