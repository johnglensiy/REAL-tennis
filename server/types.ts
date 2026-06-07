export interface TeamInfo {
    atpId: string;
    firstName: string;
    lastName: string;
    seed: number;
    country: string;

    // these fields below should not be here
    isServer?: boolean;
    gameScore?: string;
    setScores?: (number | null)[];
}

export type MatchEvent = PointUpdate | ScoreUpdate;

export interface PointUpdate {
    type: 'point',
    id: string,
    playerGameScore: number,
    playerSetScores: number[] | null,
    opponentGameScore: number,
    opponentSetScores: number[] | null,
    result: string,
    rallyLength: number,
    scorer: '1' | '2',
    timeElapsed: number,
  }

export interface ScoreUpdate {
    type: 'game' | 'set' | 'match',
    id: string,
    winner: '1' | '2',
    playerSetScores: number[] | null,
    opponentSetScores: number[] | null,
    timeElapsed: number,
  }

export interface MatchEntry {
    matchId: string;
    matchStatus: string;
    playerTeamInfo: TeamInfo;
    opponentTeamInfo: TeamInfo;
    events: MatchEvent[];
    latestPointId: string | null;
    latestPointWithRallyDataId: string | null;
  }