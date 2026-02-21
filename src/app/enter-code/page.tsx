"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function EnterCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();

  // Pre-fill from cookie (set by /invite/[code] route)
  useEffect(() => {
    const match = document.cookie.match(/invite_code=([^;]+)/);
    if (match) {
      setCode(decodeURIComponent(match[1]));
      // Clear the cookie
      document.cookie = "invite_code=; path=/; max-age=0";
    }
  }, []);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-handjet text-3xl font-bold tracking-wide text-foreground">
            ARTICULATE_
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your invite code to continue
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {user && (
            <p className="mb-4 text-center text-xs text-muted-foreground">
              Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}
            </p>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
              INVITE CODE
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="XXXXXXXX"
              maxLength={12}
              className="input-clean text-center text-lg font-mono tracking-[0.3em]"
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="btn-primary w-full py-3"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Don&apos;t have a code? We&apos;re in early access.
            <br />
            Check back soon or ask a friend for one.
          </p>
        </div>
      </div>
    </main>
  );
}
