"use client";

import type { Match, Team } from "@/lib/types";
import { teamPlayers } from "@/lib/logic";
import { LiveDot } from "@/components/ui";
import { Trophy } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Single-elimination bracket tree — QF → SF → F → champion.
   Pure CSS grid with connector lines; horizontally scrollable on mobile.
──────────────────────────────────────────────────────────────────────────── */

function Slot({
  match, teams, side,
}: {
  match: Match | undefined;
  teams: Map<string, Team>;
  side: "a" | "b";
}) {
  const teamId = side === "a" ? match?.team_a : match?.team_b;
  const team = teamId ? teams.get(teamId) : null;
  const score = side === "a" ? match?.score_a : match?.score_b;
  const other = side === "a" ? match?.score_b : match?.score_a;
  const done = match?.status === "completed";
  const isBye = match?.note === "bye";
  const winner = done && (isBye ? !!team : score! > other!);
  const live = match?.status === "ongoing";

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 ${
        winner ? "bg-chalk/[0.06] text-chalk" : "text-chalk-dim"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="tnum w-5 shrink-0 text-right font-mono text-[11px] text-chalk-dim/60">
          {team?.number ?? ""}
        </span>
        <span className={`truncate text-[13px] ${winner ? "font-bold" : "font-medium"} ${!team && isBye ? "italic text-chalk-dim/50" : ""}`}>
          {team ? teamPlayers(team) : isBye ? "Bye" : "TBD"}
        </span>
      </div>
      <span className={`tnum shrink-0 font-mono text-sm ${winner ? "font-bold text-cq-bright" : live ? "text-chalk" : ""}`}>
        {match && !isBye && (match.status !== "upcoming" || done) ? score : ""}
      </span>
    </div>
  );
}

function BracketMatch({ match, teams }: { match: Match | undefined; teams: Map<string, Team> }) {
  const live = match?.status === "ongoing";
  return (
    <div
      className={`w-60 border bg-carbon ${
        live ? "border-cq/70 shadow-[0_0_24px_-6px_rgba(226,32,40,0.5)]" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-dim/70">
          {match ? `Match #${match.code}` : "—"}
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase text-chalk-dim/70">
          {live && <LiveDot />}
          {match?.court != null ? `CT ${match.court}` : ""}
        </span>
      </div>
      <div className="divide-y divide-line/60">
        <Slot match={match} teams={teams} side="a" />
        <Slot match={match} teams={teams} side="b" />
      </div>
    </div>
  );
}

/** Vertical connector between rounds. */
function Joint({ h }: { h: number }) {
  return (
    <div className="relative mx-0 w-6 shrink-0 sm:w-10" aria-hidden>
      <div className="absolute left-0 w-1/2 border-y border-r border-line" style={{ height: h, top: `calc(50% - ${h / 2}px)` }} />
      <div className="absolute left-1/2 top-1/2 w-1/2 border-t border-line" />
    </div>
  );
}

export function Bracket({ matches, teams }: { matches: Match[]; teams: Map<string, Team> }) {
  const qf = [1, 2, 3, 4].map((s) => matches.find((m) => m.stage === "quarterfinal" && m.slot === s));
  const sf = [1, 2].map((s) => matches.find((m) => m.stage === "semifinal" && m.slot === s));
  const f = matches.find((m) => m.stage === "final");

  const champId =
    f?.status === "completed"
      ? f.score_a > f.score_b
        ? f.team_a
        : f.team_b
      : null;
  const champ = champId ? teams.get(champId) : null;

  if (!qf.some(Boolean) && !f) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="eyebrow text-chalk-dim">Elimination bracket</p>
        <p className="mt-3 text-sm text-chalk-dim/80">
          The top 8 teams from qualification will be seeded here once the round closes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4 no-scrollbar">
      <div className="flex min-w-max items-center gap-0 pr-4">
        {/* Quarterfinals */}
        <div className="flex flex-col gap-6">
          <p className="eyebrow text-chalk-dim">Quarterfinals</p>
          {qf.map((m, i) => <BracketMatch key={i} match={m} teams={teams} />)}
        </div>

        <div className="mt-7 flex flex-col gap-6 self-stretch justify-around">
          <Joint h={112} />
          <Joint h={112} />
        </div>

        {/* Semifinals */}
        <div className="flex flex-col gap-[7.5rem] self-center">
          <p className="eyebrow -mb-24 text-chalk-dim">Semifinals</p>
          {sf.map((m, i) => <BracketMatch key={i} match={m} teams={teams} />)}
        </div>

        <div className="flex self-center">
          <Joint h={224} />
        </div>

        {/* Final */}
        <div className="flex flex-col gap-4 self-center">
          <p className="eyebrow -mb-1 text-cq-bright">Championship</p>
          <BracketMatch match={f} teams={teams} />
          {champ && (
            <div className="border border-cq bg-cq/10 px-4 py-3">
              <p className="eyebrow flex items-center gap-2 text-cq-bright">
                <Trophy className="h-3.5 w-3.5" /> Champions
              </p>
              <p className="mt-1.5 font-bold uppercase tracking-wide text-chalk">
                {teamPlayers(champ)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
