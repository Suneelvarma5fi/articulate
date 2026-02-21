"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { CATEGORIES } from "@/types/database";

export default function SubmitChallengePage() {
  const [title, setTitle] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [characterLimit, setCharacterLimit] = useState(150);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title || !referenceImageUrl || !selectedCategory) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          referenceImageUrl,
          categories: [selectedCategory],
          characterLimit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen p-4">
        <div className="mx-auto max-w-2xl">
          <Header creditBalance={null} />
          <div className="border border-success p-8 text-center">
            <p className="mb-2 text-sm font-bold text-success">
              SUBMISSION RECEIVED
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Your challenge is under review.
            </p>
            <a href="/dashboard" className="btn-terminal-primary inline-block">
              BACK TO DASHBOARD
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        <Header creditBalance={null} />

        <div className="mb-6 text-center">
          <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
            ═══════════════════════════════════════════════
          </div>
          <h1 className="my-2 text-lg font-bold tracking-wide text-foreground">
            SUBMIT A CHALLENGE
          </h1>
          <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
            ═══════════════════════════════════════════════
          </div>
        </div>

        <p className="mb-6 text-center text-xs text-muted-foreground">
          Help improve the platform by suggesting challenges.
        </p>

        {error && (
          <div className="mb-4 border border-destructive p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs tracking-wide text-muted-foreground">
              TITLE:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Challenge title..."
              className="input-terminal"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs tracking-wide text-muted-foreground">
              REFERENCE IMAGE URL:
            </label>
            <input
              type="url"
              value={referenceImageUrl}
              onChange={(e) => setReferenceImageUrl(e.target.value)}
              placeholder="https://..."
              className="input-terminal"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs tracking-wide text-muted-foreground">
              CATEGORY:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`border px-3 py-2 text-left text-xs transition-all ${
                    selectedCategory === cat
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {selectedCategory === cat ? "(•)" : "( )"} {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs tracking-wide text-muted-foreground">
              SUGGESTED CHARACTER LIMIT:
            </label>
            <input
              type="number"
              value={characterLimit}
              onChange={(e) =>
                setCharacterLimit(parseInt(e.target.value, 10) || 150)
              }
              min={50}
              max={500}
              className="input-terminal w-32"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-terminal-primary w-full"
          >
            {loading ? "SUBMITTING..." : "[ S U B M I T ]"}
          </button>
        </div>
      </div>
    </main>
  );
}
