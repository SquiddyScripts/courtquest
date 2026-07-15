"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { teamLabel } from "@/lib/logic";
import type { Match, Team, Tournament } from "@/lib/types";
import { LiveDot } from "@/components/ui";

/**
 * Broadcast-style scorebug strip. Renders only while a tournament is live:
 * ongoing + just-finished matches scroll past like a ticker on a sports channel.
 */
export function LiveTicker() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [items, setItems] = useState<{ m: Match; a: string; b: string }[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: t } = await supabase
        .from("tournaments").select("*").eq("status", "live").limit(1).maybeSingle();
      if (!t) return;
      setTournament(t as Tournament);

      const fetchMatches = async () => {
        const [{ data: ms }, { data: ts }] = await Promise.all([
          supabase.from("matches").select("*").eq("tournament_id", t.id)
            .in("status", ["ongoing", "completed"]).order("code"),
          supabase.from("teams").select("*").eq("tournament_id", t.id),
        ]);
        const teamById = new Map((ts ?? []).map((x: Team) => [x.id, x as Team]));
        const live = (ms ?? []).filter((m: Match) => m.status === "ongoing");
        const done = (ms ?? []).filter((m: Match) => m.status === "completed").slice(-6);
        setItems(
          [...live, ...done].map((m: Match) => ({
            m,
            a: teamLabel(m.team_a ? teamById.get(m.team_a) : null),
            b: teamLabel(m.team_b ? teamById.get(m.team_b) : null),
          }))
        );
      };
      await fetchMatches();
      channel = supabase
        .channel("ticker")
        .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchMatches)
        .subscribe();
    }
    load();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  if (!tournament || items.length === 0) return null;

  const strip = (
    <>
      {items.map(({ m, a, b }) => (
        <span key={m.id} className="mx-6 inline-flex items-center gap-3 font-mono text-[13px]">
          <span className={m.status === "ongoing" ? "text-cq-bright" : "text-chalk-dim/60"}>
            {m.status === "ongoing" ? "LIVE" : "FINAL"}
          </span>
          <span className="text-chalk-dim">#{m.code}</span>
          <span className="max-w-44 truncate text-chalk">{a}</span>
          <span className="tnum font-bold text-chalk">{m.score_a}–{m.score_b}</span>
          <span className="max-w-44 truncate text-chalk">{b}</span>
          {m.court && <span className="text-chalk-dim/60">CT {m.court}</span>}
        </span>
      ))}
    </>
  );

  return (
    // Grows in smoothly after the data arrives instead of shoving the page down.
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
    <Link
      href={`/tournaments/${tournament.slug}`}
      className="group block border-y border-line bg-carbon transition-colors hover:bg-graphite"
      aria-label={`Live scores from ${tournament.name}`}
    >
      <div className="flex items-center">
        <span className="eyebrow z-10 flex shrink-0 items-center gap-2 border-r border-line bg-cq px-4 py-3.5 text-chalk">
          <LiveDot /> {tournament.name}
        </span>
        <div className="relative flex-1 overflow-hidden py-3.5">
          <div className="animate-marquee whitespace-nowrap will-change-transform">
            {strip}
            {strip}
          </div>
        </div>
      </div>
    </Link>
    </motion.div>
  );
}
