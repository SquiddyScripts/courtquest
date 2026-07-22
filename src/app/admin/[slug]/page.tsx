"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Eye, EyeOff, Minus, Plus, Search, Trash2 } from "lucide-react";
import { adminWrite, supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import { useLiveTournament } from "@/lib/useLive";
import {
  computeStandings, estimateMinutes, formatDuration, generateElimination,
  generateQualification, nextUpQueue, teamPlayers,
} from "@/lib/logic";
import { Bracket } from "@/components/tournament/Bracket";
import { MatchCard } from "@/components/tournament/MatchCard";
import { ScoreConsole } from "@/components/tournament/ScoreConsole";
import { Standings } from "@/components/tournament/Standings";
import { LiveDot } from "@/components/ui";
import type { Match, Registration, Team, Tournament, TournamentStatus } from "@/lib/types";

const field =
  "w-full border border-line bg-court px-4 py-3 text-sm text-chalk placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none";

type Tab = "run" | "checkin" | "registrations" | "setup";

/* ────────────────────────────────────────────────────────────────────────────
   Lifecycle stepper: where the tournament is, and the one button that
   moves it forward. No hunting through settings to change status.
──────────────────────────────────────────────────────────────────────────── */
const STAGES: { key: TournamentStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "registration", label: "Sign-ups" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Done" },
];

function Stepper({
  status, busy, onAdvance,
}: {
  status: TournamentStatus;
  busy: boolean;
  onAdvance: (next: TournamentStatus) => void;
}) {
  const idx = STAGES.findIndex((s) => s.key === status);
  const NEXT: Record<TournamentStatus, { to: TournamentStatus; label: string } | null> = {
    draft: { to: "registration", label: "Open sign-ups" },
    registration: { to: "live", label: "Go live" },
    live: { to: "completed", label: "Finish tournament" },
    completed: null,
  };
  const next = NEXT[status];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-carbon px-5 py-4">
      <ol className="flex items-center gap-1 sm:gap-2">
        {STAGES.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1 sm:gap-2">
            <span
              className={`eyebrow flex items-center gap-1.5 px-2 py-1 ${
                i === idx
                  ? "bg-cq text-chalk"
                  : i < idx
                    ? "text-chalk-dim"
                    : "text-chalk-dim/40"
              }`}
            >
              {i < idx && <Check className="h-3 w-3" />}
              {i === idx && s.key === "live" && <LiveDot />}
              {s.label}
            </span>
            {i < STAGES.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-chalk-dim/30" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3">
        {status === "completed" && (
          <button
            onClick={() => onAdvance("live")}
            disabled={busy}
            className="eyebrow border border-line px-4 py-2.5 text-chalk-dim hover:text-chalk disabled:opacity-50"
          >
            Reopen as live
          </button>
        )}
        {next && (
          <button
            onClick={() => onAdvance(next.to)}
            disabled={busy}
            className="bg-cq px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
          >
            {next.label}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { me, checked } = useAdmin();
  const pin = me?.cred ?? null;
  const { tournament, teams, matches, refresh } = useLiveTournament(slug);
  const [tab, setTab] = useState<Tab | null>(null);
  const [openMatch, setOpenMatch] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [regs, setRegs] = useState<Registration[]>([]);

  const tournamentId = tournament?.id;
  useEffect(() => {
    if (pin && tournamentId) {
      supabase.rpc("admin_list_registrations", { pin, t_id: tournamentId })
        .then(({ data }) => setRegs((data as Registration[]) ?? []));
    }
  }, [pin, tournamentId]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const standings = useMemo(() => computeStandings(teams, matches), [teams, matches]);

  if (!checked) return <main className="min-h-screen" />;
  if (!pin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="display text-4xl text-chalk">Locked</h1>
        <Link href="/admin" className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright">
          Sign in
        </Link>
      </main>
    );
  }
  if (!tournament) {
    return <main className="flex min-h-screen items-center justify-center"><p className="eyebrow animate-pulse-live text-chalk-dim">Loading…</p></main>;
  }

  const act = async (action: string, payload: unknown) => {
    setBusy(true);
    try {
      await adminWrite(pin, action, payload);
    } finally {
      setBusy(false);
    }
  };

  const pending = regs.filter((r) => !r.processed);
  const activeTeams = teams.filter((t) => !t.withdrawn);
  const checkedIn = activeTeams.filter((t) => t.checked_in);

  // The tab that matters for the current stage, unless the admin picked one.
  const DEFAULT_TAB: Record<TournamentStatus, Tab> = {
    draft: "setup", registration: "registrations", live: "run", completed: "run",
  };
  const activeTab: Tab = tab ?? DEFAULT_TAB[tournament.status];

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "run", label: "Run · Bracket" },
    { key: "checkin", label: "Check-in", badge: activeTeams.length - checkedIn.length || undefined },
    { key: "registrations", label: "Registrations", badge: pending.length || undefined },
    { key: "setup", label: "Details" },
  ];

  const openMatchObj = openMatch ? matches.find((m) => m.id === openMatch) : null;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-24 sm:px-6 sm:pt-32">
      {openMatchObj ? (
        <ScoreConsole
          tournament={tournament}
          match={openMatchObj}
          teams={teamMap}
          code={pin}
          onExit={() => setOpenMatch(null)}
        />
      ) : (
        <>
          {/* header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-cq-bright">
                Tournament desk · <Link href="/admin" className="underline hover:text-chalk">all events</Link>
                {" "}· <Link href={`/tournaments/${slug}`} className="underline hover:text-chalk">public page</Link>
              </p>
              <h1 className="display text-3xl text-chalk sm:text-5xl">{tournament.name}</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="eyebrow text-chalk-dim">Ref code</p>
                <p className="font-mono text-lg font-bold text-cq-bright">{tournament.ref_code}</p>
              </div>
              <div className="text-right">
                <p className="eyebrow text-chalk-dim">Loaner balls out</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => act("balls_delta", { tournament_id: tournament.id, delta: -1 })} className="border border-line p-1 text-chalk-dim hover:text-chalk" aria-label="Ball returned"><Minus className="h-3.5 w-3.5" /></button>
                  <p className="tnum w-7 text-center font-mono text-lg font-bold text-chalk">{tournament.balls_out}</p>
                  <button onClick={() => act("balls_delta", { tournament_id: tournament.id, delta: 1 })} className="border border-line p-1 text-chalk-dim hover:text-chalk" aria-label="Ball taken out"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          </div>

          <Stepper
            status={tournament.status}
            busy={busy}
            onAdvance={async (next) => {
              await act("tournament_update", {
                id: tournament.id,
                patch: { status: next, ...(next === "live" ? { registration_open: false } : {}) },
              });
              await refresh();
              setTab(null); // follow the lifecycle to the right tab
            }}
          />

          {/* tabs */}
          <div className="mb-10 mt-8 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`eyebrow relative flex shrink-0 items-center gap-2 px-4 py-3.5 transition-colors ${activeTab === t.key ? "text-chalk" : "text-chalk-dim hover:text-chalk"}`}
              >
                {t.label}
                {t.badge != null && (
                  <span className="tnum bg-cq px-1.5 font-mono text-[10px] text-chalk">{t.badge}</span>
                )}
                {activeTab === t.key && <span className="absolute inset-x-3 bottom-0 h-[3px] bg-cq" aria-hidden />}
              </button>
            ))}
          </div>

          {activeTab === "run" && (
            <RunTab
              tournament={tournament} teams={teams} matches={matches}
              standings={standings} teamMap={teamMap} busy={busy}
              act={act} refresh={refresh} onOpenMatch={setOpenMatch}
              goToCheckin={() => setTab("checkin")}
            />
          )}

          {activeTab === "checkin" && (
            <CheckinTab teams={teams} tournament={tournament} busy={busy} act={act} />
          )}

          {activeTab === "registrations" && (
            <RegistrationsTab
              regs={regs} setRegs={setRegs} tournament={tournament} busy={busy} act={act}
            />
          )}

          {activeTab === "setup" && (
            <>
              <SettingsForm
                key={tournament.id + tournament.status}
                tournament={tournament}
                busy={busy}
                onSave={async (patch) => { await act("tournament_update", { id: tournament.id, patch }); await refresh(); }}
              />
              <VisibilityAndDelete
                tournament={tournament}
                busy={busy}
                onToggleHidden={async () => {
                  await act("tournament_update", { id: tournament.id, patch: { hidden: !tournament.hidden } });
                  await refresh();
                }}
                onDelete={async () => {
                  await act("tournament_delete", { id: tournament.id, confirm_slug: tournament.slug });
                  router.push("/admin");
                }}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   RUN — bracket generation, bracket view, standings, court flow. One place.
──────────────────────────────────────────────────────────────────────────── */
function RunTab({
  tournament, teams, matches, standings, teamMap,
  busy, act, refresh, onOpenMatch, goToCheckin,
}: {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  standings: ReturnType<typeof computeStandings>;
  teamMap: Map<string, Team>;
  busy: boolean;
  act: (action: string, payload: unknown) => Promise<void>;
  refresh: () => Promise<void>;
  onOpenMatch: (id: string) => void;
  goToCheckin: () => void;
}) {
  const [showAll, setShowAll] = useState<"ongoing" | "upcoming" | "completed">("ongoing");
  const qual = matches.filter((m) => m.stage === "qualification");
  const elim = matches.filter((m) => m.stage !== "qualification");
  const qualDone = qual.length > 0 && qual.every((m) => m.status === "completed");
  const queue = nextUpQueue(matches);
  const checkedIn = teams.filter((t) => !t.withdrawn && t.checked_in);

  async function generateQual(rounds: number) {
    const gen = generateQualification(tournament, checkedIn, { rounds })
      .map((m) => (m.round > 1 ? { ...m, court: null } : m));
    if (gen.length === 0) return;
    await act("matches_delete_stage", { tournament_id: tournament.id, stage: "qualification" });
    await act("match_insert_bulk", { matches: gen });
    await act("tournament_update", { id: tournament.id, patch: { qual_rounds: rounds, status: "live" } });
    await refresh();
  }

  async function generateElim() {
    const startCode = Math.max(0, ...matches.map((m) => m.code)) + 1;
    const gen = generateElimination(tournament, standings, startCode);
    if (gen.length === 0) return;
    for (const stage of ["quarterfinal", "semifinal", "final"]) {
      await act("matches_delete_stage", { tournament_id: tournament.id, stage });
    }
    await act("match_insert_bulk", { matches: gen });
    await refresh();
  }

  /* Nothing generated yet: one clear starting card. */
  if (matches.length === 0) {
    return (
      <div className="mx-auto max-w-2xl border border-line bg-carbon p-8 text-center sm:p-12">
        <p className="eyebrow text-cq-bright">Bracket generation</p>
        <h2 className="display mt-3 text-4xl text-chalk">Build the schedule</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-chalk-dim">
          {checkedIn.length < 2 ? (
            <>Check teams in first, then generate. {" "}
              <button onClick={goToCheckin} className="text-cq-bright underline">Go to check-in</button>
            </>
          ) : (
            <>Every checked-in team plays the same number of games, no rematches,
            nobody sits more than one match. Top 8 then advance to the knockout bracket.</>
          )}
        </p>
        <div className="mt-6 flex justify-center">
          <GenForm
            teams={checkedIn.length} courts={tournament.courts}
            defaultRounds={tournament.qual_rounds} busy={busy}
            onGenerate={generateQual} label="Generate & go live"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* progress + next step */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-carbon px-5 py-4">
        <p className="text-sm text-chalk-dim">
          Qualification:{" "}
          <span className="tnum font-mono font-bold text-chalk">
            {qual.filter((m) => m.status === "completed").length}/{qual.length}
          </span>{" "}
          played
          {elim.length > 0 && (
            <>
              {" "}· Knockout:{" "}
              <span className="tnum font-mono font-bold text-chalk">
                {elim.filter((m) => m.status === "completed").length}/{elim.length}
              </span>
            </>
          )}
        </p>
        {elim.length === 0 && (
          <button
            onClick={generateElim}
            disabled={busy || standings.filter((s) => s.played > 0).length < 2}
            className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-chalk disabled:opacity-40 ${
              qualDone ? "bg-cq hover:bg-cq-bright" : "border border-line hover:border-chalk/40"
            }`}
          >
            Seed top 8 → knockout
          </button>
        )}
      </div>

      {/* bracket view */}
      <section>
        <p className="eyebrow baseline mb-6 pb-3 text-chalk-dim">Bracket</p>
        <Bracket matches={matches} teams={teamMap} />
      </section>

      {/* courts + queue */}
      <section>
        <p className="eyebrow baseline mb-6 pb-3 text-chalk-dim">Courts</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: tournament.courts }, (_, i) => i + 1).map((c) => {
            const onCourt = matches.find((m) => m.status === "ongoing" && m.court === c);
            return (
              <div key={c} className={`border p-4 ${onCourt ? "border-cq/60 bg-cq/[0.07]" : "border-line bg-carbon"}`}>
                <p className="eyebrow flex items-center justify-between text-chalk-dim">
                  Court {c} {onCourt && <LiveDot />}
                </p>
                {onCourt ? (
                  <button onClick={() => onOpenMatch(onCourt.id)} className="mt-2 block w-full text-left">
                    <p className="font-mono text-xs text-chalk-dim">#{onCourt.code}</p>
                    <p className="truncate text-sm font-bold text-chalk">
                      {teamPlayers(teamMap.get(onCourt.team_a ?? ""))}{" "}
                      <span className="tnum">{onCourt.score_a}–{onCourt.score_b}</span>{" "}
                      {teamPlayers(teamMap.get(onCourt.team_b ?? ""))}
                    </p>
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-chalk-dim/60">Open</p>
                )}
              </div>
            );
          })}
        </div>

        {queue.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow mb-3 text-chalk-dim">Next up (rested teams first). Tap a number to assign the court.</p>
            <div className="grid gap-2">
              {queue.slice(0, 6).map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 border border-line bg-carbon px-4 py-3">
                  <span className="font-mono text-xs text-chalk-dim">#{m.code}</span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-chalk">
                    {teamPlayers(teamMap.get(m.team_a ?? ""))} <span className="text-chalk-dim">vs</span> {teamPlayers(teamMap.get(m.team_b ?? ""))}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: tournament.courts }, (_, i) => i + 1).map((c) => (
                      <button
                        key={c}
                        onClick={() => act("match_update", { id: m.id, patch: { court: c } })}
                        className={`tnum h-8 w-8 border font-mono text-xs font-bold transition-colors ${m.court === c ? "border-cq bg-cq text-chalk" : "border-line text-chalk-dim hover:border-chalk/50 hover:text-chalk"}`}
                        aria-label={`Assign match ${m.code} to court ${c}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* standings */}
      {standings.some((s) => s.played > 0) && (
        <section>
          <p className="eyebrow baseline mb-6 pb-3 text-chalk-dim">Standings</p>
          <Standings standings={standings} />
        </section>
      )}

      {/* all matches */}
      <section>
        <p className="eyebrow baseline mb-6 pb-3 text-chalk-dim">
          All matches. Tap one to score or fix it.
        </p>
        <div className="mb-4 flex gap-1.5">
          {(["ongoing", "upcoming", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShowAll(s)}
              className={`eyebrow px-3.5 py-2.5 transition-colors ${showAll === s ? "bg-chalk text-court" : "border border-line text-chalk-dim hover:text-chalk"}`}
            >
              {s} ({matches.filter((m) => m.status === s).length})
            </button>
          ))}
        </div>
        {matches.filter((m) => m.status === showAll).length === 0 ? (
          <p className="border border-dashed border-line px-6 py-10 text-center text-sm text-chalk-dim">No {showAll} matches.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.filter((m) => m.status === showAll).map((m) => (
              <MatchCard key={m.id} match={m} teams={teamMap} onClick={() => onOpenMatch(m.id)} />
            ))}
          </div>
        )}
      </section>

      {/* manual matchup: late arrivals, make-up games, whatever the day needs */}
      <section className="border border-line bg-carbon p-5 sm:p-6">
        <p className="eyebrow text-cq-bright">Manual matchup</p>
        <p className="mt-2 max-w-lg text-sm text-chalk-dim">
          Pair any two teams for an extra qualification game. Handy for players
          who arrive after the schedule was generated.
        </p>
        <ManualMatchup
          teams={teams.filter((t) => !t.withdrawn && t.checked_in)}
          courts={tournament.courts}
          busy={busy}
          onCreate={async (teamA, teamB, court) => {
            const nextCode = Math.max(0, ...matches.map((m) => m.code)) + 1;
            const maxRound = Math.max(1, ...qual.map((m) => m.round));
            await act("match_insert_bulk", {
              matches: [{
                tournament_id: tournament.id, code: nextCode, stage: "qualification",
                round: maxRound, slot: null, court, team_a: teamA, team_b: teamB,
              }],
            });
          }}
        />
      </section>

      {/* danger zone */}
      <details className="border border-line bg-carbon p-5">
        <summary className="eyebrow cursor-pointer text-chalk-dim hover:text-cq-bright">Regenerate qualification (danger)</summary>
        <p className="mt-3 max-w-lg text-sm text-chalk-dim">
          Deletes every qualification match and score, then rebuilds the schedule
          for the {checkedIn.length} checked-in teams. Only for before play starts.
        </p>
        <GenForm
          teams={checkedIn.length} courts={tournament.courts}
          defaultRounds={tournament.qual_rounds} busy={busy}
          onGenerate={generateQual} label="Regenerate"
        />
      </details>
    </div>
  );
}

/* ── Check-in ────────────────────────────────────────────────────────────── */
function CheckinTab({
  teams, tournament, busy, act,
}: {
  teams: Team[];
  tournament: Tournament;
  busy: boolean;
  act: (action: string, payload: unknown) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const activeTeams = teams.filter((t) => !t.withdrawn);
  const checkedIn = activeTeams.filter((t) => t.checked_in);
  const paid = activeTeams.filter((t) => t.paid);
  const filtered = teams.filter((t) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [t.player1, t.player2, t.name, String(t.number)].filter(Boolean).join(" ").toLowerCase().includes(needle);
  });

  async function addTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p1 = String(fd.get("player1") ?? "").trim();
    if (!p1) return;
    await act("team_insert", {
      tournament_id: tournament.id,
      player1: p1,
      player2: String(fd.get("player2") ?? "").trim() || null,
      checked_in: true,
      paid: fd.get("paid") === "on",
    });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        {[
          { v: `${checkedIn.length}/${activeTeams.length}`, l: "Checked in" },
          { v: `${paid.length}/${activeTeams.length}`, l: "Paid (cash)" },
          { v: String(activeTeams.length), l: "Teams" },
        ].map((s) => (
          <div key={s.l} className="border border-line bg-carbon px-4 py-3">
            <p className="tnum font-mono text-xl font-bold text-chalk">{s.v}</p>
            <p className="eyebrow mt-1 text-chalk-dim">{s.l}</p>
          </div>
        ))}
      </div>

      <form onSubmit={addTeam} className="grid gap-3 border border-line bg-carbon p-5 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input name="player1" required placeholder={tournament.format === "singles" ? "Player name" : "Player 1"} className={field} />
        {tournament.format === "doubles"
          ? <input name="player2" placeholder="Player 2" className={field} />
          : <div className="hidden sm:block" />}
        <label className="flex items-center gap-2 px-2 text-sm text-chalk-dim">
          <input type="checkbox" name="paid" className="h-4 w-4 accent-[#e22028]" /> Paid
        </label>
        <button disabled={busy} className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50">
          Add walk-up
        </button>
      </form>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-dim/60" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players…" className={`${field} pl-10`} />
      </div>

      <div className="grid gap-2">
        {filtered.map((t) => (
          <div key={t.id} className={`flex flex-wrap items-center gap-3 border border-line bg-carbon px-4 py-3 ${t.withdrawn ? "opacity-40" : ""}`}>
            <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center border border-line font-mono text-sm font-bold text-chalk">{t.number}</span>
            <p className={`min-w-0 flex-1 truncate font-semibold text-chalk ${t.withdrawn ? "line-through" : ""}`}>{teamPlayers(t)}</p>
            <button
              onClick={() => act("team_update", { id: t.id, patch: { paid: !t.paid } })}
              className={`eyebrow border px-3 py-2 transition-colors ${t.paid ? "border-win/50 text-win" : "border-line text-chalk-dim hover:text-chalk"}`}
            >
              {t.paid ? "Paid ✓" : "Owes cash"}
            </button>
            <button
              onClick={() => act("team_update", { id: t.id, patch: { checked_in: !t.checked_in } })}
              className={`eyebrow border px-3 py-2 transition-colors ${t.checked_in ? "bg-chalk text-court" : "border-line text-chalk-dim hover:text-chalk"}`}
            >
              {t.checked_in ? "Checked in ✓" : "Check in"}
            </button>
            <button
              onClick={() => act("team_update", { id: t.id, patch: { withdrawn: !t.withdrawn } })}
              className="eyebrow border border-line px-3 py-2 text-chalk-dim transition-colors hover:border-cq/60 hover:text-cq-bright"
            >
              {t.withdrawn ? "Reinstate" : "Withdraw"}
            </button>
          </div>
        ))}
        {teams.length === 0 && (
          <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-chalk-dim">
            No teams yet. Approve registrations or add walk-ups above.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Registrations ───────────────────────────────────────────────────────── */
function RegistrationsTab({
  regs, setRegs, tournament, busy, act,
}: {
  regs: Registration[];
  setRegs: React.Dispatch<React.SetStateAction<Registration[]>>;
  tournament: Tournament;
  busy: boolean;
  act: (action: string, payload: unknown) => Promise<void>;
}) {
  const pending = regs.filter((r) => !r.processed);
  const processed = regs.filter((r) => r.processed);

  const duo = regs.filter((r) => (r.registration_type ?? (r.player2 ? "duo" : "individual")) === "duo").length;
  const individual = regs.filter((r) => (r.registration_type ?? (r.player2 ? "duo" : "individual")) === "individual").length;
  const cash = regs.filter((r) => r.payment_method === "cash").length;
  const online = regs.filter((r) => r.payment_method === "online").length;
  const paidN = regs.filter((r) => r.paid).length;
  const expected = regs.reduce((s, r) => s + (r.fee_cents ?? 0), 0);
  const collected = regs.filter((r) => r.paid).reduce((s, r) => s + (r.fee_cents ?? 0), 0);
  const money = (c: number) => `$${(c / 100).toFixed(0)}`;

  const row = (r: Registration, actions: boolean) => {
    const kind = r.registration_type ?? (r.player2 ? "duo" : "individual");
    const method = r.payment_method ?? "unpaid";
    return (
      <div key={r.id} className="flex flex-wrap items-center gap-3 border border-line bg-carbon px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-chalk">
            {r.player1}{r.player2 ? ` & ${r.player2}` : ""}
            {r.volunteer && <span className="eyebrow ml-2 text-win">wants to ref</span>}
            {r.preferred_partner && !r.player2 && (
              <span className="eyebrow ml-2 text-chalk-dim">prefers {r.preferred_partner}</span>
            )}
          </p>
          <p className="font-mono text-xs text-chalk-dim">
            {r.email}{r.email2 ? `, ${r.email2}` : ""}
            {r.phone ? ` · ${r.phone}` : ""}
            {" · "}{kind} · {method}{r.fee_cents ? ` · ${money(r.fee_cents)}` : ""}
            {r.paid ? " · paid" : " · owes"}
            {" · "}{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                await act("registration_update", {
                  id: r.id,
                  patch: { paid: !r.paid, paid_at: !r.paid ? new Date().toISOString() : null },
                });
                setRegs((prev) => prev.map((x) => x.id === r.id ? { ...x, paid: !r.paid } : x));
              }}
              disabled={busy}
              className={`eyebrow border px-3 py-2 disabled:opacity-50 ${r.paid ? "border-win/40 text-win" : "border-line text-chalk-dim hover:text-chalk"}`}
            >
              {r.paid ? "Paid ✓" : "Mark paid"}
            </button>
            <button
              onClick={async () => {
                await act("team_insert", {
                  tournament_id: tournament.id,
                  player1: r.player1,
                  player2: r.player2,
                  email: r.email,
                  email2: r.email2,
                  registration_id: r.id,
                  paid: !!r.paid || r.payment_method === "online",
                });
                await act("registration_update", { id: r.id, patch: { processed: true } });
                setRegs((prev) => prev.map((x) => x.id === r.id ? { ...x, processed: true } : x));
              }}
              disabled={busy}
              className="bg-cq px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
            >
              Approve as team
            </button>
          </div>
        ) : (
          <span className="eyebrow text-chalk-dim">Team created ✓</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Sign-ups", v: String(regs.length), s: `${duo} team · ${individual} solo` },
          { l: "Pay method", v: `${online}/${cash}`, s: "online / cash" },
          { l: "Expected", v: money(expected), s: `${paidN} marked paid` },
          { l: "Collected", v: money(collected), s: `${money(expected - collected)} owed` },
        ].map((c) => (
          <div key={c.l} className="border border-line bg-carbon px-4 py-4">
            <p className="eyebrow text-chalk-dim">{c.l}</p>
            <p className="tnum mt-2 font-mono text-2xl font-bold text-chalk">{c.v}</p>
            <p className="mt-1 text-xs text-chalk-dim">{c.s}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-chalk-dim">
        Full money view across events:{" "}
        <Link href="/admin/money" className="text-cq-bright hover:text-chalk">Admin → Money</Link>
      </p>

      <section>
        <p className="eyebrow baseline mb-5 pb-3 text-chalk-dim">
          Waiting for approval <span className="tnum ml-1 bg-cq px-1.5 font-mono text-[10px] text-chalk">{pending.length}</span>
        </p>
        {pending.length === 0 ? (
          <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-chalk-dim">
            All caught up. New sign-ups from the public page appear here with contact info (kept private).
          </p>
        ) : (
          <div className="grid gap-2">{pending.map((r) => row(r, true))}</div>
        )}
      </section>

      {processed.length > 0 && (
        <details>
          <summary className="eyebrow cursor-pointer text-chalk-dim hover:text-chalk">
            Approved ({processed.length})
          </summary>
          <div className="mt-4 grid gap-2 opacity-70">{processed.map((r) => row(r, false))}</div>
        </details>
      )}
    </div>
  );
}

/* ── Visibility + delete ─────────────────────────────────────────────────── */
function VisibilityAndDelete({
  tournament, busy, onToggleHidden, onDelete,
}: {
  tournament: Tournament;
  busy: boolean;
  onToggleHidden: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  const matches = confirm.trim() === tournament.slug;

  return (
    <div className="mt-14 max-w-3xl space-y-3">
      {/* hide */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-carbon p-5">
        <div className="flex items-start gap-3">
          {tournament.hidden
            ? <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-chalk-dim" aria-hidden />
            : <Eye className="mt-0.5 h-4 w-4 shrink-0 text-chalk-dim" aria-hidden />}
          <div>
            <p className="font-bold uppercase tracking-wide text-chalk">
              {tournament.hidden ? "Hidden from the website" : "Listed on the website"}
            </p>
            <p className="mt-1 max-w-md text-sm text-chalk-dim">
              {tournament.hidden
                ? "It doesn't appear on the tournaments page, the ticker, or the nav. Anyone with the direct link can still open it, so you can share it with the team."
                : "It appears on the tournaments page like any other event."}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleHidden}
          disabled={busy}
          className="eyebrow shrink-0 border border-line px-4 py-2.5 text-chalk-dim transition-colors hover:border-chalk/40 hover:text-chalk disabled:opacity-50"
        >
          {tournament.hidden ? "Show on website" : "Hide from website"}
        </button>
      </div>

      {/* delete */}
      <div className="border border-line bg-carbon p-5">
        {!open ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-chalk-dim" aria-hidden />
              <div>
                <p className="font-bold uppercase tracking-wide text-chalk">Delete this tournament</p>
                <p className="mt-1 max-w-md text-sm text-chalk-dim">
                  Erases the event and every team, match, and score with it. If you
                  only want it off the site, hide it instead.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="eyebrow shrink-0 border border-line px-4 py-2.5 text-chalk-dim transition-colors hover:border-cq hover:text-cq-bright"
            >
              Delete
            </button>
          </div>
        ) : (
          <div>
            <p className="font-bold uppercase tracking-wide text-cq-bright">
              This cannot be undone
            </p>
            <p className="mt-2 max-w-lg text-sm text-chalk-dim">
              Type <span className="font-mono font-bold text-chalk">{tournament.slug}</span> to
              permanently delete this tournament and all of its data.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={tournament.slug}
                autoComplete="off"
                className={`${field} max-w-xs font-mono`}
              />
              <button
                onClick={onDelete}
                disabled={!matches || busy}
                className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk transition-colors hover:bg-cq-bright disabled:opacity-30"
              >
                {busy ? "Deleting…" : "Delete forever"}
              </button>
              <button
                onClick={() => { setOpen(false); setConfirm(""); }}
                className="eyebrow border border-line px-4 py-3 text-chalk-dim hover:text-chalk"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Manual matchup builder ──────────────────────────────────────────────── */
function ManualMatchup({
  teams, courts, busy, onCreate,
}: {
  teams: Team[];
  courts: number;
  busy: boolean;
  onCreate: (teamA: string, teamB: string, court: number | null) => Promise<void>;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [court, setCourt] = useState("");
  const [made, setMade] = useState(false);
  const sel = "border border-line bg-court px-3 py-3 text-sm text-chalk focus:border-chalk/40 focus:outline-none";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <select value={a} onChange={(e) => { setA(e.target.value); setMade(false); }} className={`${sel} min-w-44 flex-1`} aria-label="Team A">
        <option value="">Team A…</option>
        {teams.filter((t) => t.id !== b).map((t) => (
          <option key={t.id} value={t.id}>{t.number} · {teamPlayers(t)}</option>
        ))}
      </select>
      <span className="eyebrow text-chalk-dim">vs</span>
      <select value={b} onChange={(e) => { setB(e.target.value); setMade(false); }} className={`${sel} min-w-44 flex-1`} aria-label="Team B">
        <option value="">Team B…</option>
        {teams.filter((t) => t.id !== a).map((t) => (
          <option key={t.id} value={t.id}>{t.number} · {teamPlayers(t)}</option>
        ))}
      </select>
      <select value={court} onChange={(e) => setCourt(e.target.value)} className={sel} aria-label="Court">
        <option value="">Queue (no court)</option>
        {Array.from({ length: courts }, (_, i) => i + 1).map((c) => (
          <option key={c} value={c}>Court {c}</option>
        ))}
      </select>
      <button
        onClick={async () => {
          await onCreate(a, b, court ? Number(court) : null);
          setA(""); setB(""); setCourt(""); setMade(true);
        }}
        disabled={busy || !a || !b}
        className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-40"
      >
        Create matchup
      </button>
      {made && <span className="eyebrow text-win">Created ✓</span>}
    </div>
  );
}

/* ── Generation form with the time estimate ──────────────────────────────── */
function GenForm({
  teams, courts, defaultRounds, busy, onGenerate, label,
}: {
  teams: number; courts: number; defaultRounds: number; busy: boolean;
  onGenerate: (rounds: number) => void; label: string;
}) {
  // Kept as a string so the field can be cleared while typing a new number.
  const [rounds, setRounds] = useState(String(defaultRounds));
  const parsed = Math.min(12, Math.floor(Number(rounds)));
  const valid = Number.isFinite(parsed) && parsed >= 1;
  const matchCount = valid ? Math.floor((teams * parsed) / 2) : 0;
  const est = estimateMinutes(matchCount, courts);
  return (
    <div className="mt-5 flex flex-wrap items-end justify-center gap-4">
      <label>
        <span className="eyebrow mb-2 block text-chalk-dim">Games per team</span>
        <input
          type="number" min={1} max={12} value={rounds}
          onChange={(e) => setRounds(e.target.value)}
          className="w-28 border border-line bg-court px-4 py-3 font-mono text-lg font-bold text-chalk focus:border-chalk/40 focus:outline-none"
        />
      </label>
      <div className="pb-1 text-left">
        <p className="eyebrow text-chalk-dim">Estimate</p>
        <p className="tnum mt-1 font-mono text-sm text-chalk">
          {valid ? `${matchCount} matches · ~${formatDuration(est)} on ${courts} courts` : "Enter games per team"}
        </p>
      </div>
      <button
        onClick={() => onGenerate(parsed)}
        disabled={busy || teams < 2 || !valid}
        className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-40"
      >
        {busy ? "Working…" : label}
      </button>
    </div>
  );
}

/* ── Details / settings ──────────────────────────────────────────────────── */
function SettingsForm({
  tournament, busy, onSave,
}: {
  tournament: Tournament;
  busy: boolean;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await onSave({
      name: String(fd.get("name")),
      tagline: String(fd.get("tagline")) || null,
      location: String(fd.get("location")) || null,
      starts_at: fd.get("starts_at") ? new Date(String(fd.get("starts_at"))).toISOString() : null,
      format: String(fd.get("format")),
      courts: Number(fd.get("courts")),
      qual_points: Number(fd.get("qual_points")),
      elim_points: Number(fd.get("elim_points")),
      ref_code: String(fd.get("ref_code")),
      charity: String(fd.get("charity")) || null,
      raised_cents: Math.round(Number(fd.get("raised") || 0) * 100),
      participants: fd.get("participants") ? Number(fd.get("participants")) : null,
      registration_open: fd.get("registration_open") === "on",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  const dtLocal = tournament.starts_at
    ? new Date(new Date(tournament.starts_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="eyebrow mb-2 block text-chalk-dim">Name</label>
        <input name="name" defaultValue={tournament.name} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label className="eyebrow mb-2 block text-chalk-dim">Tagline (shown on the public page)</label>
        <input name="tagline" defaultValue={tournament.tagline ?? ""} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Format</label>
        <select name="format" defaultValue={tournament.format} className={field}>
          <option value="doubles">Doubles (teams of 2)</option>
          <option value="singles">Singles</option>
        </select>
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Date & time</label>
        <input name="starts_at" type="datetime-local" defaultValue={dtLocal} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Location</label>
        <input name="location" defaultValue={tournament.location ?? ""} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Raising money for</label>
        <input name="charity" defaultValue={tournament.charity ?? ""} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Courts</label>
        <input name="courts" type="number" min={1} max={12} defaultValue={tournament.courts} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Referee code</label>
        <input name="ref_code" defaultValue={tournament.ref_code} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Qualification: points to win</label>
        <input name="qual_points" type="number" min={5} max={21} defaultValue={tournament.qual_points} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Knockout: points to win (win by 2)</label>
        <input name="elim_points" type="number" min={5} max={21} defaultValue={tournament.elim_points} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Raised so far ($)</label>
        <input name="raised" type="number" min={0} step="0.01" defaultValue={(tournament.raised_cents / 100).toString()} className={field} />
      </div>
      <div>
        <label className="eyebrow mb-2 block text-chalk-dim">Total players (for past events)</label>
        <input name="participants" type="number" min={0} defaultValue={tournament.participants ?? ""} className={field} />
      </div>
      <label className="flex items-center gap-3 text-sm text-chalk-dim sm:col-span-2">
        <input type="checkbox" name="registration_open" defaultChecked={tournament.registration_open} className="h-4 w-4 accent-[#e22028]" />
        Public registration form is open
      </label>
      <div className="sm:col-span-2">
        <button disabled={busy} className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50">
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save details"}
        </button>
      </div>
    </form>
  );
}
