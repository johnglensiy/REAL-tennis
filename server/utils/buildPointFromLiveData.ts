const POINT_END_TYPE_MAP: Record<string, string> = {
    Winner: 'W',
    UnforcedError: 'UE',
    ForcedError: 'FE',
    Ace: 'A',
    DoubleFault: 'DF',
};

export function buildPointFromLiveData(cv: any): any {
    const p = cv.playerTeam;
    const o = cv.opponentTeam;

    const playerSetScores: number[] = [
        cv.playerSet1Score, cv.playerSet2Score, cv.playerSet3Score,
        cv.playerSet4Score, cv.playerSet5Score,
    ].filter(s => s != null);

    const opponentSetScores: number[] = [
        cv.opponentSet1Score, cv.opponentSet2Score, cv.opponentSet3Score,
        cv.opponentSet4Score, cv.opponentSet5Score,
    ].filter(s => s != null);

    while (playerSetScores.length < opponentSetScores.length) playerSetScores.push(0);
    while (opponentSetScores.length < playerSetScores.length) opponentSetScores.push(0);

    const scorer: '1' | '2' = cv.scorerId === p?.id ? '1' : '2';
    const playerGameScore = cv.playergamescore ?? '0';
    const opponentGameScore = cv.opponentgamescore ?? '0';
    const isGameComplete = playerGameScore === 'GAME' || opponentGameScore === 'GAME';

    return {
        updateId:           cv.pointId,
        matchId:            cv.matchId ?? cv.matchStatus,
        matchStatus:        cv.matchStatus,
        isGameComplete,
        isSetComplete:      isGameComplete && (cv.isSetWinning === true),
        isMatchComplete:    isGameComplete && (cv.isMatchWinning === true),
        playerTeam: {
            atpId:      p?.id,
            firstName:  p?.name?.split(' ')[0] ?? '',
            lastName:   p?.name?.split(' ').slice(1).join(' ') ?? '',
            seed:       p?.seed ?? 0,
            country:    p?.country ?? '',
            isServer:   cv.server === p?.id,
            gameScore:  playerGameScore,
            setScores:  playerSetScores,
        },
        opponentTeam: {
            atpId:      o?.id,
            firstName:  o?.name?.split(' ')[0] ?? '',
            lastName:   o?.name?.split(' ').slice(1).join(' ') ?? '',
            seed:       o?.seed ?? 0,
            country:    o?.country ?? '',
            isServer:   cv.server === o?.id,
            gameScore:  opponentGameScore,
            setScores:  opponentSetScores,
        },
        scorer,
        result:               POINT_END_TYPE_MAP[cv.pointEndType] ?? cv.pointEndType,
        rallyLength:          cv.rallyLength ?? 0,
        timeElapsedInSeconds: cv.time ?? 0,
        playerGameScore,
        playerSetScores,
        opponentGameScore,
        opponentSetScores,
    };
}
