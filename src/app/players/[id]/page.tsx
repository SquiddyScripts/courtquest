"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchPlayerCareer, type Career } from "@/lib/playerCareer";
import { STAGE_SHORT, teamPlayers } from "@/lib/logic";
import { Reveal } from "@/components/ui";

/* Public player profile: career record, stats, and tournament history. */
export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState<string | null>(null);
  const [since, setSince] = useState<string | null>(null);
  const [career, setCareer] = useState<Career | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const [{ data: pub }, c] = await Promise.all([
        supabase.rpc("player_public", { pid: id }),
        fetchPlayerCareer(id),
      ]);
      if (!pub) { setMissing(true); return; }
      setName(pub.name);
      setSince(pub.since);
      setCareer(c);
    });
  }, [id]);

  if (missing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="display text-4xl text-chalk">Player not found</h1>
        <Link href="/tournaments" className="eyebrow text-cq-bright hover:text-chalk">Tournaments →</Link>
      </main>
    );
  }

  if (!name || !career) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="eyebrow animate-pulse-live text-chalk-dim">Loading profile…</p>
      </main>
    );
  }

  const winPct = career.played > 0 ? Math.round((career.wins / career.played) * 100) : 0;
  const diff = career.played > 0 ? (career.pointsFor - career.pointsAgainst) / career.played : 0;

  const STATS = [
    { v: `${career.wins}–${career.losses}`, l: "Career record" },
    { v: `${winPct}%`, l: "Win rate" },
    { v: (diff >= 0 ? "+" : "") + diff.toFixed(2), l: "Avg point diff" },
    { v: String(career.tournaments), l: "Tournaments" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      {/* header */}
      <div className="baseline pb-6 text-chalk">
        <p className="eyebrow mb-3 flex items-center gap-2.5 text-cq-bright">
          <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
          Player profile
          {career.championships > 0 && (
            <span className="ml-2 flex items-center gap-1.5 bg-cq px-2 py-0.5 text-chalk">
              <Trophy className="h-3 w-3" /> {career.championships}× champion
            </span>
          )}
        </p>
        <h1 className="display text-5xl text-chalk sm:text-7xl">{name}</h1>
        {since && (
          <p className="eyebrow mt-4 text-chalk-dim">
            CourtQuest player since {new Date(since).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* career stat band */}
      <div className="court-grid border-b border-line">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.l} delay={i * 0.06} className="text-center">
              <div className="px-4 py-8">
                <p className="tnum font-mono text-3xl font-bold text-chalk sm:text-4xl">{s.v}</p>
                <p className="eyebrow mt-2 text-chalk-dim">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* tournament history */}
      {career.runs.length === 0 ? (
        <div className="mt-12 border border-dashed border-line px-6 py-14 text-center">
          <p className="display text-2xl text-chalk">No matches yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-chalk-dim">
            Stats appear automatically once this player competes in a CourtQuest
            tournament with this profile&apos;s email.
          </p>
        </div>
      ) : (
        <div className="mt-12 space-y-10">
          {career.runs.map((run, ri) => (
            <Reveal key={run.tournament.id} delay={Math.min(ri * 0.06, 0.2)}>
              <section className="border border-line bg-carbon">
                <Link
                  href={`/tournaments/${run.tournament.slug}`}
                  className="group flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"
                >
                  <div>
                    <p className="font-bold uppercase tracking-wide text-chalk group-hover:text-cq-bright">
                      {run.tournament.name}
                      {run.champion && <Trophy className="mb-0.5 ml-2 inline h-4 w-4 text-cq-bright" aria-hidden />}
                    </p>
                    <p className="eyebrow mt-1 text-chalk-dim/70">
                      {run.tournament.starts_at
                        ? new Date(run.tournament.starts_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "Date TBA"}
                      {run.team.player2 ? ` · with ${run.team.player2 === name ? run.team.player1 : run.team.player2}` : " · singles"}
                    </p>
                  </div>
                  <p className="tnum font-mono text-xl font-bold text-chalk">
                    {run.wins}–{run.losses}
                    {run.champion && <span className="eyebrow ml-2 text-cq-bright">Champion</span>}
                  </p>
                </Link>
                <div className="divide-y divide-line/60">
                  {run.matches.map((c) => (
                    <div key={c.match.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <span className="tnum w-9 shrink-0 border border-line px-1.5 py-0.5 text-center font-mono text-[10px] uppercase text-chalk-dim">
                        {STAGE_SHORT[c.match.stage]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-chalk">
                        {c.isBye ? (
                          <span className="italic text-chalk-dim">Bye — advanced automatically</span>
                        ) : (
                          <>vs {c.opponent ? teamPlayers(c.opponent) : "TBD"}</>
                        )}
                      </span>
                      {c.match.status === "completed" && !c.isBye ? (
                        <span className={`tnum shrink-0 font-mono text-sm font-bold ${c.won ? "text-win" : "text-cq-bright"}`}>
                          {c.won ? "W" : "L"} {c.score[0]}–{c.score[1]}
                        </span>
                      ) : c.match.status === "ongoing" ? (
                        <span className="tnum shrink-0 font-mono text-sm text-chalk">
                          Live · {c.score[0]}–{c.score[1]}
                        </span>
                      ) : !c.isBye ? (
                        <span className="eyebrow shrink-0 text-chalk-dim/60">Upcoming</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      )}
    </main>
  );
}
