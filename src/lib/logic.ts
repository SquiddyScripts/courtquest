import type { Match, Stage, Standing, Team, Tournament } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
   Tournament engine: standings, bracket generation, scheduling, time estimates
──────────────────────────────────────────────────────────────────────────── */

export const QUALIFIER_COUNT = 8; // top 8 always advance to single elimination

/** Team display name: "23 · Aiman U, Kavin PM" convention from the rulebook. */
export function teamLabel(team: Team | undefined | null): string {
  if (!team) return "TBD";
  const players = [team.player1, team.player2].filter(Boolean).join(", ");
  return team.name ? team.name : players;
}

export function teamPlayers(team: Team | undefined | null): string {
  if (!team) return "";
  return [team.player1, team.player2].filter(Boolean).join(", ");
}

/** Compute qualification standings: W → avg point differential → points for. */
export function computeStandings(teams: Team[], matches: Match[]): Standing[] {
  const active = teams.filter((t) => !t.withdrawn);
  const byId = new Map(active.map((t) => [t.id, t]));
  const rows = new Map<string, Standing>();
  for (const t of active) {
    rows.set(t.id, {
      team: t, played: 0, wins: 0, losses: 0,
      pointsFor: 0, pointsAgainst: 0, diff: 0, rank: 0, qualified: false,
    });
  }
  for (const m of matches) {
    if (m.stage !== "qualification" || m.status !== "completed") continue;
    const a = m.team_a && rows.get(m.team_a);
    const b = m.team_b && rows.get(m.team_b);
    if (!a || !b || !byId.has(m.team_a!) || !byId.has(m.team_b!)) continue;
    a.played++; b.played++;
    a.pointsFor += m.score_a; a.pointsAgainst += m.score_b;
    b.pointsFor += m.score_b; b.pointsAgainst += m.score_a;
    if (m.score_a > m.score_b) { a.wins++; b.losses++; }
    else if (m.score_b > m.score_a) { b.wins++; a.losses++; }
  }
  const list = [...rows.values()];
  for (const r of list) {
    r.diff = r.played > 0 ? (r.pointsFor - r.pointsAgainst) / r.played : 0;
  }
  list.sort(
    (x, y) =>
      y.wins - x.wins ||
      y.diff - x.diff ||
      y.pointsFor - x.pointsFor ||
      x.team.number - y.team.number
  );
  list.forEach((r, i) => {
    r.rank = i + 1;
    r.qualified = i < QUALIFIER_COUNT;
  });
  return list;
}

/** IPL/NBA-style differential: "+0.18" / "-0.23". */
export function formatDiff(diff: number): string {
  const s = diff.toFixed(2);
  return diff >= 0 ? `+${s}` : s;
}

/* ── Qualification generator ──────────────────────────────────────────────────
   Circle-method round robin, truncated to `rounds` rounds. Guarantees:
   no rematches, every team plays exactly once per round (bye if odd),
   so nobody ever waits more than one round between games. */
export interface GeneratedMatch {
  tournament_id: string;
  code: number;
  stage: Stage;
  round: number;
  slot: number | null;
  court: number | null;
  team_a: string | null;
  team_b: string | null;
  status?: "upcoming" | "completed";
  note?: string;
}

export function generateQualification(
  tournament: Tournament,
  teams: Team[],
  opts?: { rounds?: number; startCode?: number }
): GeneratedMatch[] {
  const pool = teams.filter((t) => !t.withdrawn);
  const n = pool.length;
  if (n < 2) return [];
  const maxRounds = n % 2 === 0 ? n - 1 : n; // full round-robin length
  const rounds = Math.min(opts?.rounds ?? tournament.qual_rounds, maxRounds);
  const courts = Math.max(1, tournament.courts);

  // Circle method: fix seat 0, rotate the rest.
  const seats: (Team | null)[] = [...pool];
  if (n % 2 === 1) seats.push(null); // bye
  const half = seats.length / 2;
  const out: GeneratedMatch[] = [];
  let code = opts?.startCode ?? 1;

  for (let r = 0; r < rounds; r++) {
    const pairs: [Team, Team][] = [];
    for (let i = 0; i < half; i++) {
      const a = seats[i];
      const b = seats[seats.length - 1 - i];
      if (a && b) pairs.push(r % 2 === 0 ? [a, b] : [b, a]); // alternate side
    }
    pairs.forEach(([a, b], i) => {
      out.push({
        tournament_id: tournament.id,
        code: code++,
        stage: "qualification",
        round: r + 1,
        slot: null,
        // First `courts` matches of the round start on court; rest queue.
        court: i < courts ? i + 1 : null,
        team_a: a.id,
        team_b: b.id,
      });
    });
    // rotate all but seat 0
    seats.splice(1, 0, seats.pop()!);
  }
  return out;
}

/* ── Elimination generator ────────────────────────────────────────────────────
   Seeds top 8 into the classic bracket (1v8, 4v5, 3v6, 2v7) so that
   1-seed and 2-seed can only meet in the final. With fewer than 8
   qualifiers, byes resolve immediately: the lone team is advanced to the
   next round and the empty match is recorded as a completed bye. */
export function generateElimination(
  tournament: Tournament,
  standings: Standing[],
  startCode: number
): GeneratedMatch[] {
  const q = standings.filter((s) => s.qualified).slice(0, QUALIFIER_COUNT);
  if (q.length < 2) return [];
  const seed = (i: number) => q[i]?.team.id ?? null;
  const qfPairs: [string | null, string | null][] = [
    [seed(0), seed(7)],
    [seed(3), seed(4)],
    [seed(2), seed(5)],
    [seed(1), seed(6)],
  ];
  let code = startCode;
  const out: GeneratedMatch[] = [];
  let courtNo = 1;
  qfPairs.forEach(([a, b], i) => {
    const playable = !!a && !!b;
    out.push({
      tournament_id: tournament.id, code: code++, stage: "quarterfinal",
      round: 1, slot: i + 1,
      court: playable && courtNo <= tournament.courts ? courtNo++ : null,
      team_a: a, team_b: b,
    });
  });
  for (let i = 0; i < 2; i++) {
    out.push({
      tournament_id: tournament.id, code: code++, stage: "semifinal",
      round: 1, slot: i + 1, court: null, team_a: null, team_b: null,
    });
  }
  out.push({
    tournament_id: tournament.id, code: code++, stage: "final",
    round: 1, slot: 1, court: null, team_a: null, team_b: null,
  });

  // Resolve byes stage by stage. A side of a match is "permanently empty"
  // only when nothing can ever fill it: seeded empty at the quarterfinals,
  // or fed by a match that itself resolved as an empty bye. Sides fed by a
  // playable match are just TBD, not byes.
  const nextOf: Partial<Record<Stage, Stage>> = { quarterfinal: "semifinal", semifinal: "final" };
  const prevOf: Partial<Record<Stage, Stage>> = { semifinal: "quarterfinal", final: "semifinal" };
  const feeder = (m: GeneratedMatch, side: "a" | "b") =>
    out.find(
      (x) => x.stage === prevOf[m.stage] && x.slot === (side === "a" ? m.slot! * 2 - 1 : m.slot! * 2)
    );
  const emptyBye = (m: GeneratedMatch | undefined) =>
    !!m && m.note === "bye" && !m.team_a && !m.team_b;
  const sideIsDead = (m: GeneratedMatch, side: "a" | "b") => {
    if (side === "a" ? m.team_a : m.team_b) return false;
    const f = feeder(m, side);
    return m.stage === "quarterfinal" ? true : emptyBye(f);
  };

  for (const stage of ["quarterfinal", "semifinal"] as const) {
    for (const m of out.filter((x) => x.stage === stage)) {
      const deadA = sideIsDead(m, "a");
      const deadB = sideIsDead(m, "b");
      if (!deadA && !deadB) continue; // playable, or waiting on real winners
      m.status = "completed";
      m.note = "bye";
      m.court = null;
      const advancing = deadA ? m.team_b : m.team_a;
      if (advancing) {
        const next = out.find(
          (x) => x.stage === nextOf[stage] && x.slot === Math.ceil(m.slot! / 2)
        );
        if (next) {
          if (m.slot! % 2 === 1) next.team_a = advancing;
          else next.team_b = advancing;
        }
      }
    }
  }
  return out;
}

/* ── Time estimate ────────────────────────────────────────────────────────────
   ~12 min per game to 11 + 3 min changeover, courts run in parallel. */
export function estimateMinutes(matchCount: number, courts: number, perMatchMin = 15): number {
  if (matchCount === 0) return 0;
  return Math.ceil(matchCount / Math.max(1, courts)) * perMatchMin;
}

export function formatDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/* ── Match helpers ────────────────────────────────────────────────────────── */

export const STAGE_LABEL: Record<Stage, string> = {
  qualification: "Qualification",
  quarterfinal: "Quarterfinal",
  semifinal: "Semifinal",
  final: "Final",
};

export const STAGE_SHORT: Record<Stage, string> = {
  qualification: "Q",
  quarterfinal: "QF",
  semifinal: "SF",
  final: "F",
};

/** Is this game over under the rulebook? Qual: race to N. Elim: race to N, win by 2. */
export function isGameOver(
  stage: Stage, scoreA: number, scoreB: number,
  qualPoints: number, elimPoints: number
): boolean {
  const hi = Math.max(scoreA, scoreB);
  const margin = Math.abs(scoreA - scoreB);
  if (stage === "qualification") return hi >= qualPoints && margin >= 1;
  return hi >= elimPoints && margin >= 2;
}

/** "Next up" queue: upcoming matches whose teams are not currently on court. */
export function nextUpQueue(matches: Match[]): Match[] {
  const busy = new Set<string>();
  for (const m of matches) {
    if (m.status === "ongoing") {
      if (m.team_a) busy.add(m.team_a);
      if (m.team_b) busy.add(m.team_b);
    }
  }
  return matches
    .filter((m) => m.status === "upcoming" && m.team_a && m.team_b)
    .sort((a, b) => a.code - b.code)
    .filter((m) => !busy.has(m.team_a!) && !busy.has(m.team_b!));
}

export function matchCode(m: Match): string {
  return `${STAGE_SHORT[m.stage]}${m.stage === "qualification" ? m.code : m.slot ?? m.code}`;
}

export function formatClock(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
