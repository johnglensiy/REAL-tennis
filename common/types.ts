export type Tour = 'men' | 'women';

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


export interface SideScore {
  gameScore: string;
  setScores: (number | null)[];
}

export interface MatchScheduled {
  type: 'scheduled';
  matchId: string;
  tour: Tour;
  tournament: string;
  court: string;
  scheduledDate: string;
  scheduledTime: string;
  round: string;
  playerA: PlayerStateOld;
  playerB: PlayerStateOld;
}

export interface ScoreUpdated {
  type: 'score';
  matchId: string;
  updateId: string;

  // point-specific
  playerScore: SideScore;
  opponentScore: SideScore; // resulting score
  scorer: 'p' | 'o';        // scorer of the point that was just played
  server: 'p' | 'o';        // server of the point that was just played
  result: string;
  rallyLength: number;

  // match-specific
  isGameComplete: boolean;
  isSetComplete: boolean;
  timeElapsedInSeconds: number;
  matchStatus: string;
}

export interface MatchFinished {
  type: 'finished';
  matchId: string;

}

export type MatchEvent = MatchScheduled | ScoreUpdated | MatchFinished;