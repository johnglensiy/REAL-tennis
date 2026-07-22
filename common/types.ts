export type Tour = "men" | "women";

// how a point ended — always present, even when the tournament has no rally analysis
export type PointResult = "A" | "DF" | "W" | "UE" | "FE";

export type Hand = "ForeHand" | "BackHand";

// which moment of the ball's flight a tracked position represents
export type BallEvent = "hit" | "peak" | "net" | "bounce" | "last";

/**
 * One tracked position of the ball, in court-frame metres.
 * Origin is the net centre; +x runs along the court's length.
 */
export interface BallPosition {
  x: number;
  y: number;
  z: number; // height above the court
  at: BallEvent;
  t: number; // seconds since the point's first contact
  dt: number; // seconds since the previous position in this shot (0 on the first)
}

/**
 * One stroke — the unit of rally trajectory. A point's `shots` in order gives
 * the whole ball flight; `path` is that stroke's segment of it.
 */
export interface Shot {
  index: number; // 0 is always the serve
  isServe: boolean;
  hand: Hand | null; // null on the serve — the feed doesn't classify it
  t: number; // seconds into the point at contact
  duration: number; // contact until the last tracked position of this stroke
  path: BallPosition[];
}

/**
 * Per-point rally detail. Optional on PointDTO: only tournaments with rally
 * analysis supply it, and even then a point may be missing shots (see
 * `truncated`). `length` is the only field guaranteed present.
 */
export interface RallyDetail {
  length: number; // official shot count (may exceed shots.length)
  shots?: Shot[];
  duration?: number; // seconds from serve contact to the last tracked position

  // serve
  serveType?: "Flat" | "Slice" | "Kick" | "Pronated";
  serveCourt?: "deuce" | "ad";
  serveSpeedKph?: number | null;
  spin?: number | null; // rpm

  // how the point finished
  endHand?: Hand | null;
  placement?: string | null; // e.g. "Cross Court", "Net Error"
  trappedByNet?: boolean;

  // situation
  breakPoint?: boolean;
  breakPointConverted?: boolean;

  // the tracker lost one or more strokes — shots is incomplete and the
  // feed's own summary coordinates come back null. Don't trust shot counts.
  truncated?: boolean;
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
