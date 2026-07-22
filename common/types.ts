export type Tour = "men" | "women";

// how a point ended — always present, even when the tournament has no rally analysis
export type PointResult = "A" | "DF" | "W" | "UE" | "FE";

// rally detail is per-point optional; only tournaments with rally analysis supply it
export interface RallyDetail {
  length: number; // shot count
}

/**
 * One point on the wire. Coalesced: a point always advances the score, so the
 * game/set/match milestone rides on the point itself (`completes`) rather than
 * arriving as a separate event.
 *
 * Domain facts only — no player identity (that comes once via MatchScheduled)
 * and no presentation strings.
 */
export interface PointDTO {
  type: "point";
  matchId: string; // routes the point to a match
  id: string; // pointId, unique within the match — dedup key on SSE replay

  scorer: "1" | "2";
  server: "1" | "2";
  result: PointResult;

  // score state AFTER this point
  playerGameScore: string; // "0" | "15" | "30" | "40" | "AD" | "GAME"
  opponentGameScore: string;
  playerSetScores: number[];
  opponentSetScores: number[];

  // milestone: did this point also close out a game/set/match?
  // absent = ordinary point. Replaces the old ScoreUpdate event entirely.
  completes?: "game" | "set" | "match";

  // null/absent = no rally analysis for this point
  // (raw feed: rallyStats:false / rallyLengthMissing:true)
  rally?: RallyDetail | null;

  score?: number; // point importance/quality — powers the "top points" view
  timeElapsed: number; // seconds into the match
}

export interface PlayerStateOld {
  name: string;
  country: string;
  atpId: string | null;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export interface SideScore {
  name: string;
  country: string;
  seed?: string;
  gameScore: string;
  setScores: (number | null)[];
}

export interface MatchScheduled {
  type: "scheduled";
  matchId: string;
  tour: Tour;
  tournamentId: string;
  court: string;
  scheduledDate: string;
  scheduledTime: string;
  round: string;
  playerA: PlayerStateOld;
  playerB: PlayerStateOld;
}

export interface ScoreUpdated {
  type: "score";
  matchId: string;
  updateId: string;

  // point-specific
  playerScore: SideScore;
  opponentScore: SideScore; // resulting score
  scorer: "p" | "o"; // scorer of the point that was just played
  server: "p" | "o"; // server of the point that was just played
  result: string;
  rallyLength: number;

  // match-specific
  isGameComplete: boolean;
  isSetComplete: boolean;
  timeElapsedInSeconds: number;
  matchStatus: string;
}

export type MatchEvent = MatchScheduled | ScoreUpdated;
