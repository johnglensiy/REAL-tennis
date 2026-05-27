import { useEffect, useState } from 'react';
import PointCard from './components/PointCard';
import PlayerRow from './components/PlayerRow';

import './App.css';

interface TeamSnapshot {
  firstName: string;
  lastName: string;
  seed: number;
  isServer: boolean; 
  gameScore: string;
  setScores: (number | null)[];
}

interface MatchEntry {
  matchId: string;
  matchStatus: string;
  playerTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
  points: { result: string; rallyLength: number }[];
}

// const TEST_STATIC_MATCH_DATA: MatchData[] = [
//   {
//   matchId: '0000',
//   matchStatus: 'P',
//   playerTeam: { name: "Carlos Alcaraz", gameScore: "15", setScores: [1, 6, 1]},
//   opponentTeam: { name: "Jannik Sinner", gameScore: "15", setScores: [1, 6, 1]},
//   },
//   {
//     matchId: '0001',
//     matchStatus: 'P',
//     playerTeam: { name: "Alex De Minaur", gameScore: "15", setScores: [1, 6, 1]},
//     opponentTeam: { name: "Roger Federer", gameScore: "15", setScores: [1, 6, 1]},
//   },
//   {
//     matchId: '0002',
//     matchStatus: 'P',
//     playerTeam: { name: "Jack Draper", gameScore: "15", setScores: [1, 6, 1]},
//     opponentTeam: { name: "Arthur Fils", gameScore: "15", setScores: [1, 6, 1]},
//   }
// ]

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
          points: [...(entryToUpdate?.points ?? []), { result: json.result, rallyLength: json.rallyLength }]
        });

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
          <div key={entry.matchId} className="mb-6 w-100 outline">
            <PlayerRow
              who="a"
              firstName={entry.playerTeam.firstName}
              lastName={entry.playerTeam.lastName}
              seed={entry.playerTeam.seed}
              country=""
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
              country=""
              sets={sets}
              point={Number(entry.opponentTeam.gameScore) || 0}
              isServing={entry.opponentTeam.isServer}
              won={entry.matchStatus === 'F'}
              ballColor="yellow"
            />
            {entry.points.map((p, i) => (
              <PointCard key={i} point={{ result: p.result, rallyLength: p.rallyLength }} />
            ))}
          </div>
        );
      })}
      </div>

    </div>
  );
}

export default App;
