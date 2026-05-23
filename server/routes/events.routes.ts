import { Router } from 'express';
import { context, page } from '../index.ts';
import winnersRaw from '../data/winnersRaw.ts';
import { parseWinners } from '../utils/parseWinners.ts';

const router = Router();

const TARGET_MATCH_ID = 'MS029'; // Djere vs Duckworth

type SetScore = {
    SetNumber: number;
    SetScore: number | null;
    TieBreakScore: number | null;
};

type TeamSnapshot = {
    name: string;
    gameScore: string;
    setScores: (number | null)[];
};

type MatchSnapshot = {
    matchId: string;
    matchStatus: string;
    playerTeam: TeamSnapshot;
    opponentTeam: TeamSnapshot;
};

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

export function startWatching() {
    context.on('response', async (response) => {
        if (!response.url().includes('livematches')) return;

        try {
            const json = await response.json();
            const tournaments = json?.Data?.LiveMatchesTournamentsOrdered ?? [];

            for (const tournament of tournaments) {
                const match = tournament.LiveMatches?.find((m: any) => m.MatchId === TARGET_MATCH_ID);
                if (!match) continue;

                const snapshot = extractSnapshot(match);

                if (!lastSnapshot) {
                    console.log(`[WATCHING] ${snapshot.playerTeam.name} vs ${snapshot.opponentTeam.name}`);
                    console.log(`[INITIAL] Sets: ${snapshot.playerTeam.setScores} | ${snapshot.opponentTeam.setScores}`);
                } else {
                    diffSnapshots(lastSnapshot, snapshot);
                }

                lastSnapshot = snapshot;
            }
        } catch (e) {
            // response wasn't JSON, skip
        }
    });
}

router.get('/', async (req, res) => {
    console.log("Routing to events API");
    res.json({ message: `Watching match ${TARGET_MATCH_ID}` });
});

router.get('/matchdata', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!matchDataSnapshot) {
        res.status(404).json({ error: 'No match data yet — still waiting for livematches response' });
        return;
    }
    res.json(matchDataSnapshot);
});

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

router.get('/winners', async (req, res) => {
    console.log("Routing to winners API");
    res.setHeader('Access-Control-Allow-Origin', '*');
    const data = parseWinners(winnersRaw);
    res.json(data);
});

export default router;