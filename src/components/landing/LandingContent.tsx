"use client";

import Link from "next/link";

export function LandingContent() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="terminal-box w-full max-w-2xl p-8 text-center sm:p-12">
          <h1 className="mb-2 text-2xl font-bold tracking-terminal text-white sm:text-3xl md:text-4xl">
            A R T I C U L A T E
          </h1>
          <h2 className="mb-8 text-lg tracking-terminal text-white sm:text-xl md:text-2xl">
            E V E R Y T H I N G
          </h2>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="btn-terminal-primary w-full text-center sm:w-auto"
            >
              S I G N &nbsp; U P
            </Link>
            <Link
              href="/sign-in"
              className="btn-terminal-secondary w-full text-center sm:w-auto"
            >
              L O G &nbsp; I N
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
