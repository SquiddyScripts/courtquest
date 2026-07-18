"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UserRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/lib/usePlayer";
import { LiveDot } from "@/components/ui";
import logo from "@/photos/logo.png";

const LINKS = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/about", label: "About" },
  { href: "/join", label: "Get Involved" },
];

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-3" aria-label="CourtQuest home">
      <Image src={logo} alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" priority />
      <span className="leading-none">
        <span className="display-wide block text-[15px] text-chalk">
          Court<span className="text-cq-bright">Quest</span>
        </span>
        <span className="eyebrow mt-0.5 block text-[9px] text-chalk-dim/70">Est. 2025</span>
      </span>
    </Link>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [liveSlug, setLiveSlug] = useState<string | null>(null);
  const { player } = usePlayer();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Surface a LIVE link whenever a tournament is running.
  useEffect(() => {
    supabase
      .from("tournaments")
      .select("slug")
      .eq("status", "live")
      .eq("hidden", false)
      .limit(1)
      .then(({ data }) => setLiveSlug(data?.[0]?.slug ?? null));
  }, [pathname]);

  useEffect(() => {
    queueMicrotask(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-court/85 backdrop-blur-md border-b border-line"
            : // Before any scroll: a soft top scrim so links stay readable over
              // bright areas of the hero photo.
              "bg-gradient-to-b from-court/90 via-court/55 to-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
          <Wordmark />

          <div className="hidden items-center gap-8 md:flex">
            {liveSlug && (
              <Link
                href={`/tournaments/${liveSlug}`}
                className="eyebrow flex items-center gap-2 text-cq-bright hover:text-chalk transition-colors"
              >
                <LiveDot /> Live now
              </Link>
            )}
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                  pathname.startsWith(l.href) ? "text-chalk" : "text-chalk-dim hover:text-chalk"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/donate"
              className="bg-cq px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-chalk transition-all hover:bg-cq-bright hover:-translate-y-0.5"
            >
              Donate
            </Link>
            {/* Player presence: initials circle when signed in, quiet icon when not */}
            {player ? (
              <Link
                href="/me"
                aria-label={`${player.name} — your dashboard`}
                title={`${player.name} — your dashboard`}
                className="tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-cq bg-cq/15 font-mono text-sm font-bold text-chalk transition-all hover:bg-cq hover:-translate-y-0.5"
              >
                {initialsOf(player.name)}
              </Link>
            ) : (
              <Link
                href="/me"
                aria-label="Player sign in"
                title="Player sign in"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-chalk-dim transition-all hover:border-chalk/50 hover:text-chalk"
              >
                <UserRound className="h-[18px] w-[18px]" />
              </Link>
            )}
          </div>

          {/* Mobile: player circle sits next to the hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {player && (
              <Link
                href="/me"
                aria-label={`${player.name} — your dashboard`}
                className="tnum flex h-9 w-9 items-center justify-center rounded-full border-2 border-cq bg-cq/15 font-mono text-xs font-bold text-chalk"
              >
                {initialsOf(player.name)}
              </Link>
            )}
            <button
              className="relative z-[60] flex h-11 w-11 flex-col items-center justify-center gap-[5px]"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className={`h-[2px] w-6 bg-chalk transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`h-[2px] w-6 bg-chalk transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`h-[2px] w-6 bg-chalk transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu — rendered as a sibling of the header (NOT a child), so it
          isn't trapped inside the header's backdrop-filter containing block.
          A fully opaque background means zero bleed-through from the page. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // Tapping empty space anywhere on the sheet closes it. Links and the
            // close button still work (navigation/close either way).
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] flex flex-col bg-court md:hidden"
          >
            {/* menu's own top bar, matching the header height */}
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <Wordmark onClick={() => setOpen(false)} />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center text-chalk transition-colors hover:text-cq-bright"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-1 px-6">
              {liveSlug && (
                <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                  <Link
                    href={`/tournaments/${liveSlug}`}
                    className="display flex items-center gap-4 py-3 text-4xl text-cq-bright"
                  >
                    <LiveDot /> Live now
                  </Link>
                </motion.div>
              )}
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ x: -24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                >
                  <Link href={l.href} className="display block py-3 text-4xl text-chalk hover:text-cq-bright">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                <Link href="/donate" className="display block py-3 text-4xl text-cq-bright">
                  Donate
                </Link>
              </motion.div>
              <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <Link href="/me" className="mt-4 flex items-center gap-3 border-t border-line py-5">
                  {player ? (
                    <>
                      <span className="tnum flex h-9 w-9 items-center justify-center rounded-full border-2 border-cq bg-cq/15 font-mono text-xs font-bold text-chalk">
                        {initialsOf(player.name)}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-wider text-chalk">
                        My dashboard
                      </span>
                    </>
                  ) : (
                    <>
                      <UserRound className="h-5 w-5 text-chalk-dim" aria-hidden />
                      <span className="text-sm font-bold uppercase tracking-wider text-chalk-dim">
                        Player sign in
                      </span>
                    </>
                  )}
                </Link>
              </motion.div>
            </div>
            <p className="eyebrow px-6 pb-10 text-chalk-dim">501(c)(3) nonprofit · Northern Virginia</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
