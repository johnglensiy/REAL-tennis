import { SetScore, TeamSnapshot, MatchSnapshot } from '../types.ts';

/**
 * Takes in a single raw match JSON object from playwright's page interception
 * Returns relevant fields to match client's match object shape
 */
export default function extractSnapshotFromMatchData(match: any): MatchSnapshot {
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