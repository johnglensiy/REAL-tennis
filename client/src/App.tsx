import { useEffect, useState } from 'react';
import PointCard from './components/PointCard';
import PlayerRow from './components/PlayerRow';

import './App.css';

interface TeamSnapshot {
  name: string;
  gameScore: string;
  setScores: (number | null)[];
}

interface MatchData {
  matchId: string;
  matchStatus: string;
  playerTeam: TeamSnapshot;
  opponentTeam: TeamSnapshot;
}

const TEST_STATIC_MATCH_DATA: MatchData[] = [
  {
  matchId: '0000',
  matchStatus: 'P',
  playerTeam: { name: "Carlos Alcaraz", gameScore: "15", setScores: [1, 6, 1]},
  opponentTeam: { name: "Jannik Sinner", gameScore: "15", setScores: [1, 6, 1]},
  },
  {
    matchId: '0001',
    matchStatus: 'P',
    playerTeam: { name: "Alex De Minaur", gameScore: "15", setScores: [1, 6, 1]},
    opponentTeam: { name: "Roger Federer", gameScore: "15", setScores: [1, 6, 1]},
  },
  {
    matchId: '0002',
    matchStatus: 'P',
    playerTeam: { name: "Jack Draper", gameScore: "15", setScores: [1, 6, 1]},
    opponentTeam: { name: "Arthur Fils", gameScore: "15", setScores: [1, 6, 1]},
  }
]

function App() {
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData[]>(TEST_STATIC_MATCH_DATA);
  const [pointData, setPointData] = useState<any | null>([]);

  useEffect(() => {
    const es = new EventSource('matchdata/mock-stream');
    es.onmessage = (e: MessageEvent) => {
      const parsed = JSON.parse(e.data);
      // setPointData(Array.isArray(parsed) ? parsed : [parsed]);
      setMatchData(Array.isArray(parsed) ? parsed : [parsed]);
      setPointData(prev => [...prev, parsed]);
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
          Sinner
          <span className="text-base font-normal text-black mx-2">vs</span>
          Alcaraz
          {/* {data.opponentSeed && (
            <span className="text-sm font-medium text-gray-400 ml-2">#{data.opponentSeed}</span>
          )} */}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {/* {data.matchType} · {data.winners.length} winners */}
        </p>
      </div>

      {matchData?.map(match => {
        const sets = match.playerTeam.setScores
          .map((a, i) => ({ a: a ?? 0, b: match.opponentTeam.setScores[i] ?? 0, tb: null }))
          .filter((_, i) => match.playerTeam.setScores[i] !== null || match.opponentTeam.setScores[i] !== null);
        return (
          <div key={match.matchId} className="mb-6">
            <PlayerRow
              who="a"
              name={match.playerTeam.name}
              seed={0}
              country=""
              sets={sets}
              point={Number(match.playerTeam.gameScore) || 0}
              isServing={false}
              won={match.matchStatus === 'F'}
              ballColor="yellow"
            />
            <PlayerRow
              who="b"
              name={match.opponentTeam.name}
              seed={0}
              country=""
              sets={sets}
              point={Number(match.opponentTeam.gameScore) || 0}
              isServing={true}
              won={match.matchStatus === 'F'}
              ballColor="yellow"
            />
          </div>
        );
      })}

      {pointData?.map(w => (
        <PointCard key={w.pointId} point={{result: w.result, rallyLength: w.rallyLength}} />
      ))
      }

    </div>
  );
}

export default App;
