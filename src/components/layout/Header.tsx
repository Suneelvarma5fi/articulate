"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

interface HeaderProps {
  creditBalance: number | null;
}

const NAV_ITEMS = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "HISTORY", href: "/history" },
  { label: "PROFILE", href: "/profile" },
];

export function Header({ creditBalance }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-10 mb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="border border-border px-3 py-2 sm:px-4">
          <span className="text-xs tracking-terminal text-white sm:text-sm">
            ARTICULATE
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden border border-primary px-4 py-2 sm:block">
            <span className="font-mono text-sm text-primary">
              CREDITS: {creditBalance !== null ? creditBalance : "--"}
            </span>
          </div>

          {/* Mobile: credit + hamburger */}
          <span className="font-mono text-xs text-primary sm:hidden">
            {creditBalance !== null ? creditBalance : "--"}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="border border-border p-2 text-foreground sm:hidden"
            aria-label="Toggle menu"
          >
            <span className="font-mono text-sm">{mobileMenuOpen ? "\u2715" : "\u2261"}</span>
          </button>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Desktop navigation */}
      <nav className="mt-4 hidden border-t border-border pt-4 sm:block">
        <div className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-xs tracking-wide transition-all ${
                  isActive
                    ? "border-b-2 border-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <nav className="absolute left-0 right-0 top-full mt-1 border border-border bg-background sm:hidden">
          <div className="border-b border-border px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">
              CREDITS:{" "}
            </span>
            <span className="font-mono text-xs text-primary">
              {creditBalance !== null ? creditBalance : "--"}
            </span>
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-xs tracking-wide transition-all ${
                  isActive
                    ? "border-l-2 border-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
