"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";

const ADMIN_NAV = [
  { label: "UPLOAD CHALLENGE", href: "/admin/challenges" },
  { label: "REVIEW SUBMISSIONS", href: "/admin/submissions" },
  { label: "INVITE CODES", href: "/admin/invite-codes" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <Header creditBalance={null} />

      {/* Admin sub-nav */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center gap-1 px-6 sm:px-10">
          <span className="mr-4 text-[11px] font-medium tracking-[0.15em] text-primary">
            ADMIN
          </span>
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-4 py-3 text-[11px] tracking-[0.15em] transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
