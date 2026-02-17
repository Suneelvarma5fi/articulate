"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  creditBalance: number | null;
}

const NAV_ITEMS = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "PROFILE", href: "/profile" },
];

export function Header({ creditBalance }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="mb-10 border-b border-[#2a2a2a]/10 pb-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-2xl tracking-wider text-[#2a2a2a]">
          ARTICULATE_
        </Link>

        {/* Right side: nav + credits + user */}
        <div className="flex items-center gap-6">
          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[11px] tracking-[0.2em] transition-colors ${
                    isActive
                      ? "text-[#2a2a2a]"
                      : "text-[#2a2a2a]/50 hover:text-[#2a2a2a]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Credits badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a]/15 px-4 py-1.5">
            <span className="text-[11px] tracking-[0.15em] text-[#2a2a2a]/50">
              CREDITS
            </span>
            <span className="text-sm tracking-wide text-[#2a2a2a]">
              {creditBalance !== null ? creditBalance : "--"}
            </span>
          </div>

          {/* Clerk user button */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="mt-4 flex items-center gap-4 sm:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[11px] tracking-[0.2em] transition-colors ${
                isActive
                  ? "text-[#2a2a2a]"
                  : "text-[#2a2a2a]/50 hover:text-[#2a2a2a]"
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
