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

  const statusStyles: Record<string, string> = {
    pending: "bg-primary/10 text-primary",
    approved: "bg-green-500/10 text-green-600 dark:text-green-400",
    rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <main className="px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-lg font-semibold tracking-wide text-foreground">
          Review Submissions
        </h1>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              No submissions to review.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={sub.reference_image_url}
                    alt={sub.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{sub.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Categories: {sub.categories.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Limit: {sub.character_limit} chars
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted:{" "}
                    {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                  <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[sub.status] || ""}`}>
                    {sub.status.toUpperCase()}
                  </span>
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
                        className="input-clean text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleReview(sub.id, "reject", rejectionReason)
                          }
                          disabled={actionLoading === sub.id}
                          className="btn-secondary flex-1 py-2 text-xs text-destructive"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                          className="btn-secondary flex-1 py-2 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReview(sub.id, "approve")}
                        disabled={actionLoading === sub.id}
                        className="btn-primary flex-1 py-2 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="btn-secondary flex-1 py-2 text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}

              {sub.status === "rejected" && sub.rejection_reason && (
                <p className="mt-3 text-xs text-muted-foreground">
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
