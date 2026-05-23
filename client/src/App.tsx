import { useEffect, useState } from 'react';
import WinnerCard from './components/WinnerCard';
import PlayerRow from './components/PlayerRow';

import './App.css';

interface WinnerPoint {
  pointId: string;
  pointEndType: string;
  serverName: string;
  serverCountry: string;
  receiverName: string;
  receiverCountry: string;
  serveSpeed: string;
  serveType: string;
  serveNumber: number;
  hand: string;
  placement: string;
  court: string;
  rallyLength: number;
  shotSequence: string[];
  set: number;
  game: number;
  point: number;
  playerGameScore: string;
  opponentGameScore: string;
  netClearance: string;
  ballHeightAtNet: string;
  breakPoint: boolean;
  isSetWinning: boolean;
  isMatchWinning: boolean;
}

interface WinnersData {
  matchType: string;
  playerName: string;
  playerCountry: string;
  opponentName: string;
  opponentCountry: string;
  opponentSeed: string;
  winners: WinnerPoint[];
}

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


function App() {
  const [data, setData] = useState<WinnersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData[] | null>(null);

  useEffect(() => {
    const es = new EventSource('matchdata/stream');
    es.onmessage = (e: MessageEvent) => {
      const parsed = JSON.parse(e.data);
      setMatchData(Array.isArray(parsed) ? parsed : [parsed]);
    };
    es.onerror = () => setError('Lost connection to match data stream');
    return () => es.close();
  }, []);

  // useEffect(() => {
  //   fetch('/winners')
  //     .then(res => res.json())
  //     .then(setData)
  //     .catch(err => setError(err.message));
  // }, []);

  useEffect(() => {
    const es = new EventSource('/stream');

    es.onmessage = (e: MessageEvent) => {
      const point: WinnerPoint = JSON.parse(e.data);
      setData(prev => prev ? { ...prev, winners: [...prev.winners, point] } : prev);
    };

    es.onerror = (e: Event) => {
      console.error('SSE error', e);
    };

    return () => es.close();
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Error: {error}
    </div>
  );

  // if (!data) return <div>Loading winners...</div>;
  if (!matchData) return <div>Loading match data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
      {/* Title */}
      {/* <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          {data.playerName}
          <span className="text-base font-normal text-gray-400 mx-2">vs</span>
          {data.opponentName}
          {data.opponentSeed && (
            <span className="text-sm font-medium text-gray-400 ml-2">#{data.opponentSeed}</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {data.matchType} · {data.winners.length} winners
        </p>
      </div> */}

      {matchData.map(match => {
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
              isServing={false}
              won={match.matchStatus === 'F'}
              ballColor="yellow"
            />
          </div>
        );
      })}

      {/* Cards */}
      {/* <div className="flex flex-wrap gap-4">
        {data.winners.map(w => (
          <WinnerCard key={w.pointId} winner={w} />
        ))}
      </div> */}
    </div>
  );
}

export default App;
