"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

/* ── Reveal: shared scroll-triggered entrance ─────────────────────────────── */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      // Start animating ~200px before the element scrolls into view, so by the
      // time it's visible it is already easing in instead of popping.
      viewport={{ once: true, margin: "0px 0px 200px 0px" }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section heading with the court-baseline signature ────────────────────── */
export function SectionHead({
  eyebrow,
  title,
  right,
  dark = true,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
  dark?: boolean;
}) {
  return (
    <Reveal>
      <div className={`baseline mb-10 sm:mb-14 ${dark ? "text-chalk" : "text-ink"}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-cq-bright mb-3 flex items-center gap-2.5">
              <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
              {eyebrow}
            </p>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
          </div>
          {right && <div className="pb-1">{right}</div>}
        </div>
      </div>
    </Reveal>
  );
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
const base =
  "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wide text-sm px-6 py-3.5 transition-all duration-200 select-none active:translate-y-0";

export function BtnPrimary({
  href,
  children,
  onClick,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `${base} bg-cq text-chalk hover:bg-cq-bright hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(226,32,40,0.55)] ${className}`;
  return href ? (
    <Link href={href} className={cls}>{children}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{children}</button>
  );
}

export function BtnGhost({
  href,
  children,
  onClick,
  dark = true,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  onClick?: () => void;
  dark?: boolean;
  className?: string;
}) {
  const tone = dark
    ? "border-chalk/25 text-chalk hover:border-chalk hover:bg-chalk/5"
    : "border-ink/25 text-ink hover:border-ink hover:bg-ink/5";
  const cls = `${base} border ${tone} hover:-translate-y-0.5 ${className}`;
  return href ? (
    <Link href={href} className={cls}>{children}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{children}</button>
  );
}

/* ── Live indicator dot ───────────────────────────────────────────────────── */
export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-2 w-2 ${className}`} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cq-bright opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-cq-bright" />
    </span>
  );
}

/* ── Status pill used across match views ──────────────────────────────────── */
export function StatusPill({ status }: { status: "upcoming" | "ongoing" | "completed" }) {
  if (status === "ongoing")
    return (
      <span className="eyebrow inline-flex items-center gap-2 text-cq-bright">
        <LiveDot /> Live
      </span>
    );
  if (status === "completed")
    return <span className="eyebrow text-chalk-dim">Final</span>;
  return <span className="eyebrow text-chalk-dim/70">Up next</span>;
}
