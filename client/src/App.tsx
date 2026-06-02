import { useEffect, useState } from 'react';
import PointCard from './components/PointCard';
import PlayerRow from './components/PlayerRow';

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

interface MatchEntry {
  matchId: string;
  matchStatus: string;
  playerTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  points: { 
    id: string,
    playerGameScore: number,
    playerSetScores: number[] | null,
    opponentGameScore: number,
    opponentSetScores: number[] | null,
    result: string,
    rallyLength: number,
    scorer: '1' | '2', 
    timeElapsed: number 
  }[];
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

        nextMap.set(json.matchId, {
          matchId: json.matchId,
          matchStatus: json.matchStatus,
          playerTeam: json.playerTeam,
          opponentTeam: json.opponentTeam,
          points: [...(entryToUpdate?.points ?? []), 
            { 
              id: json.pointId,
              playerGameScore: json.playerGameScore,
              playerSetScores: json.playerSetScores,
              opponentGameScore: json.opponentGameScore,
              opponentSetScores: json.opponentSetScores,
              result: json.result,
              rallyLength: json.rallyLength, 
              scorer: json.scorer,
              timeElapsed: json.timeElapsedInSeconds
            }]
        });

        const updated = nextMap.get(json.matchId);
        console.log(`[${json.matchId}] points array:`, updated?.points);
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
        const sets = entry.playerTeam.setScores
          .map((a, i) => ({ a: a ?? 0, b: entry.opponentTeam.setScores[i] ?? 0, tb: null }))
          .filter((_, i) => entry.playerTeam.setScores[i] !== null || entry.opponentTeam.setScores[i] !== null);
        return (
          <div key={entry.matchId} className="mb-6 w-150 outline">
            <PlayerRow
              who="a"
              firstName={entry.playerTeam.firstName}
              lastName={entry.playerTeam.lastName}
              seed={entry.playerTeam.seed}
              country={entry.playerTeam.country}
              sets={sets}
              point={Number(entry.playerTeam.gameScore) || 0}
              isServing={entry.playerTeam.isServer}
              won={entry.matchStatus === 'F'}
              ballColor="yellow"
            />
            <PlayerRow
              who="b"
              firstName={entry.opponentTeam.firstName}
              lastName={entry.opponentTeam.lastName}
              seed={entry.opponentTeam.seed}
              country={entry.opponentTeam.country}
              sets={sets}
              point={Number(entry.opponentTeam.gameScore) || 0}
              isServing={entry.opponentTeam.isServer}
              won={entry.matchStatus === 'F'}
              ballColor="yellow"
            />
            <div style={{ display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
              {entry.points.map((p, _) => (
                <PointCard 
                  key={p.id} 
                  point={{ 
                    playerGameScore: p.playerGameScore,
                    playerSetScores: p.playerSetScores,
                    opponentGameScore: p.opponentGameScore,
                    opponentSetScores: p.opponentSetScores,
                    result: p.result,
                    rallyLength: p.rallyLength, 
                    team1: entry.playerTeam,
                    team2: entry.opponentTeam,
                    scorer: p.scorer,
                    timeElapsed: p.timeElapsed
                  }} />
              ))}
            </div>
          </div>
        );
      })}
      </div>

    </div>
  );
}

export default App;
