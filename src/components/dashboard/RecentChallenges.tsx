"use client";

import Image from "next/image";
import Link from "next/link";

interface RecentChallenge {
  id: string;
  title: string;
  reference_image_url: string;
  active_date: string;
  challenge_number: number;
  user_best_score: number | null;
  user_attempted: boolean;
}

interface RecentChallengesProps {
  challenges: RecentChallenge[];
}

export function RecentChallenges({ challenges }: RecentChallengesProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {challenges.map((challenge) => {
        const isToday = challenge.active_date === today;
        return (
          <Link
            key={challenge.id}
            href={`/challenge/${challenge.id}`}
            className={`group relative block h-44 overflow-hidden rounded-xl shadow-sm transition-all duration-200 ${
              isToday
                ? "ring-2 ring-primary/40"
                : "ring-1 ring-border hover:ring-primary/25"
            }`}
          >
            {/* Full-bleed image */}
            <Image
              src={challenge.reference_image_url}
              alt={challenge.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, 200px"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

            {/* Today badge */}
            {isToday && (
              <div className="absolute left-2.5 top-2.5">
                <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] tracking-[0.15em] text-white">
                  TODAY
                </span>
              </div>
            )}

            {/* Score badge */}
            {challenge.user_attempted && (
              <div className="absolute right-2.5 top-2.5">
                <span className="rounded-md bg-black/50 px-2 py-0.5 font-mono text-xs font-bold text-white backdrop-blur-sm">
                  {challenge.user_best_score}
                </span>
              </div>
            )}

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-white">
                    {challenge.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/50">
                    {isToday ? "Today" : new Date(challenge.active_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-white/40">
                  #{String(challenge.challenge_number).padStart(3, "0")}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
