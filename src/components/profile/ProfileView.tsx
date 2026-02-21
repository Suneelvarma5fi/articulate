"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ScoreChart } from "./ScoreChart";
import { ActivityHeatmap } from "./ActivityHeatmap";

const PAGE_SIZE = 20;

interface KPIs {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalCreditsSpent: number;
  challengesAttempted: number;
  creditBalance: number;
}

interface ScoreTrendPoint {
  date: string;
  avgScore: number;
}

interface HeatmapDay {
  date: string;
  attemptCount: number;
  bestScore: number | null;
}

interface RecentAttempt {
  id: string;
  score: number;
  credits_spent: number;
  created_at: string;
  articulation_text: string;
  generated_image_url: string;
  challenge_id: string;
  challenge_title: string;
  challenge_categories: string[];
  challenge_date: string;
  challenge_reference_url: string;
}

interface UserProfile {
  displayName: string | null;
  bio: string | null;
  interests: string[];
  isPublic: boolean;
}

interface ProfileData {
  kpis: KPIs;
  scoreTrend: ScoreTrendPoint[];
  categoryBreakdown: Array<{
    category: string;
    attempts: number;
    avgScore: number;
  }>;
  recentAttempts: RecentAttempt[];
  heatmapData: HeatmapDay[];
  categories: string[];
  activeFilter: string | null;
  profile: UserProfile;
}

export function ProfileView() {
  const { user } = useUser();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bio editor state
  const [editingBio, setEditingBio] = useState(false);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftIsPublic, setDraftIsPublic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchProfile = useCallback(async (category?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const res = await fetch(`/api/user/profile?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        // Initialize draft values from profile
        if (data.profile) {
          setDraftDisplayName(data.profile.displayName || "");
          setDraftBio(data.profile.bio || "");
          setDraftIsPublic(data.profile.isPublic || false);
        }
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile(selectedCategory);
    setPage(1);
  }, [selectedCategory, fetchProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingImage(true);
    try {
      await user.setProfileImage({ file });
    } catch (err) {
      console.error("Failed to upload profile image:", err);
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draftDisplayName || null,
          bio: draftBio || null,
          isPublic: draftIsPublic,
        }),
      });
      if (res.ok) {
        setEditingBio(false);
        fetchProfile(selectedCategory);
      }
    } catch {
      // silently fail
    }
    setSavingProfile(false);
  };

  const handleCopyShareLink = () => {
    if (!user) return;
    const url = `${window.location.origin}/profile/${user.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const kpis = profileData?.kpis;
  const allAttempts = profileData?.recentAttempts ?? [];
  const totalPages = Math.max(1, Math.ceil(allAttempts.length / PAGE_SIZE));
  const paginatedAttempts = allAttempts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <Header creditBalance={kpis?.creditBalance ?? null} />

        {/* Top: Profile (left) + Stats grid (right) */}
        <div className="mb-6 mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
          {/* User card — independent height */}
          <div className="card flex flex-col items-center p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="group relative mb-3 h-16 w-16 overflow-hidden rounded-full"
              title="Change profile photo"
            >
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-lg font-bold text-muted-foreground">
                  {(user?.firstName?.[0] || user?.username?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingImage ? (
                  <span className="text-[10px] text-white">...</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 11.5V14h2.5L12.06 6.44 9.56 3.94 2 11.5z" />
                    <path d="M9.56 3.94l2.5 2.5" />
                  </svg>
                )}
              </div>
            </button>
            <p className="text-center text-sm font-medium text-foreground">
              {profileData?.profile?.displayName || user?.firstName || user?.username || "User"}
            </p>
            {profileData?.profile?.bio && (
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                {profileData.profile.bio}
              </p>
            )}
            <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Since{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "--"}
            </p>

            {/* Profile actions */}
            <div className="mt-3 flex w-full flex-col gap-1.5">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditingBio(!editingBio)}
                  className="btn-ghost flex-1 py-1.5"
                  title={editingBio ? "Cancel editing" : "Edit Profile"}
                >
                  {editingBio ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  )}
                </button>
                {profileData?.profile?.isPublic && (
                  <button
                    onClick={handleCopyShareLink}
                    className="btn-ghost flex-1 py-1.5"
                    title={copiedLink ? "Copied!" : "Share Profile"}
                  >
                    {copiedLink ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-primary"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    )}
                  </button>
                )}
              </div>
              <Link
                href="/submit"
                className="btn-secondary w-full py-1.5 text-center text-[9px]"
              >
                Submit Challenge
              </Link>
            </div>
          </div>

          {/* Right: Performance + Trend (top row) + Heatmap (bottom) */}
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* KPIs */}
              <div className="card p-5">
                <p className="mb-4 text-xs font-medium text-muted-foreground">
                  Performance
                  {selectedCategory && (
                    <span className="ml-1 text-primary">
                      / {selectedCategory}
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {kpis?.totalAttempts ?? "--"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Attempts</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {kpis?.averageScore ?? "--"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Avg Score</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-primary">
                      {kpis?.bestScore ?? "--"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Best Score</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {kpis?.challengesAttempted ?? "--"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Challenges</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {kpis?.totalCreditsSpent ?? "--"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Credits Spent</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-primary">
                      {kpis?.creditBalance ?? "--"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Balance</p>
                  </div>
                </div>
              </div>

              {/* Score trend graph */}
              <div className="card p-5">
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  Your Trend
                </p>
                <div className="h-32">
                  <ScoreChart data={profileData?.scoreTrend ?? []} />
                </div>
              </div>
            </div>

            {/* Activity heatmap */}
            <div className="card overflow-x-auto p-5">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Activity
              </p>
              <ActivityHeatmap data={profileData?.heatmapData ?? []} />
            </div>
          </div>
        </div>

        {/* Bio editor panel */}
        {editingBio && (
          <div className="card mb-6 p-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Edit Profile
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-muted-foreground">
                  Display Name
                </label>
                <input
                  type="text"
                  value={draftDisplayName}
                  onChange={(e) => setDraftDisplayName(e.target.value)}
                  maxLength={50}
                  placeholder="Your display name"
                  className="input-clean py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-muted-foreground">
                  Bio <span className="text-muted-foreground/50">({draftBio.length}/200)</span>
                </label>
                <textarea
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="A short bio about yourself..."
                  className="input-clean py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draftIsPublic}
                  onChange={(e) => setDraftIsPublic(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                Public profile (visible to anyone with the link)
              </label>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="btn-primary px-6 py-1.5 text-xs"
              >
                {savingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Category filter bar */}
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${
              !selectedCategory
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            All
          </button>
          {(profileData?.categories ?? []).map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${
                selectedCategory === cat
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Attempt history */}
        <div className="card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Attempt History
              {allAttempts.length > 0 && ` — ${allAttempts.length} records`}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : !allAttempts.length ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No attempts found</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Complete a challenge to see your history here.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/50">
                {paginatedAttempts.map((attempt) => {
                  const isExpanded = expandedAttempt === attempt.id;
                  return (
                    <div key={attempt.id}>
                      <button
                        onClick={() =>
                          setExpandedAttempt(isExpanded ? null : attempt.id)
                        }
                        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary/20"
                      >
                        {/* Thumbnails */}
                        <div className="flex gap-1.5">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={attempt.challenge_reference_url}
                              alt="Ref"
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={attempt.generated_image_url}
                              alt="Gen"
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">
                            {attempt.challenge_title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {attempt.challenge_date} &middot;{" "}
                            {attempt.challenge_categories[0] || "General"}
                          </p>
                        </div>

                        {/* Score */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`font-mono text-lg font-bold ${
                              attempt.score >= 80
                                ? "text-success"
                                : attempt.score >= 50
                                ? "text-primary"
                                : "text-foreground"
                            }`}
                          >
                            {attempt.score}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            /100
                          </span>
                        </div>

                        {/* Expand indicator */}
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {isExpanded ? "\u2212" : "+"}
                        </span>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-border/50 bg-secondary/10 px-4 py-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                                Reference
                              </p>
                              <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg">
                                <Image
                                  src={attempt.challenge_reference_url}
                                  alt="Reference"
                                  fill
                                  className="object-cover"
                                  sizes="300px"
                                />
                              </div>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                                Generated
                              </p>
                              <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg">
                                <Image
                                  src={attempt.generated_image_url}
                                  alt="Generated"
                                  fill
                                  className="object-cover"
                                  sizes="300px"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                              Articulation
                            </p>
                            <p className="rounded-lg bg-input p-3 text-sm italic text-foreground">
                              &ldquo;{attempt.articulation_text}&rdquo;
                            </p>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Score: {attempt.score}/100</span>
                            <span>Credits: {attempt.credits_spent}</span>
                            <Link
                              href={`/challenge/${attempt.challenge_id}`}
                              className="text-primary transition-colors hover:text-primary/80"
                            >
                              Try again
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
