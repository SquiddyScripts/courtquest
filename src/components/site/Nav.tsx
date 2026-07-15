"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { LiveDot } from "@/components/ui";
import logo from "@/photos/logo.png";

const LINKS = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/about", label: "About" },
  { href: "/join", label: "Get Involved" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [liveSlug, setLiveSlug] = useState<string | null>(null);
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
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-court/85 backdrop-blur-md border-b border-line"
          : // Before any scroll: a soft top scrim so links stay readable over
            // bright areas of the hero photo.
            "bg-gradient-to-b from-court/90 via-court/55 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="CourtQuest home">
          <Image src={logo} alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" priority />
          <span className="display-wide text-[15px] text-chalk">
            Court<span className="text-cq-bright">Quest</span>
          </span>
        </Link>

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
        </div>

        {/* Mobile trigger */}
        <button
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className={`h-[2px] w-6 bg-chalk transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-6 bg-chalk transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-6 bg-chalk transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu — full screen, giant type */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-40 flex flex-col bg-court/97 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-1 flex-col justify-center gap-2 px-6">
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
                  transition={{ delay: 0.1 + i * 0.06 }}
                >
                  <Link href={l.href} className="display block py-3 text-4xl text-chalk hover:text-cq-bright">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <Link href="/donate" className="display block py-3 text-4xl text-cq-bright">
                  Donate
                </Link>
              </motion.div>
            </div>
            <p className="eyebrow px-6 pb-10 text-chalk-dim">Est. 2025 · 501(c)(3) nonprofit · Northern Virginia</p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
