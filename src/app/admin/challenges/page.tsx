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
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 border border-border px-4 py-2">
          <span className="text-sm tracking-terminal text-white">
            ADMIN PANEL
          </span>
        </div>

        <nav className="mb-6 flex gap-1 border-b border-border pb-4">
          <span className="border-b-2 border-primary px-4 py-2 text-xs tracking-wide text-white">
            UPLOAD CHALLENGE
          </span>
          <a
            href="/admin/submissions"
            className="px-4 py-2 text-xs tracking-wide text-muted-foreground hover:text-foreground"
          >
            REVIEW SUBMISSIONS
          </a>
        </nav>

        <div className="mb-6 text-center">
          <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
            ═══════════════════════════════════════════════
          </div>
          <h1 className="my-2 text-lg font-bold tracking-wide text-white">
            CREATE NEW CHALLENGE
          </h1>
          <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
            ═══════════════════════════════════════════════
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 border p-3 text-center text-sm ${
              message.type === "success"
                ? "border-success text-success"
                : "border-destructive text-destructive"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
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

          {/* Reference Image File */}
          <div>
            <label className="mb-1 block text-xs tracking-wide text-muted-foreground">
              REFERENCE IMAGE:
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border border-dashed border-border p-6 text-center transition-colors hover:border-primary"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mx-auto mb-2 max-h-48 object-contain"
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
            <label className="mb-2 block text-xs tracking-wide text-muted-foreground">
              CATEGORIES:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`border px-3 py-2 text-left text-xs transition-all ${
                    selectedCategories.includes(cat)
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {selectedCategories.includes(cat) ? "[x]" : "[ ]"} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Character Limit */}
          <div>
            <label className="mb-1 block text-xs tracking-wide text-muted-foreground">
              CHARACTER LIMIT:
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

          {/* Active Date */}
          <div>
            <label className="mb-1 block text-xs tracking-wide text-muted-foreground">
              ACTIVE DATE:
            </label>
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="input-terminal w-48"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-terminal-primary w-full"
          >
            {loading ? "CREATING..." : "[ C R E A T E ]"}
          </button>
        </div>

        {/* Existing Challenges */}
        {challenges.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 text-center">
              <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
                ═══════════════════════════════════════════════
              </div>
              <h2 className="my-2 text-lg font-bold tracking-wide text-white">
                EXISTING CHALLENGES
              </h2>
              <div className="overflow-hidden text-xs tracking-terminal text-muted-foreground">
                ═══════════════════════════════════════════════
              </div>
            </div>

            <div className="space-y-2">
              {challenges.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border border-border px-4 py-3"
                >
                  <div>
                    <span className="text-sm text-white">{c.title}</span>
                    <span className="ml-3 text-xs text-muted-foreground">
                      {c.active_date}
                    </span>
                    <span
                      className={`ml-2 text-xs ${
                        c.status === "active"
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      [{c.status.toUpperCase()}]
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-xs text-destructive hover:text-red-400"
                  >
                    {deleting === c.id ? "..." : "[ DELETE ]"}
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
