import PlayerRow from './PlayerRow';
import type { TeamSnapshot } from '../App';

interface ScoreboardProps {
  playerTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  matchStatus: string;
}

export default function Scoreboard({ playerTeam, opponentTeam, matchStatus }: ScoreboardProps) {
  const sets = playerTeam.setScores
    .map((a, i) => ({ a: a ?? 0, b: opponentTeam.setScores[i] ?? 0, tb: null }))
    .filter((_, i) => playerTeam.setScores[i] !== null || opponentTeam.setScores[i] !== null);

  const isGameComplete = playerTeam.gameScore === 'GAME' || opponentTeam.gameScore === 'GAME';

  if (sets.length > 0) {
    const last = sets[sets.length - 1];
    if (playerTeam.gameScore === 'GAME') {
      sets[sets.length - 1] = { ...last, a: last.a + 1 };
    } else if (opponentTeam.gameScore === 'GAME') {
      sets[sets.length - 1] = { ...last, b: last.b + 1 };
    }
  }

  return (
    <div>
      <PlayerRow
        who="a"
        firstName={playerTeam.firstName}
        lastName={playerTeam.lastName}
        seed={playerTeam.seed}
        country={playerTeam.country}
        sets={sets}
        point={isGameComplete ? 0 : playerTeam.gameScore || 0}
        isServing={isGameComplete ? !playerTeam.isServer : playerTeam.isServer}
        won={matchStatus === 'F'}
        ballColor="yellow"
      />
      <PlayerRow
        who="b"
        firstName={opponentTeam.firstName}
        lastName={opponentTeam.lastName}
        seed={opponentTeam.seed}
        country={opponentTeam.country}
        sets={sets}
        point={isGameComplete ? 0 : opponentTeam.gameScore || 0}
        isServing={isGameComplete ? !opponentTeam.isServer : opponentTeam.isServer}
        won={matchStatus === 'F'}
        ballColor="yellow"
      />
    </div>
  );
}
