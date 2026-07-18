"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useLiveTournament } from "@/lib/useLive";
import { computeStandings, teamPlayers } from "@/lib/logic";
import { eventMedia } from "@/lib/eventMedia";
import { Bracket } from "@/components/tournament/Bracket";
import { Standings } from "@/components/tournament/Standings";
import { MatchCenter } from "@/components/tournament/MatchCenter";
import { PhotoGrid } from "@/components/site/PhotoGrid";
import { LiveDot } from "@/components/ui";

type Tab = "bracket" | "standings" | "matches" | "teams" | "photos";

function fmtDate(iso: string | null) {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function TournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { tournament, teams, matches, loading } = useLiveTournament(slug);
  const media = eventMedia(slug);

  const hasMatches = matches.length > 0;
  const [tab, setTab] = useState<Tab | null>(null);

  const standings = useMemo(() => computeStandings(teams, matches), [teams, matches]);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const liveCount = matches.filter((m) => m.status === "ongoing").length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="eyebrow animate-pulse-live text-chalk-dim">Loading tournament…</p>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="display text-4xl text-chalk">Tournament not found</h1>
        <p className="text-sm text-chalk-dim">It may have been renamed — check the tournaments page.</p>
      </main>
    );
  }

  const isCompleted = tournament.status === "completed";
  const activeTab: Tab = tab ?? (hasMatches ? "bracket" : isCompleted ? "photos" : "teams");

  const TABS: { key: Tab; label: string; show: boolean }[] = [
    { key: "bracket", label: "Bracket", show: hasMatches || !isCompleted },
    { key: "standings", label: "Standings", show: hasMatches || !isCompleted },
    { key: "matches", label: "Matches", show: hasMatches || !isCompleted },
    { key: "teams", label: "Teams", show: teams.length > 0 || !isCompleted },
    { key: "photos", label: "Photos", show: media.gallery.length > 0 },
  ];

  const finalMatch = matches.find((m) => m.stage === "final" && m.status === "completed");
  const champion = finalMatch
    ? teamMap.get(finalMatch.score_a > finalMatch.score_b ? finalMatch.team_a! : finalMatch.team_b!)
    : null;

  return (
    <main className="min-h-screen pb-24">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <Image
          src={media.cover}
          alt={media.coverAlt}
          placeholder="blur"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-court via-court/70 to-court/40" aria-hidden />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-32 sm:px-6 sm:pb-14 sm:pt-44">
          <p className="eyebrow mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-chalk">
            {tournament.status === "live" && (
              <span className="flex items-center gap-2 bg-cq px-2.5 py-1 text-chalk"><LiveDot /> Live</span>
            )}
            {tournament.status === "registration" && (
              <span className="bg-chalk px-2.5 py-1 text-court">Registration open</span>
            )}
            {isCompleted && <span className="border border-line px-2.5 py-1 text-chalk-dim">Final</span>}
            <span>{fmtDate(tournament.starts_at)}</span>
            {tournament.location && <span>· {tournament.location}</span>}
          </p>
          <h1 className="display text-5xl text-chalk sm:text-7xl">{tournament.name}</h1>
          {tournament.tagline && <p className="mt-4 max-w-xl text-chalk-dim">{tournament.tagline}</p>}

          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
            {champion && (
              <div>
                <p className="eyebrow text-cq-bright">Champions</p>
                <p className="mt-1 font-bold uppercase tracking-wide text-chalk">{teamPlayers(champion)}</p>
              </div>
            )}
            {(tournament.participants || teams.length > 0) && (
              <div>
                <p className="eyebrow text-chalk-dim">{tournament.participants ? "Players" : "Teams"}</p>
                <p className="tnum mt-1 font-mono text-lg font-bold text-chalk">
                  {tournament.participants ?? teams.length}
                </p>
              </div>
            )}
            {liveCount > 0 && (
              <div>
                <p className="eyebrow text-chalk-dim">On court</p>
                <p className="tnum mt-1 font-mono text-lg font-bold text-cq-bright">{liveCount}</p>
              </div>
            )}
            {tournament.raised_cents > 0 && (
              <div>
                <p className="eyebrow text-chalk-dim">Raised</p>
                <p className="tnum mt-1 font-mono text-lg font-bold text-chalk">
                  ${(tournament.raised_cents / 100).toLocaleString()}
                </p>
              </div>
            )}
            {tournament.charity && (
              <div>
                <p className="eyebrow text-chalk-dim">Supporting</p>
                <p className="mt-1 font-bold uppercase tracking-wide text-chalk">{tournament.charity}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Registration CTA (full form lives on its own linkable page) ──── */}
      {tournament.status === "registration" && tournament.registration_open && (
        <section id="register" className="border-y border-cq/40 bg-cq/[0.06]">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-12 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
            <div>
              <p className="eyebrow mb-2 text-cq-bright">Registration is open</p>
              <h2 className="display text-3xl text-chalk">Claim your spot</h2>
              <p className="mt-2 text-sm text-chalk-dim">
                {tournament.format === "doubles" ? "Grab a partner and sign up." : "Sign up to play."} Takes about a minute.
              </p>
            </div>
            <Link
              href={`/tournaments/${slug}/register`}
              className="shrink-0 bg-cq px-7 py-4 text-sm font-bold uppercase tracking-wide text-chalk transition-all hover:bg-cq-bright hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(226,32,40,0.55)]"
            >
              Register to play
            </Link>
          </div>
        </section>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-b border-line bg-court/90 backdrop-blur-md sm:top-[72px]">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 no-scrollbar sm:px-6">
          {TABS.filter((t) => t.show).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`eyebrow relative shrink-0 px-4 py-4 transition-colors ${
                activeTab === t.key ? "text-chalk" : "text-chalk-dim hover:text-chalk"
              }`}
            >
              {t.label}
              {activeTab === t.key && <span className="absolute inset-x-3 bottom-0 h-[3px] bg-cq" aria-hidden />}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        {activeTab === "bracket" && (
          <div className="space-y-12">
            <Bracket matches={matches} teams={teamMap} />
            {matches.some((m) => m.stage === "qualification") && (
              <div>
                <p className="eyebrow baseline mb-6 pb-3 text-chalk-dim">Qualification rounds</p>
                <MatchCenter
                  matches={matches.filter((m) => m.stage === "qualification")}
                  teams={teamMap}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "standings" && <Standings standings={standings} />}

        {activeTab === "matches" && <MatchCenter matches={matches} teams={teamMap} />}

        {activeTab === "teams" && (
          teams.length === 0 ? (
            <div className="border border-dashed border-line px-6 py-16 text-center">
              <p className="text-sm text-chalk-dim">Teams appear here after check-in on tournament day.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-4 border border-line bg-carbon p-4 ${t.withdrawn ? "opacity-40" : ""}`}
                >
                  <span className="tnum flex h-11 w-11 shrink-0 items-center justify-center border border-line font-mono text-sm font-bold text-chalk">
                    {t.number}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate font-semibold text-chalk ${t.withdrawn ? "line-through" : ""}`}>
                      {t.p1_id ? (
                        <Link href={`/players/${t.p1_id}`} className="underline decoration-line underline-offset-4 hover:text-cq-bright">
                          {t.player1}
                        </Link>
                      ) : (
                        t.player1
                      )}
                      {t.player2 && (
                        <>
                          {", "}
                          {t.p2_id ? (
                            <Link href={`/players/${t.p2_id}`} className="underline decoration-line underline-offset-4 hover:text-cq-bright">
                              {t.player2}
                            </Link>
                          ) : (
                            t.player2
                          )}
                        </>
                      )}
                    </p>
                    <p className="eyebrow mt-0.5 text-chalk-dim/70">
                      {t.withdrawn ? "Withdrawn" : t.checked_in ? "Checked in" : "Registered"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "photos" && (
          <div className="space-y-8">
            {media.video && (
              <video
                src={media.video}
                controls
                playsInline
                preload="metadata"
                className="w-full border border-line"
              />
            )}
            <PhotoGrid photos={media.gallery.map((g) => ({ img: g.img, alt: g.alt, span: g.span }))} />
          </div>
        )}
      </div>
    </main>
  );
}
