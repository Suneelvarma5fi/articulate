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
      {/* ─── Nav (scroll-aware) ─── */}
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
              href="#about"
              className={`hidden text-xs tracking-[0.2em] transition-colors sm:inline ${
                scrolled
                  ? "text-[#2a2a2a]/80 hover:text-[#2a2a2a]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              ABOUT
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

      {/* ─── Hero ─── */}
      <section>
        <div className="relative h-[90vh] overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem]">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.png"
            className="h-full w-full object-cover object-center"
          >
            <source src="/hero-video-bright.mp4" type="video/mp4" />
          </video>
          {/* Subtle gradient for nav readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          {/* Film grain overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay">
            <svg width="100%" height="100%">
              <filter id="grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section id="about">
        <div className="mx-auto max-w-6xl px-6 py-28 sm:px-10 sm:py-36">
          {/* Jordan Peterson Quote — the emotional hook */}
          <div className="mx-auto max-w-4xl text-center">
            <blockquote className="text-4xl leading-snug tracking-wide sm:text-5xl md:text-6xl lg:text-7xl">
              &ldquo;Be Articulate. That&rsquo;s the most dangerous thing you
              can possibly be.&rdquo;
            </blockquote>
            <p className="mt-10 text-xs tracking-[0.3em] text-[#2a2a2a]/40">
              &mdash; JORDAN PETERSON
            </p>
          </div>

          {/* What is Articulate — two column */}
          <div className="mt-32 grid gap-12 sm:grid-cols-2 sm:gap-20">
            <div>
              <p className="text-xs tracking-[0.3em] text-[#2a2a2a]/40">
                WHAT IS ARTICULATE
              </p>
              <h2 className="mt-5 text-3xl leading-tight tracking-wide sm:text-4xl md:text-5xl">
                Turn what you see
                <br />
                into what you say.
              </h2>
            </div>
            <div className="space-y-6 text-base leading-relaxed tracking-wide text-[#2a2a2a]/65 sm:text-lg">
              <p>
                Every day, a new image appears. Your challenge is simple:
                describe it so well that an AI can recreate it from your words
                alone.
              </p>
              <p>
                The closer the AI&rsquo;s image matches the original, the higher
                you score. It&rsquo;s that simple &mdash; and that addictive.
              </p>
              <p>
                Whether you&rsquo;re a writer finding sharper words, a designer
                learning to communicate vision, or just someone who loves a good
                daily challenge &mdash; Articulate makes you better at the skill
                that matters most: saying exactly what you mean.
              </p>
            </div>
          </div>

          {/* How it works — 3 steps */}
          <div className="mt-32 grid gap-10 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "See",
                desc: "A new image drops every day. Study it closely \u2014 every detail counts.",
              },
              {
                num: "02",
                title: "Describe",
                desc: "Write your best description. Be precise. Be vivid. Choose every word carefully.",
              },
              {
                num: "03",
                title: "Score",
                desc: "AI generates an image from your words. See how close you got \u2014 scored 0 to 100.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="border-t border-[#2a2a2a]/15 pt-8"
              >
                <span className="text-6xl text-[#2a2a2a]/[0.08] sm:text-7xl">
                  {step.num}
                </span>
                <h3 className="mt-4 text-2xl tracking-wide sm:text-3xl">{step.title}</h3>
                <p className="mt-4 text-base leading-relaxed tracking-wide text-[#2a2a2a]/55 sm:text-lg">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="mt-32">
            <p className="mb-8 text-xs tracking-[0.3em] text-[#2a2a2a]/40">
              {CATEGORIES.length} CATEGORIES
            </p>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[#2a2a2a]/15 px-5 py-2 text-sm tracking-wide text-[#2a2a2a]/55"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-6 py-28 sm:px-10 sm:py-36">
          <div className="mb-20 text-center">
            <p className="text-xs tracking-[0.3em] text-[#2a2a2a]/40">
              PRICING
            </p>
            <h2 className="mt-5 text-3xl tracking-wide sm:text-4xl md:text-5xl">
              Simple credits. No subscriptions.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base tracking-wide text-[#2a2a2a]/55 sm:text-lg">
              Every credit is one attempt to describe, generate, and score.
              Start with 5 free credits &mdash; no card needed.
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
        <div className="mx-auto max-w-6xl px-6 py-28 text-center sm:px-10 sm:py-36">
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
            5 free credits. No card required.
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
