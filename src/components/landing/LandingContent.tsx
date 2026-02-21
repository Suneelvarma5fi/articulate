"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CREDIT_PACKAGES, CATEGORIES } from "@/types/database";

export function LandingContent() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen font-handjet text-[#2a2a2a]"
      style={{
        backgroundColor: "#DDDDD1",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      {/* ─── Nav ─── */}
      <nav
        className={`fixed top-0 z-50 w-full px-6 transition-all duration-300 sm:px-10 ${
          scrolled
            ? "bg-[#DDDDD1] py-4 shadow-sm"
            : "py-6 sm:py-8"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span
            className={`text-2xl tracking-wider transition-colors duration-300 ${
              scrolled ? "text-[#2a2a2a]" : "text-white"
            }`}
          >
            ARTICULATE_
          </span>
          <div className="flex items-center gap-8">
            <a
              href="#how-it-works"
              className={`hidden text-xs tracking-[0.2em] transition-colors sm:inline ${
                scrolled
                  ? "text-[#2a2a2a]/80 hover:text-[#2a2a2a]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              HOW IT WORKS
            </a>
            <a
              href="#pricing"
              className={`hidden text-xs tracking-[0.2em] transition-colors sm:inline ${
                scrolled
                  ? "text-[#2a2a2a]/80 hover:text-[#2a2a2a]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              PRICING
            </a>
            <Link
              href="/sign-in"
              className={`rounded-full border px-6 py-2.5 text-xs tracking-[0.15em] transition-all ${
                scrolled
                  ? "border-[#2a2a2a]/50 text-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-[#DDDDD1]"
                  : "border-white/30 text-white hover:bg-white hover:text-black"
              }`}
            >
              LOGIN
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero: Video only, no overlay text ─── */}
      <section>
        <div className="relative h-[90vh] overflow-hidden rounded-b-3xl">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover object-center"
          >
            <source src="/hero-video-bright.mp4" type="video/mp4" />
          </video>
          {/* Film grain */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay">
            <svg width="100%" height="100%">
              <filter id="grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>
          </div>
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] tracking-[0.3em] text-white/70">SCROLL</span>
              <div className="h-8 w-px bg-gradient-to-b from-white/70 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quote ─── */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:px-10 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <blockquote className="text-3xl leading-snug tracking-wide sm:text-4xl md:text-5xl">
              &ldquo;Be Articulate. That&rsquo;s the most dangerous thing you
              can possibly be.&rdquo;
            </blockquote>
            <p className="mt-8 text-xs tracking-[0.3em] text-[#2a2a2a]/40">
              JORDAN PETERSON
            </p>
          </div>
        </div>
      </section>

      {/* ─── How It Works — 3-step visual ─── */}
      <section id="how-it-works">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="text-center">
            <span className="inline-block rounded-md bg-[#2a2a2a] px-4 py-1.5 text-xs tracking-[0.3em] text-[#DDDDD1]">
              HOW IT WORKS
            </span>
            <h2 className="mt-5 text-4xl tracking-wide sm:text-5xl md:text-6xl">
              Measure how articulate you are.
            </h2>
          </div>

          {/* 3-step cards with visual mockups */}
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            {/* Step 1: See */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#2a2a2a]/10 bg-[#2a2a2a]/[0.03] p-8 transition-all hover:border-[#2a2a2a]/20 hover:bg-[#2a2a2a]/[0.05] sm:p-10">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]/[0.08] text-lg">
                  01
                </span>
                <div className="h-px flex-1 bg-[#2a2a2a]/10" />
              </div>
              {/* Visual mockup: image frame */}
              <div className="mb-6 aspect-[4/3] overflow-hidden rounded-xl border border-[#2a2a2a]/20 bg-[#2a2a2a]/[0.06]">
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="flex gap-1">
                    <div className="h-8 w-8 rounded bg-[#2a2a2a]/25" />
                    <div className="h-8 w-12 rounded bg-[#2a2a2a]/20" />
                    <div className="h-8 w-6 rounded bg-[#2a2a2a]/15" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-6 w-10 rounded bg-[#2a2a2a]/15" />
                    <div className="h-6 w-8 rounded bg-[#2a2a2a]/25" />
                  </div>
                  <svg className="mt-2 h-6 w-6 text-[#2a2a2a]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl tracking-wide">Pick a challenge</h3>
              <p className="mt-3 text-base leading-relaxed tracking-wide text-[#2a2a2a]/55">
                A new challenge drops every day. Study it closely, every color, shape, and detail matters.
              </p>
            </div>

            {/* Step 2: Articulate */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#2a2a2a]/10 bg-[#2a2a2a]/[0.03] p-8 transition-all hover:border-[#2a2a2a]/20 hover:bg-[#2a2a2a]/[0.05] sm:p-10">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]/[0.08] text-lg">
                  02
                </span>
                <div className="h-px flex-1 bg-[#2a2a2a]/10" />
              </div>
              {/* Visual mockup: text input */}
              <div className="mb-6 aspect-[4/3] overflow-hidden rounded-xl border border-[#2a2a2a]/20 bg-[#2a2a2a]/[0.06] p-5">
                <div className="space-y-2">
                  <div className="h-2.5 w-full rounded bg-[#2a2a2a]/25" />
                  <div className="h-2.5 w-[85%] rounded bg-[#2a2a2a]/20" />
                  <div className="h-2.5 w-[92%] rounded bg-[#2a2a2a]/15" />
                  <div className="h-2.5 w-[70%] rounded bg-[#2a2a2a]/25" />
                  <div className="h-2.5 w-[60%] rounded bg-[#2a2a2a]/20" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] tracking-wider text-[#2a2a2a]/45">247 / 300 chars</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#2a2a2a]/15">
                    <div className="h-full w-[82%] rounded-full bg-[#2a2a2a]/35" />
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#2a2a2a]/15 py-2 text-center text-[11px] tracking-wider text-[#2a2a2a]/50">
                  GENERATE
                </div>
              </div>
              <h3 className="text-3xl tracking-wide">Articulate</h3>
              <p className="mt-3 text-base leading-relaxed tracking-wide text-[#2a2a2a]/55">
                Write your best interpretation. Be precise, be vivid. Every word shapes what the AI creates.
              </p>
            </div>

            {/* Step 3: Measure */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#2a2a2a]/10 bg-[#2a2a2a]/[0.03] p-8 transition-all hover:border-[#2a2a2a]/20 hover:bg-[#2a2a2a]/[0.05] sm:p-10">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]/[0.08] text-lg">
                  03
                </span>
                <div className="h-px flex-1 bg-[#2a2a2a]/10" />
              </div>
              {/* Visual mockup: score display */}
              <div className="mb-6 aspect-[4/3] overflow-hidden rounded-xl border border-[#2a2a2a]/20 bg-[#2a2a2a]/[0.06]">
                <div className="flex h-full flex-col items-center justify-center">
                  <span className="text-[10px] tracking-[0.3em] text-[#2a2a2a]/45">S C O R E</span>
                  <span className="mt-2 text-6xl font-bold tracking-tight text-[#2a2a2a]/80">87</span>
                  <div className="mt-3 h-1.5 w-28 overflow-hidden rounded-full bg-[#2a2a2a]/15">
                    <div className="h-full w-[87%] rounded-full bg-[#2a2a2a]/40" />
                  </div>
                  <div className="mt-4 flex gap-6 text-[10px] tracking-wider text-[#2a2a2a]/45">
                    <span>Subject 31</span>
                    <span>Color 17</span>
                    <span>Detail 18</span>
                  </div>
                </div>
              </div>
              <h3 className="text-3xl tracking-wide">Measure</h3>
              <p className="mt-3 text-base leading-relaxed tracking-wide text-[#2a2a2a]/55">
                AI generates an image from your words and scores the match from 0 to 100. Can you hit a perfect score?
              </p>
            </div>
          </div>

          {/* Connector line below steps */}
          <div className="mx-auto mt-12 hidden max-w-xs sm:block">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-[#2a2a2a]/10" />
              <span className="text-xs tracking-[0.2em] text-[#2a2a2a]/25">REPEAT DAILY</span>
              <div className="h-px flex-1 bg-[#2a2a2a]/10" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Articulate ─── */}
      <section id="about">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-20">
            <div>
              <span className="inline-block rounded-md bg-[#2a2a2a] px-4 py-1.5 text-xs tracking-[0.3em] text-[#DDDDD1]">
                WHY ARTICULATE
              </span>
              <h2 className="mt-5 text-3xl leading-tight tracking-wide sm:text-4xl md:text-5xl">
                Writing is thinking.
              </h2>
            </div>
            <div className="space-y-6 text-base leading-relaxed tracking-wide text-[#2a2a2a]/65 sm:text-lg">
              <p>
                Those who can think well can speak
                well. Those who can speak well can present their thoughts to the
                world with confidence and without any prior preparation.
              </p>
              <p>
                That kind of attitude opens a lot of doors.
              </p>
              <p>
                We want to instill this skill into everyone, very early in their
                life, so they can have more opportunities. So they can spend more
                time expressing themselves rather than thinking how.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── For Professionals (Categories) ─── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="mb-12">
            <span className="inline-block rounded-md bg-[#2a2a2a] px-4 py-1.5 text-xs tracking-[0.3em] text-[#DDDDD1]">
              FOR PROFESSIONALS
            </span>
            <h2 className="mt-5 text-3xl tracking-wide sm:text-4xl md:text-5xl">
              Track your progress
              <br />
              across interest areas.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-[#2a2a2a]/15 px-5 py-2 text-sm tracking-wide text-[#2a2a2a]/55 transition-colors hover:border-[#2a2a2a]/30 hover:text-[#2a2a2a]/80"
              >
                {cat}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-[#2a2a2a]/15 px-5 py-2 text-sm tracking-wide text-[#2a2a2a]/35">
              and many more
            </span>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="mb-20 text-center">
            <span className="inline-block rounded-md bg-[#2a2a2a] px-4 py-1.5 text-xs tracking-[0.3em] text-[#DDDDD1]">
              PRICING
            </span>
            <h2 className="mt-5 text-3xl tracking-wide sm:text-4xl md:text-5xl">
              Simple credits. No subscriptions.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base tracking-wide text-[#2a2a2a]/55 sm:text-lg">
              Every 5 credits is one attempt to describe, generate, and score.
              Start with 25 free credits, no card needed.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg, i) => {
              const isHighlighted = i === 1;
              const benefits = [
                {
                  headline: "Starter",
                  attempts: 20,
                  desc: "Perfect for trying it out. 20 attempts to sharpen your eye.",
                  saving: null,
                },
                {
                  headline: "Standard",
                  attempts: 60,
                  desc: "For daily players. Enough attempts to build a real streak.",
                  saving: "Save 33%",
                },
                {
                  headline: "Pro",
                  attempts: 150,
                  desc: "Best value for serious players. Practice without limits.",
                  saving: "Save 47%",
                },
              ][i];
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl border p-8 transition-colors sm:p-10 ${
                    isHighlighted
                      ? "border-[#2a2a2a]/25 bg-[#2a2a2a]/[0.06]"
                      : "border-[#2a2a2a]/15 hover:border-[#2a2a2a]/25"
                  }`}
                >
                  {benefits.saving && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#2a2a2a]/10 px-3 py-1.5 text-[11px] tracking-[0.15em] text-[#2a2a2a]/60">
                      {benefits.saving}
                    </span>
                  )}
                  <p className="text-xs tracking-[0.2em] text-[#2a2a2a]/40">
                    {benefits.headline.toUpperCase()}
                  </p>
                  <p className="mt-4 text-5xl tracking-wide">
                    {pkg.priceLabel}
                  </p>
                  <p className="mt-3 text-base tracking-wide text-[#2a2a2a]/65">
                    {benefits.attempts} attempts
                  </p>
                  <p className="mt-5 text-sm leading-relaxed tracking-wide text-[#2a2a2a]/45">
                    {benefits.desc}
                  </p>
                  <Link
                    href="/sign-up"
                    className={`mt-8 block w-full rounded-full py-3.5 text-center text-xs tracking-[0.15em] transition-all ${
                      isHighlighted
                        ? "bg-[#2a2a2a] text-[#DDDDD1] hover:bg-[#2a2a2a]/90"
                        : "border border-[#2a2a2a]/20 text-[#2a2a2a]/60 hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]"
                    }`}
                  >
                    GET STARTED
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:px-10 sm:py-28">
          <h2 className="text-4xl tracking-wide sm:text-5xl md:text-6xl">
            Ready to see how
            <br />
            articulate you are?
          </h2>
          <Link
            href="/sign-up"
            className="mt-12 inline-block rounded-full bg-[#2a2a2a] px-12 py-4 text-base tracking-wider text-[#DDDDD1] transition-all hover:bg-[#2a2a2a]/90"
          >
            Start for free
          </Link>
          <p className="mt-5 text-sm tracking-wide text-[#2a2a2a]/40">
            25 free credits. No card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#2a2a2a]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
          <span className="text-sm tracking-wider text-[#2a2a2a]/40">
            &copy; {new Date().getFullYear()} ARTICULATE
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-xs tracking-wide text-[#2a2a2a]/40 transition-colors hover:text-[#2a2a2a]/70"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs tracking-wide text-[#2a2a2a]/40 transition-colors hover:text-[#2a2a2a]/70"
            >
              Privacy
            </Link>
            <Link
              href="/refund"
              className="text-xs tracking-wide text-[#2a2a2a]/40 transition-colors hover:text-[#2a2a2a]/70"
            >
              Refunds
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
