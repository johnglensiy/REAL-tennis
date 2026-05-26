export type SetScore = {
    SetNumber: number;
    SetScore: number | null;
    TieBreakScore: number | null;
}

export type TeamSnapshot = {
    name: string;
    gameScore: string;
    setScores: (number | null)[];
}

export type MatchSnapshot = {
    matchId: string;
    matchStatus: string;
    playerTeam: TeamSnapshot;
    opponentTeam: TeamSnapshot;
}