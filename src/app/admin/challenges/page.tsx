"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CATEGORIES } from "@/types/database";

export default function AdminChallengesPage() {
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [characterLimit, setCharacterLimit] = useState(300);
  const [activeDate, setActiveDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [challenges, setChallenges] = useState<
    { id: string; title: string; active_date: string; status: string }[]
  >([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchChallenges = useCallback(async () => {
    const res = await fetch("/api/admin/challenges");
    if (res.ok) {
      const data = await res.json();
      setChallenges(data.challenges || []);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this challenge?")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
        setMessage({ text: "Challenge deleted", type: "success" });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "Failed to delete", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to delete challenge", type: "error" });
    }
    setDeleting(null);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Please select an image file", type: "error" });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!title || !imageFile || !selectedCategories.length || !activeDate) {
      setMessage({ text: "All fields are required", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("image", imageFile);
      formData.append("categories", JSON.stringify(selectedCategories));
      formData.append("characterLimit", String(characterLimit));
      formData.append("activeDate", activeDate);

      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create challenge");
      }

      setMessage({ text: "Challenge created successfully", type: "success" });
      setTitle("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedCategories([]);
      setCharacterLimit(150);
      setActiveDate("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchChallenges();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to create challenge",
        type: "error",
      });
    }

    setLoading(false);
  };

  return (
    <main className="px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-lg font-semibold tracking-wide text-foreground">
          Create New Challenge
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

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Challenge title..."
                className="input-clean"
              />
            </div>

            {/* Reference Image File */}
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                REFERENCE IMAGE
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-lg border border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto mb-3 max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click to select an image file
                  </p>
                )}
                {imageFile && (
                  <p className="text-xs text-muted-foreground">
                    {imageFile.name}
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                CATEGORIES
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
                      selectedCategories.includes(cat)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Character Limit */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                  CHARACTER LIMIT
                </label>
                <input
                  type="number"
                  value={characterLimit}
                  onChange={(e) =>
                    setCharacterLimit(parseInt(e.target.value, 10) || 150)
                  }
                  min={50}
                  max={500}
                  className="input-clean w-32"
                />
              </div>

              {/* Active Date */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground">
                  ACTIVE DATE
                </label>
                <input
                  type="date"
                  value={activeDate}
                  onChange={(e) => setActiveDate(e.target.value)}
                  className="input-clean w-48"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Creating..." : "Create Challenge"}
            </button>
          </div>
        </div>

        {/* Existing Challenges */}
        {challenges.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-foreground">
              Existing Challenges ({challenges.length})
            </h2>

            <div className="space-y-2">
              {challenges.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.active_date}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        c.status === "active"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-xs text-destructive transition-colors hover:text-red-400"
                  >
                    {deleting === c.id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
