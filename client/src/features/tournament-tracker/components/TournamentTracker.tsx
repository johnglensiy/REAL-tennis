import { useState, useMemo } from 'react';

import TournamentSection from './TournamentSection';
import type { Tour, Tournament } from '../types';

// to be replaced with TournamentsSlice
import type { MatchEntry } from '../../../components/MatchCard';

import { useAppSelector } from '../../../hooks';

interface DateStripItem {
  dow: string;
  d: string;
  iso: string;
  today: boolean;
}

// local YYYY-MM-DD (avoids toISOString's UTC shift)
const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function calcNearestDates(range=7): DateStripItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toLocalISO(today);

  const items: DateStripItem[] = [];
  for (let offset = -range; offset <= range; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    items.push({
      dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
      d: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric'}),
      iso: toLocalISO(d),
      today: toLocalISO(d) === todayISO,
    });
  }
  return items;
}

// pass in date state and handler
function DateStrip({ sel, onSel }: { sel: number; onSel: (i: number) => void }) {
  const dates = useMemo(() => calcNearestDates(), []);
  return (
    <div className="hscroll" style={{
      display: 'flex', gap: 4, padding: '4px 12px 10px',
      borderBottom: '1px solid var(--stroke)', background: 'var(--paper)',
    }}>
      {dates.map((dt, i) => {
        const on = i === sel;
        return (
          <div key={i} onClick={() => onSel(i)} style={{
            flex: '0 0 auto', minWidth: 52,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '7px 10px 5px', borderRadius: 8, cursor: 'pointer',
            background: on ? 'var(--sel)' : 'transparent',
          }}>
            <span className="mono" style={{
              fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: on ? 'var(--sel-ink)' : 'var(--mute)',
              opacity: on ? 0.75 : 1,
            }}>{dt.dow}</span>
            <span className="mono" style={{
              fontSize: 17, fontWeight: 700, marginTop: 1,
              color: on ? 'var(--sel-ink)' : 'var(--ink-2)',
            }}>{dt.d.split(' ')[1]}</span>
            <span style={{
              width: 4, height: 4, borderRadius: '50%', marginTop: 3,
              background: dt.today ? (on ? 'var(--sel-ink)' : 'var(--accent-ink)') : 'transparent',
            }}></span>
          </div>
        );
      })}
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
  const dates = useMemo(() => calcNearestDates(), []);
  const [dateSel, setDateSel] = useState(() => dates.findIndex(d => d.today));
  const selectedDate = dates[dateSel];

  const allTournaments = useAppSelector(state => state.tournaments).filter(t => t.tour === tour);

  // show only matches scheduled on the selected date; drop tournaments left empty
  const visibleTournaments = allTournaments
    .map(t => ({ ...t, matches: t.matches.filter(m => m.scheduledDate === selectedDate?.iso) }))
    .filter(t => t.matches.length > 0);

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

      <DateStrip sel={dateSel} onSel={setDateSel} />

      <Tabs active={tour} onChange={setTour} />

      <div style={{ height: 18 }} />

      {selectedDate?.today && liveMatchData.size > 0 && <TournamentSection key={liveTournament.name} t={liveTournament}/>}

      {visibleTournaments.map((tt, i) => <TournamentSection key={tt.name + `hi` + i} t={tt}/>)}

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