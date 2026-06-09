import { useEffect, useState } from 'react';
import MatchCardSlim from './MatchCardSlim';
import type { MatchEntry } from '../components/MatchCard';
import type { MatchEvent, TeamSnapshot } from '../App';

export interface SidebarProps {}

function Sidebar() {
  const [error, setError] = useState<string | null>(null);
  const [allMatchData, setAllMatchData] = useState<Map<string, MatchEntry>>(new Map());

  useEffect(() => {
    const es = new EventSource('http://localhost:3000/matchdata/stream');

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
            playerTeam: json.playerTeam as TeamSnapshot,
            opponentTeam: json.opponentTeam as TeamSnapshot,
            events: newEvents,
          });
        }

        return nextMap;
      });
    };

    es.onerror = () => setError('Lost connection');
    return () => es.close();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-sm font-bold !text-black uppercase tracking-widest">Roland Garros</h1>
      </div>

      {/* Match list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {error && (
          <div className="text-xs text-gray-400 text-center py-4">{error}</div>
        )}

        {allMatchData.size === 0 && !error && (
          <div className="text-xs text-gray-400 text-center py-4">Waiting for matches…</div>
        )}

        {[...allMatchData.values()].map(entry => (
          <MatchCardSlim key={entry.matchId} entry={entry} />
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
