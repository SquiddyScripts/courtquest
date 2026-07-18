export type TournamentStatus = "draft" | "registration" | "live" | "completed";
export type Stage = "qualification" | "quarterfinal" | "semifinal" | "final";
export type MatchStatus = "upcoming" | "ongoing" | "completed";

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  location: string | null;
  starts_at: string | null;
  status: TournamentStatus;
  courts: number;
  qual_points: number;
  elim_points: number;
  qual_rounds: number;
  ref_code: string;
  balls_out: number;
  charity: string | null;
  raised_cents: number;
  registration_open: boolean;
  format: "singles" | "doubles";
  participants: number | null;
  /** Not listed anywhere public. Direct links still work. */
  hidden: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  number: number;
  name: string | null;
  player1: string;
  player2: string | null;
  checked_in: boolean;
  paid: boolean;
  withdrawn: boolean;
  seed: number | null;
  /** Optional links to player profiles (public, harmless ids). */
  p1_id: string | null;
  p2_id: string | null;
  registration_id: string | null;
  created_at: string;
}

/** A signed-in player (from the optional profile system). */
export interface PlayerIdentity {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  code: number;
  stage: Stage;
  round: number;
  slot: number | null;
  court: number | null;
  team_a: string | null;
  team_b: string | null;
  score_a: number;
  score_b: number;
  status: MatchStatus;
  serving: "a" | "b" | null;
  side_choice: string | null;
  coin_flip: "heads" | "tails" | null;
  referee: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_secs: number | null;
  timer_started_at: string | null;
  timer_accum_secs: number;
  note: string | null;
  created_at: string;
}

export interface Registration {
  id: string;
  tournament_id: string | null;
  player1: string;
  player2: string | null;
  email: string;
  email2: string | null;
  phone: string | null;
  volunteer: boolean;
  processed: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  volunteer: boolean;
  message: string | null;
  created_at: string;
}

/** Computed qualification standing for one team. */
export interface Standing {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Average point differential per game, IPL/NBA style (+0.18 / -0.23). */
  diff: number;
  rank: number;
  qualified: boolean;
}
