import { useEffect, useState } from 'react';
import MatchCard from './components/MatchCard';
import type { MatchEntry } from './components/MatchCard';
import Home from './components/Home';

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


function App() {
  const [error, setError] = useState<string | null>(null);
  const [allMatchData, setAllMatchData] = useState<Map<string, MatchEntry>>(new Map());

  useEffect(() => {
    const es = new EventSource('matchdata/stream');
    es.onmessage = (e: MessageEvent) => {
      const points: any[] = JSON.parse(e.data);

      setAllMatchData(prev => {
        const nextMap = new Map(prev);

        for (const json of points) {
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

          console.log(`[${json.matchId}] events:`, nextMap.get(json.matchId)?.events);
        }

        return nextMap;
      });

      console.log(`Received ${points.length} point(s) from stream`);
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <Home />
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

      {/* Live matches */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold !text-black uppercase tracking-widest mb-3">Completed</h2>
        <div className="flex flex-wrap gap-4">
          {[...allMatchData.values()].map(entry => (
            <MatchCard key={entry.matchId} entry={entry} />
          ))}
        </div>
      </div>

      {/* Completed matches */}
      <div>
        <h2 className="text-sm font-semibold !text-black uppercase tracking-widest mb-3">Live</h2>
        <div className="flex flex-wrap gap-4">
        </div>
      </div>

    </div>
  );
}

export default App;
