export type MatchStatus =
  | "live"
  | "final"
  | "upcoming"
  | "suspended"
  | "cancelled";
export type Tour = "men" | "women";

export interface Point {
  type: "point";
  id: string;

  // score state AFTER this point — a point always advances the score,
  // which is the whole reason ScoreUpdate can collapse into this
  playerGameScore: number;
  opponentGameScore: number;
  playerSetScores: number[] | null;
  opponentSetScores: number[] | null;

  scorer: "1" | "2";
  result: string; // how the point ended — ALWAYS present, even w/o rally analysis
  timeElapsed: number;

  // milestone: did this point also close out a game / set / match?
  // absent = ordinary point. Replaces the old ScoreUpdate entirely.
  completes?: "game" | "set" | "match";

  // rally detail — per-point optional. null/absent = tournament or point
  // has no rally analysis (rallyStats:false / rallyLengthMissing:true).
  rally?: RallyDetail | null;
}

export interface RallyDetail {
  length: number;
}

// not local to tournament tracker, is redux global state after all
// should prolly move this to a client shared types file
export interface MatchStateOld {
  id: string;
  tournamentId: string;
  status: string;
  scheduledDate: string;
  meta: string;
  round?: string;
  court?: string;
  time?: string;
  live?: string;
  href?: string;
  a: PlayerStateOld;
  b: PlayerStateOld;
  pointHistory: Point[];
}

export interface PlayerStateOld {
  name: string;
  country: string;
  seed?: string;
  atpId?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export interface TournamentState {
  id: string;
  name: string;
  tour: Tour;
  detail: string;
  matches: MatchStateOld[];
}

export interface Player {
  name: string;
  country: string;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  meta: string;
  live?: string;
  href?: string;
  a: Player;
  b: Player;
}

export interface Tournament {
  name: string;
  tour: Tour;
  detail: string;
  matches: Match[];
}
