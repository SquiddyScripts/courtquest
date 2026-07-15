"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { useLiveTournament } from "@/lib/useLive";
import { refWrite } from "@/lib/supabase";
import { nextUpQueue, teamPlayers } from "@/lib/logic";
import { ScoreConsole } from "@/components/tournament/ScoreConsole";
import { LiveDot } from "@/components/ui";
import type { Match, Team } from "@/lib/types";

/* ────────────────────────────────────────────────────────────────────────────
   Referee flow, court-first:
     1. Enter the tournament code (once, on /ref)
     2. Pick YOUR court
     3. Score the match in front of you → submit → the next match for your
        court appears automatically. That's the whole loop.
──────────────────────────────────────────────────────────────────────────── */

function matchupLabel(m: Match, teams: Map<string, Team>) {
  return `${teamPlayers(teams.get(m.team_a ?? ""))  || "TBD"} vs ${teamPlayers(teams.get(m.team_b ?? "")) || "TBD"}`;
}

export default function RefConsolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { tournament, teams, matches, loading } = useLiveTournament(slug);
  const [code, setCode] = useState<string | null>(null);
  const [court, setCourt] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      // localStorage, so closing the phone's browser tab doesn't log the ref out.
      setCode(localStorage.getItem(`cq-ref-${slug}`) ?? sessionStorage.getItem(`cq-ref-${slug}`));
      const storedCourt = localStorage.getItem(`cq-ref-court-${slug}`);
      setCourt(storedCourt ? Number(storedCourt) : null);
      setChecked(true);
    });
  }, [slug]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const queue = useMemo(() => nextUpQueue(matches), [matches]);

  /** The match a ref on this court should be dealing with right now. */
  const currentFor = (c: number): Match | null =>
    matches.find((m) => m.status === "ongoing" && m.court === c) ??
    matches
      .filter((m) => m.status === "upcoming" && m.court === c && m.team_a && m.team_b)
      .sort((x, y) => x.code - y.code)[0] ??
    null;

  function pickCourt(c: number | null) {
    setCourt(c);
    if (c == null) localStorage.removeItem(`cq-ref-court-${slug}`);
    else localStorage.setItem(`cq-ref-court-${slug}`, String(c));
  }

  async function bringToCourt(m: Match, c: number) {
    if (!tournament || !code) return;
    setBusy(true);
    try {
      await refWrite(tournament.id, code, "match_update", {
        id: m.id,
        patch: { court: c },
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !checked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="eyebrow animate-pulse-live text-chalk-dim">Loading console…</p>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-chalk-dim">Tournament not found.</p>
      </main>
    );
  }

  if (!code) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="display text-4xl text-chalk">Console locked</h1>
        <p className="max-w-sm text-sm text-chalk-dim">
          Enter the tournament code to referee {tournament.name}.
        </p>
        <Link href="/ref" className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright">
          Enter code
        </Link>
      </main>
    );
  }

  /* ── Step 1: pick your court ─────────────────────────────────────────── */
  if (court == null) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <p className="eyebrow mb-2 flex items-center gap-2 text-cq-bright">
          {tournament.status === "live" && <LiveDot />} {tournament.name}
        </p>
        <h1 className="display text-4xl text-chalk sm:text-5xl">Which court are you on?</h1>
        <p className="mt-3 text-sm text-chalk-dim">
          Your console follows this court. Matches show up for you automatically.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: tournament.courts }, (_, i) => i + 1).map((c) => {
            const m = currentFor(c);
            const live = m?.status === "ongoing";
            return (
              <button
                key={c}
                onClick={() => pickCourt(c)}
                className={`group border p-6 text-left transition-all hover:-translate-y-0.5 ${
                  live ? "border-cq/60 bg-cq/[0.07]" : "border-line bg-carbon hover:border-chalk/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="display text-3xl text-chalk">Court {c}</span>
                  {live ? (
                    <span className="eyebrow flex items-center gap-2 text-cq-bright"><LiveDot /> Live</span>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-chalk-dim transition-transform group-hover:translate-x-1" aria-hidden />
                  )}
                </div>
                <p className="mt-3 truncate text-sm text-chalk-dim">
                  {m ? (
                    <>
                      <span className="font-mono text-xs">#{m.code}</span>{" "}
                      {matchupLabel(m, teamMap)}
                      {live && <span className="tnum font-mono font-bold text-chalk"> · {m.score_a}–{m.score_b}</span>}
                    </>
                  ) : (
                    "Nothing assigned yet"
                  )}
                </p>
              </button>
            );
          })}
        </div>

        {matches.length === 0 && (
          <p className="mt-10 border border-dashed border-line px-6 py-10 text-center text-sm text-chalk-dim">
            No matches yet. The tournament desk generates the schedule after check-in.
          </p>
        )}
      </main>
    );
  }

  /* ── Step 2: your court, one match at a time ─────────────────────────── */
  const current = currentFor(court);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-24 pt-24 sm:px-6 sm:pt-32">
      {/* court header */}
      <div className="mb-8 flex items-center justify-between border border-line bg-carbon px-5 py-4">
        <div>
          <p className="eyebrow text-cq-bright">{tournament.name}</p>
          <p className="display mt-1 text-3xl text-chalk">Court {court}</p>
        </div>
        <button
          onClick={() => pickCourt(null)}
          className="eyebrow flex items-center gap-2 border border-line px-3.5 py-2.5 text-chalk-dim transition-colors hover:text-chalk"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" /> Switch court
        </button>
      </div>

      {current ? (
        <>
          {current.status === "upcoming" && (
            <p className="mb-4 border border-line bg-carbon px-4 py-3 text-center font-mono text-sm uppercase tracking-wider text-chalk-dim">
              Up next on your court. First point starts the match.
            </p>
          )}
          <ScoreConsole
            key={current.id}
            tournament={tournament}
            match={current}
            teams={teamMap}
            code={code}
            onExit={() => { /* stay on court view; the next match appears */ }}
            embedded
          />
        </>
      ) : (
        <div className="border border-dashed border-line px-6 py-14 text-center">
          <p className="display text-2xl text-chalk">Court {court} is open</p>
          {queue.length > 0 ? (
            <>
              <p className="mx-auto mt-3 max-w-sm text-sm text-chalk-dim">
                This match is ready. Both teams are rested. Bring them to your court:
              </p>
              <div className="mx-auto mt-6 max-w-md border border-line bg-carbon px-4 py-4 text-left">
                <p className="font-mono text-xs text-chalk-dim">#{queue[0].code}</p>
                <p className="mt-1 font-bold uppercase tracking-wide text-chalk">
                  {matchupLabel(queue[0], teamMap)}
                </p>
              </div>
              <button
                onClick={() => bringToCourt(queue[0], court)}
                disabled={busy}
                className="mt-5 bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
              >
                {busy ? "One sec…" : `Call them to court ${court}`}
              </button>
            </>
          ) : (
            <p className="mx-auto mt-3 max-w-sm text-sm text-chalk-dim">
              {matches.length === 0
                ? "The schedule hasn't been generated yet. Check with the tournament desk."
                : "No matches are waiting right now. Grab some water."}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
