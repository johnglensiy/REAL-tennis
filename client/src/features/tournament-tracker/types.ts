export type MatchStatus =
  | "live"
  | "final"
  | "upcoming"
  | "suspended"
  | "cancelled";
export type Tour = "men" | "women";

// not local to tournament tracker, is redux global state
// should prolly move this to a client shared types file
export interface MatchStateOld {
  id: string;
  tournamentId: string;
  status: string;
  scheduledDate: string;
  meta: string;
  live?: string;
  href?: string;
  a: PlayerStateOld;
  b: PlayerStateOld;
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
