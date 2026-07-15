"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { Match, Team, Tournament } from "./types";

export interface LiveTournament {
  tournament: Tournament | null;
  teams: Team[];
  matches: Match[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Live tournament state: initial fetch + Supabase realtime subscription.
 * Every phone watching a bracket stays in sync as refs score matches.
 */
export function useLiveTournament(slug: string | null): LiveTournament {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const idRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!slug) return;
    const { data: t } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
    if (!t) { setLoading(false); return; }
    idRef.current = t.id;
    const [{ data: tm }, { data: ms }] = await Promise.all([
      supabase.from("teams").select("*").eq("tournament_id", t.id).order("number"),
      supabase.from("matches").select("*").eq("tournament_id", t.id).order("code"),
    ]);
    setTournament(t as Tournament);
    setTeams((tm ?? []) as Team[]);
    setMatches((ms ?? []) as Match[]);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    queueMicrotask(refresh);

    const channel = supabase
      .channel(`live-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, (payload) => {
        const row = (payload.new ?? payload.old) as Match;
        if (!idRef.current || row.tournament_id !== idRef.current || cancelled) return;
        setMatches((prev) => {
          if (payload.eventType === "DELETE") return prev.filter((m) => m.id !== (payload.old as Match).id);
          const next = prev.filter((m) => m.id !== (payload.new as Match).id);
          next.push(payload.new as Match);
          next.sort((a, b) => a.code - b.code);
          return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, (payload) => {
        const row = (payload.new ?? payload.old) as Team;
        if (!idRef.current || row.tournament_id !== idRef.current || cancelled) return;
        setTeams((prev) => {
          if (payload.eventType === "DELETE") return prev.filter((t) => t.id !== (payload.old as Team).id);
          const next = prev.filter((t) => t.id !== (payload.new as Team).id);
          next.push(payload.new as Team);
          next.sort((a, b) => a.number - b.number);
          return next;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tournaments" }, (payload) => {
        const row = payload.new as Tournament;
        if (row.id === idRef.current && !cancelled) setTournament(row);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [slug, refresh]);

  return { tournament, teams, matches, loading, refresh };
}
