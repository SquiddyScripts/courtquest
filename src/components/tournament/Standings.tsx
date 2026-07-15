"use client";

import { Fragment } from "react";
import type { Standing } from "@/lib/types";
import { formatDiff, QUALIFIER_COUNT, teamPlayers } from "@/lib/logic";

/**
 * Qualification standings — W, L, games played, IPL/NBA-style point
 * differential. The elimination line separates the top 8 from the field.
 */
export function Standings({ standings }: { standings: Standing[] }) {
  if (standings.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="eyebrow text-chalk-dim">Standings</p>
        <p className="mt-3 text-sm text-chalk-dim/80">
          Rankings appear as soon as qualification matches are scored.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-chalk/60 text-left">
            <th className="eyebrow py-3 pr-2 font-medium text-chalk-dim">#</th>
            <th className="eyebrow py-3 pr-4 font-medium text-chalk-dim">Team</th>
            <th className="eyebrow py-3 pr-4 text-center font-medium text-chalk-dim">GP</th>
            <th className="eyebrow py-3 pr-4 text-center font-medium text-chalk-dim">W</th>
            <th className="eyebrow py-3 pr-4 text-center font-medium text-chalk-dim">L</th>
            <th className="eyebrow py-3 pr-4 text-center font-medium text-chalk-dim">PF</th>
            <th className="eyebrow py-3 pr-4 text-center font-medium text-chalk-dim">PA</th>
            <th className="eyebrow py-3 text-right font-medium text-chalk-dim">Diff</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <Fragment key={s.team.id}>
              <tr
                className={`border-b border-line/60 ${
                  s.qualified ? "" : "opacity-55"
                } ${s.team.withdrawn ? "line-through opacity-30" : ""}`}
              >
                <td className="py-3 pr-2">
                  <span
                    className={`tnum inline-flex h-6 w-6 items-center justify-center font-mono text-xs font-bold ${
                      s.qualified ? "bg-cq text-chalk" : "text-chalk-dim"
                    }`}
                  >
                    {s.rank}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="tnum font-mono text-xs text-chalk-dim/60">{s.team.number}</span>
                    <span className="font-semibold text-chalk">{teamPlayers(s.team)}</span>
                  </div>
                </td>
                <td className="tnum py-3 pr-4 text-center font-mono text-chalk-dim">{s.played}</td>
                <td className="tnum py-3 pr-4 text-center font-mono font-bold text-chalk">{s.wins}</td>
                <td className="tnum py-3 pr-4 text-center font-mono text-chalk-dim">{s.losses}</td>
                <td className="tnum py-3 pr-4 text-center font-mono text-chalk-dim">{s.pointsFor}</td>
                <td className="tnum py-3 pr-4 text-center font-mono text-chalk-dim">{s.pointsAgainst}</td>
                <td
                  className={`tnum py-3 text-right font-mono font-bold ${
                    s.diff > 0 ? "text-win" : s.diff < 0 ? "text-cq-bright" : "text-chalk-dim"
                  }`}
                >
                  {formatDiff(s.diff)}
                </td>
              </tr>
              {i === QUALIFIER_COUNT - 1 && standings.length > QUALIFIER_COUNT && (
                <tr aria-hidden>
                  <td colSpan={8} className="relative py-0">
                    <div className="baseline my-1 text-cq/70" />
                    <p className="eyebrow absolute -top-1.5 right-0 bg-court px-2 text-[10px] text-cq-bright">
                      Elimination line
                    </p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      <p className="eyebrow mt-4 text-chalk-dim/60">
        Ranked by wins, then avg point differential · Top {QUALIFIER_COUNT} advance
      </p>
    </div>
  );
}
