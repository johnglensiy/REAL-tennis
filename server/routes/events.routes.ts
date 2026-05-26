import { Router } from 'express';
import { context, page } from '../index.ts';
import winnersRaw from '../data/winnersRaw.ts';
import { parseWinners } from '../utils/parseWinners.ts';
import pbp_tien_navone from '../data/tien-navone-pbp.json';

import { SetScore, TeamSnapshot, MatchSnapshot } from '../types.ts';

const router = Router();

function extractSnapshot(match: any): MatchSnapshot {
    return {
        matchId: match.MatchId,
        matchStatus: match.MatchStatus,
        playerTeam: {
            name: `${match.PlayerTeam.Player.PlayerFirstName} ${match.PlayerTeam.Player.PlayerLastName}`,
            gameScore: match.PlayerTeam.GameScore,
            setScores: match.PlayerTeam.SetScores.map((s: SetScore) => s.SetScore),
        },
        opponentTeam: {
            name: `${match.OpponentTeam.Player.PlayerFirstName} ${match.OpponentTeam.Player.PlayerLastName}`,
            gameScore: match.OpponentTeam.GameScore,
            setScores: match.OpponentTeam.SetScores.map((s: SetScore) => s.SetScore),
        },
    };
}

// snapshots should diff fully not just get last point
function diffSnapshots(prev: MatchSnapshot, curr: MatchSnapshot): void {
    const p = curr.playerTeam;
    const o = curr.opponentTeam;

    if (prev.playerTeam.gameScore !== curr.playerTeam.gameScore ||
        prev.opponentTeam.gameScore !== curr.opponentTeam.gameScore) {
        console.log(`[SCORE UPDATE] ${p.name}: ${p.gameScore} | ${o.name}: ${o.gameScore}`);
    }

    for (let i = 0; i < 5; i++) {
        if (prev.playerTeam.setScores[i] !== curr.playerTeam.setScores[i] ||
            prev.opponentTeam.setScores[i] !== curr.opponentTeam.setScores[i]) {
            console.log(`[SET ${i + 1} UPDATE] ${p.name}: ${p.setScores[i]} | ${o.name}: ${o.setScores[i]}`);
        }
    }

    if (prev.matchStatus !== curr.matchStatus) {
        console.log(`[MATCH STATUS] ${curr.matchStatus === 'F' ? `Match finished` : `Status changed to ${curr.matchStatus}`}`);
    }
}

let lastSnapshot: MatchSnapshot | null = null;
let matchDataSnapshot: MatchSnapshot | null = null;
let allMatchSnapshots: MatchSnapshot[] | null = [];
const matchDataClients = new Set<any>();

export function startWatchingAllMatchData() {
    page.on('response', async (response) => {
        if (!response.url().includes('livematches')) return;

        try {
            const json = await response.json();
            const tournaments = json.Data?.LiveMatchesTournamentsOrdered ?? [];

            allMatchSnapshots = [];

            for (const tournament of tournaments) {
                const liveMatches = tournament.LiveMatches?.filter((m: any) => {
                    return m.MatchStatus == "P";
                });

                if (liveMatches.length === 0) continue;

                for (const lm of liveMatches) {
                    const liveSnapshot = extractSnapshot(lm);
                    allMatchSnapshots?.push(liveSnapshot);
                    console.log(`[MATCHDATA] ${liveSnapshot.playerTeam.name} ${liveSnapshot.playerTeam.gameScore} | ${liveSnapshot.opponentTeam.name} ${liveSnapshot.opponentTeam.gameScore}`);
                }
            }

            // push all live match snapshots together to client
            for (const client of matchDataClients) {
                client.write(`data: ${JSON.stringify(allMatchSnapshots)}\n\n`);
            }
        } catch (e) {
            console.log(e);
        }
    })
}

export function startWatchingSingleMatchData() {
    page.on('response', async (response) => {
        if (!response.url().includes('livematches')) return;

        try {
            const json = await response.json();
            const tournaments = json?.Data?.LiveMatchesTournamentsOrdered ?? [];

            for (const tournament of tournaments) {
                const match = tournament.LiveMatches?.find((m: any) => {
                    const p = `${m.PlayerTeam.Player.PlayerFirstName} ${m.PlayerTeam.Player.PlayerLastName}`.toLowerCase();
                    const o = `${m.OpponentTeam.Player.PlayerFirstName} ${m.OpponentTeam.Player.PlayerLastName}`.toLowerCase();
                    return p.includes('darderi') || o.includes('darderi') ||
                           p.includes('hanfmann') || o.includes('hanfmann');
                });

                if (!match) continue;

                matchDataSnapshot = extractSnapshot(match);
                console.log(`[MATCHDATA] ${matchDataSnapshot.playerTeam.name} ${matchDataSnapshot.playerTeam.gameScore} | ${matchDataSnapshot.opponentTeam.name} ${matchDataSnapshot.opponentTeam.gameScore}`);

                // push to all connected SSE clients
                for (const client of matchDataClients) {
                    client.write(`data: ${JSON.stringify(matchDataSnapshot)}\n\n`);
                }
            }
        } catch (e) {
            // not JSON, skip
        }
    });
}

function buildSnapshotFromPoint(pbpData: any, setIdx: number, gameIdx: number, point: any): MatchSnapshot {
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
            name: `${playerData.tm1Ply1FirstName} ${playerData.tm1Ply1LastName}`,
            gameScore: point.tm1GameScore,
            setScores: tm1SetScores,
        },
        opponentTeam: {
            name: `${playerData.tm2Ply1FirstName} ${playerData.tm2Ply1LastName}`,
            gameScore: point.tm2GameScore,
            setScores: tm2SetScores,
        },
    };
}

function buildPoint(pbpData: any, setIdx: number, gameIdx: number, point: any): any {
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
            name: `${playerData.tm1Ply1FirstName} ${playerData.tm1Ply1LastName}`,
            gameScore: point.tm1GameScore,
            setScores: tm1SetScores,
        },
        opponentTeam: {
            name: `${playerData.tm2Ply1FirstName} ${playerData.tm2Ply1LastName}`,
            gameScore: point.tm2GameScore,
            setScores: tm2SetScores,
        },
        result: point.result,
        rallyLength: point.tm1Rally + point.tm2Rally
    };
}

function streamPointAndScheduleNext(
    res: any,
    pbpData: any,
    setIdx: number,
    gameIdx: number,
    pointIdx: number
) {
    const setData = pbpData.setData;
    if (setIdx >= setData.length) return;

    const gameData = setData[setIdx].gameData;
    if (gameIdx >= gameData.length) return;

    const pointData = gameData[gameIdx].pointData;
    if (pointIdx >= pointData.length) return;

    const currentPoint = pointData[pointIdx];

    // build and SSE a MatchSnapshot[] so the client receives the same shape as the real stream
    const snapshot = buildPoint(pbpData, setIdx, gameIdx, currentPoint);
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

    // determine next indices
    let nextSet = setIdx;
    let nextGame = gameIdx;
    let nextPoint = pointIdx + 1;

    if (nextPoint >= pointData.length) {
        nextGame++;
        nextPoint = 0;
        if (nextGame >= gameData.length) {
            nextSet++;
            nextGame = 0;
        }
    }

    // check next point exists
    if (nextSet >= setData.length) return;
    const nextPointData = setData[nextSet].gameData[nextGame]?.pointData;
    if (!nextPointData || nextPoint >= nextPointData.length) return;

    const next = nextPointData[nextPoint];
    const delay = (next.currentMatchDuration - currentPoint.currentMatchDuration) * 1000;

    setTimeout(() => {
        streamPointAndScheduleNext(res, pbpData, nextSet, nextGame, nextPoint);
    }, Math.max(delay, 0)); // guard against 0 or negative diffs
}

router.get('/matchdata/mock-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // in prod playwright will open the corresponding Matchbeats tab of the match
    // a mock stream (pbp) uses some of the example data
    // then streams it with a setInterval
    streamPointAndScheduleNext(res, pbp_tien_navone, 0, 0, 0);
    req.on('close', () => matchDataClients.delete(res));    

    // example pbp http request 
    // this was the URL for Buse-Paul Hamburg final
    // tournaments without rally analysis still display how the point ended
    // https://itp-atp-sls.infosys-platforms.com/prod/api/match-beats/data/year/2026/eventId/414/matchId/MS001
    // and for the Tien-Navone Geneva final
    // https://itp-atp-sls.infosys-platforms.com/prod/api/match-beats/data/year/2026/eventId/322/matchId/MS001?TAB=MATCHBEATS
    // the Geneva final had rally data so here were additional URls that were fetched
    // rally analysis by number of shots: https://itp-atp-sls.infosys-platforms.com/prod/api/rally-analysis/year/2026/eventId/322/matchId/MS001?TAB=MATCHBEATS
    // 
    // push all live match snapshots together to client
});

// SSEs all live matches from the ATP live matches URL
router.get('/matchdata/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (allMatchSnapshots && allMatchSnapshots.length > 0) {
        res.write(`data: ${JSON.stringify(allMatchSnapshots)}\n\n`);
    }

    matchDataClients.add(res);
    req.on('close', () => matchDataClients.delete(res));
});

router.get('/', async (req, res) => {
    console.log("Routing to events API");
    res.json({ message: `Watching match` });
});

export default router;