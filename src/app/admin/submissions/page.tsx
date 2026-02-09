"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChallengeSubmission } from "@/types/database";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/submissions")
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (
    id: string,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setActionLoading(id);

    try {
      const res = await fetch(`/api/admin/submissions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? data.submission : s))
        );
        setRejectingId(null);
        setRejectionReason("");
      }
    } catch {
      // silently fail
    }

    setActionLoading(null);
  };

  const statusColor = {
    pending: "text-primary",
    approved: "text-success",
    rejected: "text-destructive",
  };

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 border border-border px-4 py-2">
          <span className="text-sm tracking-terminal text-white">
            ADMIN PANEL
          </span>
        </div>

        <nav className="mb-6 flex gap-1 border-b border-border pb-4">
          <a
            href="/admin/challenges"
            className="px-4 py-2 text-xs tracking-wide text-muted-foreground hover:text-foreground"
          >
            UPLOAD CHALLENGE
          </a>
          <span className="border-b-2 border-primary px-4 py-2 text-xs tracking-wide text-white">
            REVIEW SUBMISSIONS
          </span>
        </nav>

        <div className="mb-6 text-center">
          <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
            ═══════════════════════════════════════════════
          </div>
          <h1 className="my-2 text-lg font-bold tracking-wide text-white">
            CHALLENGE SUBMISSIONS
          </h1>
          <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
            ═══════════════════════════════════════════════
          </div>
        </div>

        {loading && (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Loading<span className="cursor-blink text-primary">_</span>
            </span>
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div className="terminal-box p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No submissions to review.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="terminal-box p-4">
              <div className="mb-3 flex items-start gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-border">
                  <Image
                    src={sub.reference_image_url}
                    alt={sub.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{sub.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Categories: {sub.categories.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Limit: {sub.character_limit} chars
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted:{" "}
                    {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                  <p className={`text-xs font-bold ${statusColor[sub.status]}`}>
                    {sub.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {sub.status === "pending" && (
                <div className="flex gap-2">
                  {rejectingId === sub.id ? (
                    <div className="flex w-full flex-col gap-2">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="input-terminal text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleReview(sub.id, "reject", rejectionReason)
                          }
                          disabled={actionLoading === sub.id}
                          className="btn-terminal-primary flex-1 py-2 text-xs !border-destructive !text-destructive"
                        >
                          CONFIRM REJECT
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                          className="btn-terminal-secondary flex-1 py-2 text-xs"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReview(sub.id, "approve")}
                        disabled={actionLoading === sub.id}
                        className="btn-terminal-primary flex-1 py-2 text-xs"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => setRejectingId(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="btn-terminal-secondary flex-1 py-2 text-xs"
                      >
                        REJECT
                      </button>
                    </>
                  )}
                </div>
              )}

              {sub.status === "rejected" && sub.rejection_reason && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reason: {sub.rejection_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
