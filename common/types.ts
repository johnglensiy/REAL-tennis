export type MatchStatus = 'live' | 'final' | 'upcoming' | 'suspended' | 'cancelled';
export type Tour = 'men' | 'women';

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
  tournamentId: string;
  status: MatchStatus;
  round: string;
  court: string;
  scheduledTime: string;
  startTime: number;
  staticPlayerA: Player;
  staticPlayerB: Player;
  seedA: number | 'Q' | null;
  seedB: number | 'Q' | null;
  pointIds: string[];
  latestSummary: string;
  href?: string;
  // has rallyData
}

export interface Tournament {
    name: string;
    tour: Tour;
    detail: string;
    matches: Match[];
}

