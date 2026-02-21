"use client";

import { useState, useEffect, useCallback } from "react";

interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminInviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [count, setCount] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    const res = await fetch("/api/admin/invite-codes");
    if (res.ok) {
      const data = await res.json();
      setCodes(data.codes || []);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, maxUses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({
        text: `Generated ${data.codes.length} invite code${data.codes.length > 1 ? "s" : ""}`,
        type: "success",
      });
      fetchCodes();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to generate",
        type: "error",
      });
    }
    setLoading(false);
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCodes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
        );
      }
    } catch {
      // silent fail
    }
  };

  const copyCode = (code: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/invite/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeCodes = codes.filter((c) => c.is_active);
  const inactiveCodes = codes.filter((c) => !c.is_active);

  return (
    <main className="px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-lg font-semibold tracking-wide text-foreground">
          Invite Codes
        </h1>

        {message && (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm ${
              message.type === "success"
                ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400"
                : "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Generate form */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Generate New Codes
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                COUNT
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 50))
                }
                min={1}
                max={50}
                className="input-clean w-24"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                MAX USES EACH
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) =>
                  setMaxUses(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 10000))
                }
                min={1}
                max={10000}
                className="input-clean w-24"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary px-6 py-2.5"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Active codes */}
        {activeCodes.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-foreground">
              Active Codes ({activeCodes.length})
            </h2>
            <div className="space-y-2">
              {activeCodes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <code className="font-mono text-sm font-bold tracking-widest text-foreground">
                      {c.code}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {c.used_count}/{c.max_uses} used
                    </span>
                    {c.used_count >= c.max_uses && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        FULL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyCode(c.code)}
                      className="text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      {copied === c.code ? "Copied!" : "Copy link"}
                    </button>
                    <button
                      onClick={() => handleDeactivate(c.id)}
                      className="text-xs text-destructive transition-colors hover:text-red-400"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive codes */}
        {inactiveCodes.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground">
              Inactive ({inactiveCodes.length})
            </h2>
            <div className="space-y-2">
              {inactiveCodes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-5 py-3.5 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <code className="font-mono text-sm tracking-widest text-muted-foreground line-through">
                      {c.code}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {c.used_count}/{c.max_uses} used
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {codes.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No invite codes yet. Generate some above.
          </p>
        )}
      </div>
    </main>
  );
}
