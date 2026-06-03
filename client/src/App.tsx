import { useEffect, useState } from 'react';
import PointCard from './components/PointCard';
import Scoreboard from './components/Scoreboard';

import './App.css';

export interface TeamSnapshot {
  atpId: string;
  firstName: string;
  lastName: string;
  seed: number;
  country: string;
  isServer: boolean; 
  gameScore: string;
  setScores: (number | null)[];
}

export interface Point {
  type: 'point',
  id: string,
  playerGameScore: number,
  playerSetScores: number[] | null,
  opponentGameScore: number,
  opponentSetScores: number[] | null,
  result: string,
  rallyLength: number,
  scorer: '1' | '2',
  timeElapsed: number,
}

export interface ScoreUpdate {
  type: 'game' | 'set' | 'match',
  id: string,
  winner: '1' | '2',
  playerSetScores: number[] | null,
  opponentSetScores: number[] | null,
  timeElapsed: number,
}

export type MatchEvent = Point | ScoreUpdate;

interface MatchEntry {
  matchId: string;
  matchStatus: string;
  playerTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  events: MatchEvent[];
}

function App() {
  const [error, setError] = useState<string | null>(null);
  const [allMatchData, setAllMatchData] = useState<Map<string, MatchEntry>>(new Map());

  useEffect(() => {
    const es = new EventSource('matchdata/mock-stream');
    es.onmessage = (e: MessageEvent) => {
      const json = JSON.parse(e.data);

      setAllMatchData(prev => {
        const nextMap = new Map(prev);
        const entryToUpdate = nextMap.get(json.matchId);

        const newEvents: MatchEvent[] = [...(entryToUpdate?.events ?? [])];

        newEvents.push({
          type: 'point',
          id: json.pointId,
          playerGameScore: json.playerGameScore,
          playerSetScores: json.playerSetScores,
          opponentGameScore: json.opponentGameScore,
          opponentSetScores: json.opponentSetScores,
          result: json.result,
          rallyLength: json.rallyLength,
          scorer: json.scorer,
          timeElapsed: json.timeElapsedInSeconds,
        });

        if (json.isMatchComplete) {
          newEvents.push({ type: 'match', id: `${json.pointId}-match`, winner: json.scorer, playerSetScores: json.playerSetScores, opponentSetScores: json.opponentSetScores, timeElapsed: json.timeElapsedInSeconds });
        } else if (json.isSetComplete) {
          newEvents.push({ type: 'set', id: `${json.pointId}-set`, winner: json.scorer, playerSetScores: json.playerSetScores, opponentSetScores: json.opponentSetScores, timeElapsed: json.timeElapsedInSeconds });
        } else if (json.isGameComplete) {
          newEvents.push({ type: 'game', id: `${json.pointId}-game`, winner: json.scorer, playerSetScores: json.playerSetScores, opponentSetScores: json.opponentSetScores, timeElapsed: json.timeElapsedInSeconds });
        }

        nextMap.set(json.matchId, {
          matchId: json.matchId,
          matchStatus: json.matchStatus,
          playerTeam: json.playerTeam,
          opponentTeam: json.opponentTeam,
          events: newEvents,
        });

        const updated = nextMap.get(json.matchId);
        console.log(`[${json.matchId}] events:`, updated?.events);
        return nextMap;
      })

      console.log(`Received update from match ${json.matchId} ${json.playerTeam} vs. ${json.opponentTeam}`);
    };
    es.onerror = () => setError('Lost connection to match data stream');
    return () => es.close();
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Error: {error}
    </div>
  );

  // if (!data) return <div>Loading winners...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
      {/* Title */}
      <div className="mb-7 outline">
        <h1 className="text-2xl font-bold !text-black">
          Roland Garros
          {/* {data.opponentSeed && (
            <span className="text-sm font-medium text-gray-400 ml-2">#{data.opponentSeed}</span>
          )} */}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {/* {data.matchType} · {data.winners.length} winners */}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
      {[...allMatchData.values()].map(entry => {
        return (
          <div key={entry.matchId} className="mb-6 w-150 outline">
            <Scoreboard
              playerTeam={entry.playerTeam}
              opponentTeam={entry.opponentTeam}
              matchStatus={entry.matchStatus}
            />
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
                    }} />
                );
                const winnerTeam = e.winner === '1' ? entry.playerTeam : entry.opponentTeam;
                const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];
                const setIdx = (e.playerSetScores?.length ?? 1) - 1;
                const ordinal = ordinals[setIdx] ?? `${setIdx + 1}th`;

                // Increment winner's current set game count for display
                const aGames = (e.playerSetScores?.at(-1) ?? 0) + (e.winner === '1' ? 1 : 0);
                const bGames = (e.opponentSetScores?.at(-1) ?? 0) + (e.winner === '2' ? 1 : 0);

                const scoreUpdateStyle: React.CSSProperties = {
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  letterSpacing: '0.06em',
                  textAlign: 'center',
                  padding: '16px 16px',
                };

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
          </div>
        );
      })}
      </div>

    </div>
  );
}

export default App;
