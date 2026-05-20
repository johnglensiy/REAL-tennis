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

router.get('/winners', async (req, res) => {
    console.log("Routing to winners API");
    const data = parseWinners(winnersRaw);
    res.json(data);
});

export default router;