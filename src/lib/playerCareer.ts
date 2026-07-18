import { supabase } from "./supabase";
import type { Match, Team, Tournament } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
   Career assembly: everything a player profile shows, computed from the
   public teams/matches data linked to a player id.
──────────────────────────────────────────────────────────────────────────── */

export interface CareerMatch {
  match: Match;
  tournament: Tournament;
  team: Team;
  opponent: Team | null;
  /** Score from the player's perspective: [theirs, opponents]. */
  score: [number, number];
  won: boolean;
  isBye: boolean;
}

export interface TournamentRun {
  tournament: Tournament;
  team: Team;
  wins: number;
  losses: number;
  champion: boolean;
  matches: CareerMatch[];
}

export interface Career {
  teams: Team[];
  runs: TournamentRun[];
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  championships: number;
  tournaments: number;
}

export async function fetchPlayerCareer(playerId: string): Promise<Career> {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .or(`p1_id.eq.${playerId},p2_id.eq.${playerId}`);
  const myTeams = (teams ?? []) as Team[];
  if (myTeams.length === 0) {
    return { teams: [], runs: [], played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, championships: 0, tournaments: 0 };
  }

  const tournamentIds = [...new Set(myTeams.map((t) => t.tournament_id))];
  const [{ data: tournaments }, { data: matches }, { data: allTeams }] = await Promise.all([
    supabase.from("tournaments").select("*").in("id", tournamentIds),
    supabase.from("matches").select("*").in("tournament_id", tournamentIds).order("code"),
    supabase.from("teams").select("*").in("tournament_id", tournamentIds),
  ]);
  const tMap = new Map(((tournaments ?? []) as Tournament[]).map((t) => [t.id, t]));
  const teamMap = new Map(((allTeams ?? []) as Team[]).map((t) => [t.id, t]));

  const runs: TournamentRun[] = [];
  for (const team of myTeams) {
    const tournament = tMap.get(team.tournament_id);
    if (!tournament) continue;
    const ms = ((matches ?? []) as Match[]).filter(
      (m) => m.team_a === team.id || m.team_b === team.id
    );
    const careerMatches: CareerMatch[] = ms.map((m) => {
      const iAmA = m.team_a === team.id;
      const oppId = iAmA ? m.team_b : m.team_a;
      const score: [number, number] = iAmA ? [m.score_a, m.score_b] : [m.score_b, m.score_a];
      return {
        match: m,
        tournament,
        team,
        opponent: oppId ? teamMap.get(oppId) ?? null : null,
        score,
        won: m.status === "completed" && (m.note === "bye" ? true : score[0] > score[1]),
        isBye: m.note === "bye",
      };
    });
    const done = careerMatches.filter((c) => c.match.status === "completed" && !c.isBye);
    const finalWin = careerMatches.some(
      (c) => c.match.stage === "final" && c.match.status === "completed" && c.won
    );
    runs.push({
      tournament,
      team,
      wins: done.filter((c) => c.won).length,
      losses: done.filter((c) => !c.won).length,
      champion: finalWin,
      matches: careerMatches,
    });
  }
  runs.sort((a, b) =>
    (b.tournament.starts_at ?? b.tournament.created_at).localeCompare(a.tournament.starts_at ?? a.tournament.created_at)
  );

  const doneAll = runs.flatMap((r) => r.matches).filter((c) => c.match.status === "completed" && !c.isBye);
  return {
    teams: myTeams,
    runs,
    played: doneAll.length,
    wins: doneAll.filter((c) => c.won).length,
    losses: doneAll.filter((c) => !c.won).length,
    pointsFor: doneAll.reduce((s, c) => s + c.score[0], 0),
    pointsAgainst: doneAll.reduce((s, c) => s + c.score[1], 0),
    championships: runs.filter((r) => r.champion).length,
    tournaments: runs.length,
  };
}
