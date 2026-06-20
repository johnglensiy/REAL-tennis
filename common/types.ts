export type MatchStatus = 'live' | 'final' | 'upcoming' | 'suspended' | 'cancelled';
export type Tour = 'men' | 'women';

export interface PlayerState {
  name: string;
  country: string;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export interface MatchState {
  id: string;
  tournamentId: string;
  status: MatchStatus;
  round: string;
  court: string;
  meta: string;
  scheduledTime: string;
  startTime: number;
  staticPlayerA: PlayerState;
  staticPlayerB: PlayerState;
  seedA: number | 'Q' | null;
  seedB: number | 'Q' | null;
  pointIds: string[];
  latestSummary: string;
  href?: string;
  // has rallyData
}

export interface MatchStateOld {
  id: string;
  status: string;
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
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export interface TournamentState {
    name: string;
    tour: Tour;
    detail: string;
    matches: MatchStateOld[];
}

