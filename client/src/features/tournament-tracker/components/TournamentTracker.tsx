import { useState, useMemo } from 'react';
import TournamentSection from './TournamentSection';
import type { Tour, Tournament } from './TournamentSection';
import type { MatchEntry } from '../../../components/MatchCard';

import { useAppSelector } from '../../../hooks';

interface DateItem {
  dow: string;
  d: string;
  today?: boolean;
}

const DATES: DateItem[] = [
  { dow: 'Sun', d: 'Jun 6' },
  { dow: 'Mon', d: 'Jun 7' },
  { dow: 'Tue', d: 'Jun 8', today: true },
  { dow: 'Wed', d: 'Jun 9' },
  { dow: 'Thu', d: 'Jun 10' },
  { dow: 'Fri', d: 'Jun 11' },
  { dow: 'Sat', d: 'Jun 12' },
];

function DateStrip() {
  return (
    <div className="hscroll" style={{
      display: 'flex', gap: 4, padding: '4px 12px 12px',
      borderBottom: '1px solid var(--stroke)', background: 'var(--paper)',
    }}>
      {DATES.map((dt, i) => (
        <div key={i} style={{
          flex: '0 0 auto', minWidth: 56,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 10px', borderRadius: 8,
          background: dt.today ? 'var(--sel)' : 'transparent',
        }}>
          <span className="mono" style={{
            fontSize: 10, letterSpacing: '0.04em',
            color: dt.today ? 'var(--sel-ink)' : 'var(--mute)',
            opacity: dt.today ? 0.7 : 1,
          }}>{dt.d}</span>
          <span style={{
            fontSize: 16, fontWeight: 700, marginTop: 2,
            color: dt.today ? 'var(--sel-ink)' : 'var(--ink-2)',
          }}>{dt.dow}</span>
        </div>
      ))}
    </div>
  );
}

function Tabs({ active, onChange }: { active: Tour; onChange: (t: Tour) => void }) {
  const items: { key: Tour; label: string }[] = [
    { key: 'men', label: "Men" },
    { key: 'women', label: "Women" },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--paper)', borderBottom: '1px solid var(--stroke)',
    }}>
      {items.map((it, i) => {
        const on = it.key === active;
        return (
          <div key={it.key} onClick={() => onChange(it.key)} style={{
            flex: 1, padding: '5px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: i === 1 ? '1px solid var(--stroke-soft)' : 'none',
            borderBottom: on ? '2px solid var(--ink)' : '2px solid transparent',
            cursor: 'pointer',
          }}>
            <span style={{
              fontSize: 13, fontWeight: on ? 600 : 500,
              color: on ? 'var(--ink)' : 'var(--mute)',
              letterSpacing: '0.01em',
            }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface TournamentTrackerProps {
    liveMatchData: Map<string, MatchEntry>;
}

function TournamentTracker({ liveMatchData }: TournamentTrackerProps) {
  console.log('liveMatchData size:', liveMatchData.size);
  const [tour, setTour] = useState<Tour>('men');

  const allTournaments = useAppSelector(state => state.tournaments).filter(t => t.tour === tour);

  {/* cast liveMatchData as a tournament */}
  const liveTournament: Tournament = useMemo(() => ({
    name: 'Live',
    tour: tour,
    detail: 'In progress',
    matches: [...liveMatchData.values()].map(entry => ({
      id: entry.matchId,
      status: 'live' as const,
      meta: '',
      a: {
        name: `${entry.playerTeam.firstName[0]}. ${entry.playerTeam.lastName}`,
        country: entry.playerTeam.country,
        seed: String(entry.playerTeam.seed),
        serving: entry.playerTeam.isServer,
        pts: entry.playerTeam.gameScore,
        sets: entry.playerTeam.setScores.filter(s => s !== null) as number[],
      },
      b: {
        name: `${entry.opponentTeam.firstName[0]}. ${entry.opponentTeam.lastName}`,
        country: entry.opponentTeam.country,
        seed: String(entry.opponentTeam.seed),
        serving: entry.opponentTeam.isServer,
        pts: entry.opponentTeam.gameScore,
        sets: entry.opponentTeam.setScores.filter(s => s !== null) as number[],
      },
    })),
  }), [liveMatchData, tour]);

  console.log('liveMatchData size:', liveMatchData.size)

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg)',
      overflowY: 'auto', overflowX: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* app title row */}
      <div style={{
        padding: '14px 16px 10px', background: 'var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Matches</span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--accent-ink)', fontWeight: 600, letterSpacing: '0.04em' }}>
          Rankings ›
        </span>
      </div>

      <DateStrip />

      <Tabs active={tour} onChange={setTour} />

      <div style={{ height: 18 }} />

      {liveMatchData.size > 0 && <TournamentSection key={liveTournament.name} t={liveTournament}/>}

      {allTournaments.map((tt, i) => <TournamentSection key={tt.name + `hi` + i} t={tt}/>)}

      {/* footer */}
      <div style={{ padding: '4px 16px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '1px solid var(--stroke)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', fontSize: 9,
        }}>✓</span>
        <span className="mono note">Official ATP / WTA data</span>
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}

export default TournamentTracker;