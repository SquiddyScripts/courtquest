"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tournament } from "@/lib/types";
import { eventMedia } from "@/lib/eventMedia";
import { LiveDot, Reveal, SectionHead } from "@/components/ui";

function fmtDate(iso: string | null) {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function TournamentCard({ t, index }: { t: Tournament; index: number }) {
  const media = eventMedia(t.slug);
  const isLive = t.status === "live";
  const isOpen = t.status === "registration";
  const isPast = t.status === "completed";

  const stats = [
    t.participants ? { v: String(t.participants), l: "Players" } : null,
    t.raised_cents > 0 ? { v: `$${(t.raised_cents / 100).toLocaleString()}`, l: "Raised" } : null,
    t.charity ? { v: t.charity, l: "For", wide: true } : null,
  ].filter(Boolean) as { v: string; l: string; wide?: boolean }[];

  return (
    <Reveal delay={index * 0.08}>
      <Link
        href={`/tournaments/${t.slug}`}
        className="group block border border-line bg-carbon transition-all hover:-translate-y-1 hover:border-chalk/35"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={media.cover}
            alt={media.coverAlt}
            placeholder="blur"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-court/85 to-transparent" aria-hidden />
          <div className="absolute left-4 top-4">
            {isLive ? (
              <span className="eyebrow flex items-center gap-2 bg-cq px-3 py-1.5 text-chalk"><LiveDot /> Live now</span>
            ) : isOpen ? (
              <span className="eyebrow bg-chalk px-3 py-1.5 text-court">Registration open</span>
            ) : null}
          </div>
          <div className="absolute inset-x-5 bottom-4">
            <p className="eyebrow text-cq-bright">{fmtDate(t.starts_at)}</p>
            <h3 className="display mt-1.5 text-3xl text-chalk sm:text-4xl">{t.name}</h3>
            {t.location && <p className="eyebrow mt-2 text-chalk-dim">{t.location}</p>}
          </div>
        </div>

        {/* Event record: the numbers that made the day */}
        {stats.length > 0 ? (
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            {stats.map((s) => (
              <div key={s.l} className={`px-4 py-4 sm:px-5 ${s.wide && stats.length < 3 ? "col-span-2" : ""}`}>
                <p className={`tnum font-mono font-bold text-chalk ${s.wide ? "text-xs leading-4" : "text-xl"}`}>
                  {s.v}
                </p>
                <p className="eyebrow mt-1 text-chalk-dim/80">{s.l}</p>
              </div>
            ))}
          </div>
        ) : (
          t.tagline && (
            <p className="border-t border-line px-5 py-4 text-sm text-chalk-dim">{t.tagline}</p>
          )
        )}

        <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
          <span className="eyebrow text-chalk-dim">
            {isPast ? "Photos, bracket & results" : isOpen ? "Sign-ups are open" : isLive ? "Scores updating live" : "Details"}
          </span>
          <span className="eyebrow text-chalk transition-colors group-hover:text-cq-bright">
            {isLive ? "Watch live →" : isOpen ? "Register →" : isPast ? "Relive it →" : "View →"}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .neq("status", "draft")
      .eq("hidden", false)
      .order("starts_at", { ascending: false })
      .then(({ data }) => setTournaments((data as Tournament[]) ?? []));
  }, []);

  const upcoming = (tournaments ?? []).filter((t) => t.status !== "completed");
  const past = (tournaments ?? []).filter((t) => t.status === "completed");

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <SectionHead eyebrow="Tournaments" title="The season" />

      {tournaments === null ? (
        <p className="py-20 text-center text-sm text-chalk-dim">Loading tournaments…</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-16 grid gap-5 md:grid-cols-2">
              {upcoming.map((t, i) => <TournamentCard key={t.id} t={t} index={i} />)}
            </div>
          )}

          {upcoming.length === 0 && (
            <div className="mb-16 border border-dashed border-line px-6 py-14 text-center">
              <p className="display text-2xl text-chalk">Next tournament in the works</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-chalk-dim">
                Follow along or join the mailing list — sign-ups open here the moment
                the next event is announced.
              </p>
              <Link href="/join" className="eyebrow mt-6 inline-block text-cq-bright hover:text-chalk">
                Get notified →
              </Link>
            </div>
          )}

          {past.length > 0 && (
            <>
              <Reveal>
                <p className="eyebrow baseline mb-8 pb-3 text-chalk-dim">Past championships</p>
              </Reveal>
              <div className="grid gap-5 md:grid-cols-2">
                {past.map((t, i) => <TournamentCard key={t.id} t={t} index={i} />)}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
