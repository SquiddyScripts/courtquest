"use client";

import type { Match, Team } from "@/lib/types";
import { STAGE_SHORT, teamPlayers } from "@/lib/logic";
import { StatusPill } from "@/components/ui";

/** One team row inside a match card. */
function TeamRow({
  team, score, isWinner, isServing, live,
}: {
  team: Team | null | undefined;
  score: number;
  isWinner: boolean;
  isServing: boolean;
  live: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 ${isWinner ? "text-chalk" : "text-chalk-dim"}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="tnum w-7 shrink-0 text-right font-mono text-xs text-chalk-dim/70">
          {team ? team.number : "—"}
        </span>
        <span className={`truncate text-sm ${isWinner ? "font-bold" : "font-medium"}`}>
          {team ? teamPlayers(team) : "TBD"}
        </span>
        {isServing && live && (
          <span className="shrink-0 rounded-sm bg-cq/15 px-1.5 font-mono text-[10px] uppercase text-cq-bright">
            serve
          </span>
        )}
      </div>
      <span className={`tnum font-mono text-lg leading-none ${isWinner ? "font-bold text-chalk" : ""}`}>
        {score}
      </span>
    </div>
  );
}

export function MatchCard({
  match, teams, onClick, highlight,
}: {
  match: Match;
  teams: Map<string, Team>;
  onClick?: () => void;
  highlight?: boolean;
}) {
  const a = match.team_a ? teams.get(match.team_a) : null;
  const b = match.team_b ? teams.get(match.team_b) : null;
  const done = match.status === "completed";
  const live = match.status === "ongoing";
  const winA = done && match.score_a > match.score_b;
  const winB = done && match.score_b > match.score_a;

  const inner = (
    <div
      className={`border bg-carbon p-4 transition-all ${
        live ? "border-cq/60 shadow-[0_0_0_1px_rgba(226,32,40,0.25),0_8px_32px_-12px_rgba(226,32,40,0.35)]"
             : highlight ? "border-chalk/30" : "border-line"
      } ${onClick ? "cursor-pointer hover:border-chalk/40 hover:-translate-y-0.5" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-line pb-2">
        <span className="font-mono text-xs text-chalk-dim">
          {STAGE_SHORT[match.stage]}
          {match.stage === "qualification" ? ` · R${match.round}` : ""} · #{match.code}
        </span>
        <div className="flex items-center gap-3">
          {match.court != null && (
            <span className="font-mono text-xs uppercase text-chalk-dim/80">Court {match.court}</span>
          )}
          <StatusPill status={match.status} />
        </div>
      </div>
      <TeamRow team={a} score={match.score_a} isWinner={winA} isServing={match.serving === "a"} live={live} />
      <TeamRow team={b} score={match.score_b} isWinner={winB} isServing={match.serving === "b"} live={live} />
    </div>
  );

  return onClick ? (
    <button onClick={onClick} className="block w-full text-left">{inner}</button>
  ) : (
    inner
  );
}
