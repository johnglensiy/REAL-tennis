import { MatchSnapshot } from '../types.ts';

// snapshots should diff fully not just get last point
export function diffSnapshots(prev: MatchSnapshot, curr: MatchSnapshot): void {
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