"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Match, Team } from "@/lib/types";
import { MatchCard } from "./MatchCard";

type Filter = "all" | "ongoing" | "upcoming" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ongoing", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Finished" },
];

/**
 * Match center: every match, searchable by match number, team number,
 * or player name — with live/upcoming/finished filters.
 */
export function MatchCenter({
  matches, teams, onSelect,
}: {
  matches: Match[];
  teams: Map<string, Team>;
  onSelect?: (m: Match) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return matches
      .filter((m) => (filter === "all" ? true : m.status === filter))
      .filter((m) => {
        if (!needle) return true;
        const a = m.team_a ? teams.get(m.team_a) : null;
        const b = m.team_b ? teams.get(m.team_b) : null;
        const hay = [
          `#${m.code}`, String(m.code),
          m.court != null ? `court ${m.court}` : "",
          a?.player1, a?.player2, a?.name, a ? String(a.number) : "",
          b?.player1, b?.player2, b?.name, b ? String(b.number) : "",
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(needle);
      })
      .sort((x, y) => {
        const order = { ongoing: 0, upcoming: 1, completed: 2 } as const;
        return order[x.status] - order[y.status] || x.code - y.code;
      });
  }, [matches, teams, q, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-dim/60" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search match #, team, or player"
            className="w-full border border-line bg-carbon py-3 pl-10 pr-4 text-sm text-chalk placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none"
            aria-label="Search matches"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`eyebrow px-3.5 py-2.5 transition-colors ${
                filter === f.key
                  ? "bg-chalk text-court"
                  : "border border-line text-chalk-dim hover:border-chalk/40 hover:text-chalk"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-chalk-dim">
            {matches.length === 0
              ? "Matches appear here once the tournament schedule is generated."
              : "No matches found — try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              teams={teams}
              onClick={onSelect ? () => onSelect(m) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
