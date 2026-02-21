"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";

interface HeaderProps {
  creditBalance: number | null;
}

const NAV_ITEMS = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "PROFILE", href: "/profile" },
];

export function Header({ creditBalance }: HeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "border-b border-transparent bg-background shadow-sm"
          : "border-b border-border bg-background"
      }`}
    >
      <div className="mx-auto flex items-center justify-between px-6 py-4 sm:px-10">
        {/* Logo — Handjet brand anchor */}
        <Link
          href="/dashboard"
          className="font-handjet text-2xl tracking-wider text-foreground"
        >
          ARTICULATE_
        </Link>

        {/* Right side: nav + credits + theme + user */}
        <div className="flex items-center gap-5">
          {/* Desktop nav — Geist Sans, small, muted */}
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[11px] tracking-[0.2em] transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Credits badge — pill shape, red number */}
          <div className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5">
            <span className="text-[11px] tracking-[0.15em] text-muted-foreground">
              CREDITS
            </span>
            <span className="font-mono text-sm font-semibold text-primary">
              {creditBalance !== null ? creditBalance : "--"}
            </span>
          </div>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          )}

          {/* Clerk user button */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-4 px-6 pb-3 sm:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[11px] tracking-[0.2em] transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
