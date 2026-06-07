import { useState } from 'react';
import PointCard from './PointCard';
import Scoreboard from './Scoreboard';
import type { MatchEvent, TeamSnapshot } from '../App';

export interface MatchEntry {
  matchId: string;
  matchStatus: string;
  playerTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  events: MatchEvent[];
}

const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];

const scoreUpdateStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: 'var(--ink)',
  letterSpacing: '0.06em',
  textAlign: 'center',
  padding: '16px 16px',
};

export default function MatchCard({ entry }: { entry: MatchEntry }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 w-150 outline">
      <button className="w-full text-left" onClick={() => setIsOpen(prev => !prev)}>
        <Scoreboard
          playerTeam={entry.playerTeam}
          opponentTeam={entry.opponentTeam}
          matchStatus={entry.matchStatus}
        />
      </button>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
          {entry.events.map((e) => {
            if (e.type === 'point') return (
              <PointCard
                key={e.id}
                point={{
                  playerGameScore: e.playerGameScore,
                  playerSetScores: e.playerSetScores,
                  opponentGameScore: e.opponentGameScore,
                  opponentSetScores: e.opponentSetScores,
                  result: e.result,
                  rallyLength: e.rallyLength,
                  team1: entry.playerTeam,
                  team2: entry.opponentTeam,
                  scorer: e.scorer,
                  timeElapsed: e.timeElapsed,
                }}
              />
            );

            const winnerTeam = e.winner === '1' ? entry.playerTeam : entry.opponentTeam;
            const setIdx = (e.playerSetScores?.length ?? 1) - 1;
            const ordinal = ordinals[setIdx] ?? `${setIdx + 1}th`;
            const aGames = (e.playerSetScores?.at(-1) ?? 0) + (e.winner === '1' ? 1 : 0);
            const bGames = (e.opponentSetScores?.at(-1) ?? 0) + (e.winner === '2' ? 1 : 0);

            if (e.type === 'game') {
              const leader = aGames > bGames ? entry.playerTeam : aGames < bGames ? entry.opponentTeam : null;
              const hi = Math.max(aGames, bGames);
              const lo = Math.min(aGames, bGames);
              const description = leader
                ? `${leader.lastName} leads ${ordinal} set ${hi}-${lo}`
                : `${ordinal} set tied ${aGames}-${aGames}`;
              return <div key={e.id} style={scoreUpdateStyle}>Game {winnerTeam.lastName}. {description}</div>;
            }

            if (e.type === 'set') {
              const pScores = [...(e.playerSetScores ?? [])];
              const oScores = [...(e.opponentSetScores ?? [])];
              pScores[pScores.length - 1] = aGames;
              oScores[oScores.length - 1] = bGames;
              const playerSetsWon = pScores.filter((s, i) => s > oScores[i]).length;
              const opponentSetsWon = oScores.filter((s, i) => s > pScores[i]).length;
              const setsScore = e.winner === '1' ? `${playerSetsWon}-${opponentSetsWon}` : `${opponentSetsWon}-${playerSetsWon}`;
              return <div key={e.id} style={scoreUpdateStyle}>Game and set {winnerTeam.lastName}. {winnerTeam.lastName} leads {setsScore}</div>;
            }

            return <div key={e.id} style={scoreUpdateStyle}>Game, set and match {winnerTeam.lastName}</div>;
          })}
        </div>
      )}
    </div>
  );
}
