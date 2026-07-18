"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Trophy, UserRound } from "lucide-react";
import { usePlayer } from "@/lib/usePlayer";
import { useLiveTournament } from "@/lib/useLive";
import { fetchPlayerCareer, type Career } from "@/lib/playerCareer";
import { computeStandings, formatDiff, teamPlayers, STAGE_LABEL } from "@/lib/logic";
import { LiveDot } from "@/components/ui";
import type { Team } from "@/lib/types";

const field =
  "w-full border border-line bg-court px-4 py-3.5 text-base text-chalk placeholder:text-chalk-dim/40 focus:border-cq/70 focus:outline-none";

/* ────────────────────────────────────────────────────────────────────────────
   /me — the player's phone. One question answered at all times:
   "where do I need to be right now?"
──────────────────────────────────────────────────────────────────────────── */

function AuthGate({
  login, signup,
}: {
  login: (email: string, pw: string) => Promise<string | null>;
  signup: (name: string, email: string, pw: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const err = mode === "login"
      ? await login(String(fd.get("email")), String(fd.get("password")))
      : await signup(String(fd.get("name")), String(fd.get("email")), String(fd.get("password")));
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm border border-line bg-carbon p-8 sm:p-10">
        <UserRound className="h-7 w-7 text-cq-bright" aria-hidden />
        <h1 className="display mt-5 text-3xl text-chalk">Player profile</h1>
        <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
          Your matches, your stats, and a live &quot;where do I go next&quot; view on
          tournament day. Optional, free, and tied to the email you register with.
        </p>

        <div className="mt-6 flex gap-1 border-b border-line">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`eyebrow relative px-4 py-3 transition-colors ${mode === m ? "text-chalk" : "text-chalk-dim hover:text-chalk"}`}
            >
              {m === "login" ? "Sign in" : "Create profile"}
              {mode === m && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-cq" aria-hidden />}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="eyebrow mb-2 block text-chalk-dim">Name</label>
              <input id="name" name="name" required minLength={2} placeholder="First name + last initial" className={field} />
            </div>
          )}
          <div>
            <label htmlFor="email" className="eyebrow mb-2 block text-chalk-dim">Email</label>
            <input id="email" name="email" type="email" required placeholder="The email you register with" className={field} />
          </div>
          <div>
            <label htmlFor="password" className="eyebrow mb-2 block text-chalk-dim">
              Password {mode === "signup" && <span className="normal-case tracking-normal">(8+ characters)</span>}
            </label>
            <input id="password" name="password" type="password" required minLength={mode === "signup" ? 8 : 1} className={field} />
          </div>
          {error && <p className="text-sm font-medium text-cq-bright">{error}</p>}
          <button
            disabled={busy}
            className="w-full bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
          >
            {busy ? "One sec…" : mode === "login" ? "Sign in" : "Create profile"}
          </button>
          {mode === "signup" && (
            <p className="eyebrow text-chalk-dim/60">
              Played before with this email? Your history links up automatically.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

/* ── Live tournament view: the "what do I do now" card ────────────────────── */
function LiveDay({ slug, myTeams }: { slug: string; myTeams: Team[] }) {
  const { tournament, teams, matches } = useLiveTournament(slug);
  const myIds = useMemo(() => new Set(myTeams.map((t) => t.id)), [myTeams]);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  if (!tournament) return null;

  const mine = matches.filter((m) => (m.team_a && myIds.has(m.team_a)) || (m.team_b && myIds.has(m.team_b)));
  const oppOf = (m: (typeof mine)[number]) => {
    const oppId = m.team_a && myIds.has(m.team_a) ? m.team_b : m.team_a;
    return oppId ? teamMap.get(oppId) : null;
  };
  const myScore = (m: (typeof mine)[number]): [number, number] =>
    m.team_a && myIds.has(m.team_a) ? [m.score_a, m.score_b] : [m.score_b, m.score_a];

  const playing = mine.find((m) => m.status === "ongoing");
  const called = mine.find((m) => m.status === "upcoming" && m.court != null && m.note !== "bye");
  const waiting = mine
    .filter((m) => m.status === "upcoming" && m.court == null && m.team_a && m.team_b && m.note !== "bye")
    .sort((a, b) => a.code - b.code)[0];
  const done = mine.filter((m) => m.status === "completed" && m.note !== "bye");

  const myTeam = myTeams.find((t) => t.tournament_id === tournament.id);
  const standings = computeStandings(teams, matches);
  const myStanding = standings.find((s) => myTeam && s.team.id === myTeam.id);

  return (
    <section className="border border-cq/50 bg-carbon">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="eyebrow flex items-center gap-2 text-cq-bright"><LiveDot /> {tournament.name}</p>
        <Link href={`/tournaments/${slug}`} className="eyebrow text-chalk-dim hover:text-chalk">Full bracket →</Link>
      </div>

      {/* THE answer */}
      <div className="px-5 py-8 text-center sm:py-10">
        {playing ? (
          <>
            <p className="eyebrow text-chalk-dim">You&apos;re playing right now</p>
            <p className="display mt-3 flex items-center justify-center gap-3 text-5xl text-cq-bright">
              <MapPin className="h-9 w-9" aria-hidden /> Court {playing.court}
            </p>
            <p className="mt-4 text-sm text-chalk-dim">
              vs {teamPlayers(oppOf(playing)) || "TBD"} · {STAGE_LABEL[playing.stage]}
            </p>
            <p className="tnum mt-3 font-mono text-4xl font-bold text-chalk">
              {myScore(playing)[0]}–{myScore(playing)[1]}
            </p>
          </>
        ) : called ? (
          <>
            <p className="eyebrow animate-pulse-live text-cq-bright">You&apos;ve been called</p>
            <p className="display mt-3 flex items-center justify-center gap-3 text-5xl text-chalk">
              <MapPin className="h-9 w-9 text-cq-bright" aria-hidden /> Court {called.court}
            </p>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-chalk">
              Head over now · vs {teamPlayers(oppOf(called)) || "TBD"}
            </p>
            <p className="eyebrow mt-2 text-chalk-dim">{STAGE_LABEL[called.stage]} · Match #{called.code}</p>
          </>
        ) : waiting ? (
          <>
            <p className="eyebrow text-chalk-dim">You&apos;re in the queue</p>
            <p className="display mt-3 text-4xl text-chalk">Stay close</p>
            <p className="mt-4 text-sm text-chalk-dim">
              Next up: match #{waiting.code} vs {teamPlayers(oppOf(waiting)) || "TBD"}.
              Watch here — this page updates the moment you&apos;re called to a court.
            </p>
          </>
        ) : mine.length > 0 ? (
          <>
            <p className="eyebrow text-chalk-dim">No more matches scheduled</p>
            <p className="display mt-3 text-4xl text-chalk">
              {done.length > 0 ? "Great playing today" : "Waiting on the bracket"}
            </p>
            <p className="mt-4 text-sm text-chalk-dim">
              {done.length > 0
                ? "If the top 8 includes you, knockout matches appear here when they're seeded."
                : "The desk hasn't scheduled your matches yet. Hang tight."}
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow text-chalk-dim">Checked in</p>
            <p className="display mt-3 text-4xl text-chalk">Schedule coming</p>
            <p className="mt-4 text-sm text-chalk-dim">Matches appear here as soon as the desk generates the bracket.</p>
          </>
        )}
      </div>

      {/* standing + today's results */}
      {(myStanding || done.length > 0) && (
        <div className="border-t border-line px-5 py-5">
          {myStanding && myStanding.played > 0 && (
            <p className="eyebrow mb-4 text-chalk-dim">
              Standing: <span className="tnum font-bold text-chalk">#{myStanding.rank}</span>
              {" · "}<span className="tnum font-bold text-chalk">{myStanding.wins}–{myStanding.losses}</span>
              {" · "}diff <span className={`tnum font-bold ${myStanding.diff >= 0 ? "text-win" : "text-cq-bright"}`}>{formatDiff(myStanding.diff)}</span>
              {myStanding.qualified && <span className="ml-2 bg-cq px-1.5 py-0.5 text-[10px] text-chalk">Top 8</span>}
            </p>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              {done.map((m) => {
                const [a, b] = myScore(m);
                return (
                  <div key={m.id} className="flex items-center gap-3 text-sm">
                    <span className={`tnum w-14 shrink-0 font-mono font-bold ${a > b ? "text-win" : "text-cq-bright"}`}>
                      {a > b ? "W" : "L"} {a}–{b}
                    </span>
                    <span className="truncate text-chalk-dim">vs {teamPlayers(oppOf(m)) || "TBD"} · {STAGE_LABEL[m.stage]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function MePage() {
  const { player, checked, login, signup, logout } = usePlayer();
  const [career, setCareer] = useState<Career | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      setCareer(player ? await fetchPlayerCareer(player.id) : null);
    });
  }, [player]);

  if (!checked) return <main className="min-h-screen" />;
  if (!player) return <AuthGate login={login} signup={signup} />;

  const liveRun = career?.runs.find((r) => r.tournament.status === "live");
  const upcoming = career?.runs.filter((r) => ["registration", "draft"].includes(r.tournament.status)) ?? [];
  const winPct = career && career.played > 0 ? Math.round((career.wins / career.played) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-24 pt-24 sm:px-6 sm:pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2 text-cq-bright">Your day, live</p>
          <h1 className="display text-4xl text-chalk sm:text-5xl">{player.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/players/${player.id}`} className="eyebrow border border-line px-3.5 py-2.5 text-chalk-dim hover:text-chalk">
            Public profile
          </Link>
          <button onClick={logout} className="eyebrow border border-line px-3.5 py-2.5 text-chalk-dim hover:text-chalk">
            Sign out
          </button>
        </div>
      </div>

      {career === null ? (
        <p className="eyebrow animate-pulse-live py-16 text-center text-chalk-dim">Loading your day…</p>
      ) : (
        <div className="space-y-6">
          {liveRun ? (
            <LiveDay slug={liveRun.tournament.slug} myTeams={career.teams} />
          ) : (
            <section className="border border-dashed border-line px-6 py-12 text-center">
              <p className="display text-2xl text-chalk">No live tournament right now</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-chalk-dim">
                On tournament day this page becomes your compass: your court, your
                opponent, and when to walk over. It updates by itself.
              </p>
            </section>
          )}

          {upcoming.map((r) => (
            <section key={r.tournament.id} className="flex flex-wrap items-center justify-between gap-3 border border-line bg-carbon px-5 py-4">
              <div>
                <p className="font-bold uppercase tracking-wide text-chalk">{r.tournament.name}</p>
                <p className="eyebrow mt-1 text-chalk-dim">
                  You&apos;re registered ·{" "}
                  {r.tournament.starts_at
                    ? new Date(r.tournament.starts_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                    : "date TBA"}
                </p>
              </div>
              <Link href={`/tournaments/${r.tournament.slug}`} className="eyebrow text-cq-bright hover:text-chalk">Details →</Link>
            </section>
          ))}

          {/* career strip */}
          <section className="border border-line bg-carbon">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="eyebrow text-chalk-dim">Career</p>
              {career.championships > 0 && (
                <p className="eyebrow flex items-center gap-1.5 text-cq-bright">
                  <Trophy className="h-3.5 w-3.5" /> {career.championships}× champion
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 divide-x divide-line text-center">
              <div className="px-3 py-5">
                <p className="tnum font-mono text-2xl font-bold text-chalk">{career.wins}–{career.losses}</p>
                <p className="eyebrow mt-1.5 text-chalk-dim">Record</p>
              </div>
              <div className="px-3 py-5">
                <p className="tnum font-mono text-2xl font-bold text-chalk">{winPct}%</p>
                <p className="eyebrow mt-1.5 text-chalk-dim">Win rate</p>
              </div>
              <div className="px-3 py-5">
                <p className="tnum font-mono text-2xl font-bold text-chalk">{career.tournaments}</p>
                <p className="eyebrow mt-1.5 text-chalk-dim">Tournaments</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
