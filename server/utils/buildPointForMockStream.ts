export function buildPointForMockStream(pbpData: any, setIdx: number, gameIdx: number, point: any): any {
    const playerData = pbpData.playerData;

    const tm1SetScores: (number | null)[] = [];
    const tm2SetScores: (number | null)[] = [];

    // scores for all completed sets before current set
    for (let s = 0; s < setIdx; s++) {
        const lastGame = pbpData.setData[s].gameData.at(-1);
        tm1SetScores.push(lastGame.tm1SetScore);
        tm2SetScores.push(lastGame.tm2SetScore);
    }

    // current set score = result of the last completed game, or 0-0 if first game
    const currentSetGames = pbpData.setData[setIdx].gameData;
    if (gameIdx === 0) {
        tm1SetScores.push(0);
        tm2SetScores.push(0);
    } else {
        tm1SetScores.push(currentSetGames[gameIdx - 1].tm1SetScore);
        tm2SetScores.push(currentSetGames[gameIdx - 1].tm2SetScore);
    }

    return {
        matchId: pbpData.matchId,
        matchStatus: pbpData.matchStatus,
        playerTeam: {
            firstName: `${playerData.tm1Ply1FirstName}`,
            lastName: `${playerData.tm1Ply1LastName}`,
            seed: playerData.tm1Seed,
            country: playerData.tm1Ply1Country,
            isServer: point.server == '1',
            gameScore: point.tm1GameScore,
            setScores: tm1SetScores,
        },
        opponentTeam: {
            firstName: `${playerData.tm2Ply1FirstName}`,
            lastName: `${playerData.tm2Ply1LastName}`,
            seed: playerData.tm2Seed,
            country: playerData.tm2Ply1Country,
            isServer: point.server == '2',
            gameScore: point.tm2GameScore,
            setScores: tm2SetScores,
        },
        result: point.result,
        rallyLength: point.tm1Rally + point.tm2Rally
    };
}