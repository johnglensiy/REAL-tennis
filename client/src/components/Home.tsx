import { useState, useMemo } from 'react';
import TournamentSection from './TournamentSection';
import type { Tour, Tournament } from './TournamentSection';
import type { MatchEntry } from './MatchCard';

interface DateItem {
  dow: string;
  d: string;
  today?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const DATES: DateItem[] = [
  { dow: 'Sun', d: 'Jun 6' },
  { dow: 'Mon', d: 'Jun 7' },
  { dow: 'Tue', d: 'Jun 8', today: true },
  { dow: 'Wed', d: 'Jun 9' },
  { dow: 'Thu', d: 'Jun 10' },
  { dow: 'Fri', d: 'Jun 11' },
  { dow: 'Sat', d: 'Jun 12' },
];

// m: match. status 'live' | 'final' | 'upcoming'
// players: [A, B] each { name, country, seed, sets:[..], pts, serving, winner }
const TOURNAMENTS: Tournament[] = [
  {
    name: 'Wimbledon',
    tour: 'men',
    detail: "Gentlemen's Singles · R16 · Grass",
    matches: [
      { id: 'main', status: 'live', meta: 'Set 4 · 2:14', live: 'LIVE', href: 'Tennis Scoreboard.html',
        a: { name: 'A. Sinclair', country: 'GBR', seed: '4',  sets: [6,3,7,2], pts: '30', serving: true },
        b: { name: 'M. Okonkwo',  country: 'NGR', seed: '11', sets: [4,6,6,1], pts: '15' } },
      { id: 'm2', status: 'live', meta: 'Set 2 · 0:51', live: 'LIVE',
        a: { name: 'L. Vasquez',  country: 'ESP', seed: '2',  sets: [6,3], pts: '40', serving: true },
        b: { name: 'F. Lindqvist', country: 'SWE', seed: '15', sets: [4,2], pts: '15' } },
      { id: 'm3', status: 'final', meta: 'Final · 2:38',
        a: { name: 'T. Haas',     country: 'GER', seed: '7',  sets: [7,6,6], winner: true },
        b: { name: 'D. Petrov',   country: 'BUL', seed: '9',  sets: [5,7,3] } },
      { id: 'm4', status: 'final', meta: 'Final · 1:54',
        a: { name: 'K. Nakamura', country: 'JPN', seed: '5',  sets: [6,6], winner: true },
        b: { name: 'É. Dubois',   country: 'FRA', seed: '12', sets: [3,4] } },
      { id: 'm5', status: 'upcoming', meta: 'Today · 16:00',
        a: { name: 'R. Costa',    country: 'POR', seed: '8' },
        b: { name: 'S. Ali',      country: 'PAK', seed: '—' } },
    ],
  },
  {
    name: 'Wimbledon',
    tour: 'women',
    detail: "Ladies' Singles · R16 · Grass",
    matches: [
      { id: 'w1', status: 'live', meta: 'Set 3 · 1:42', live: 'LIVE',
        a: { name: 'N. Adeyemi',  country: 'NGR', seed: '1',  sets: [4,6,2], pts: '0', serving: true },
        b: { name: 'P. Novak',    country: 'CZE', seed: '6',  sets: [6,4,3], pts: '15' } },
      { id: 'w2', status: 'final', meta: 'Final · 1:12',
        a: { name: 'C. Romano',   country: 'ITA', seed: '3',  sets: [6,6], winner: true },
        b: { name: 'H. Sørensen', country: 'DEN', seed: '14', sets: [2,1] } },
      { id: 'w3', status: 'upcoming', meta: 'Today · 17:30',
        a: { name: 'M. Ivanova',  country: 'BLR', seed: '10' },
        b: { name: 'J. Park',     country: 'KOR', seed: '13' } },
    ],
  },
  {
    name: 'Eastbourne Intl',
    tour: 'men',
    detail: 'ATP 250 · Quarterfinals · Grass',
    matches: [
      { id: 'e1', status: 'live', meta: 'Set 1 · 0:23', live: 'LIVE',
        a: { name: 'B. Müller',   country: 'AUT', seed: '4',  sets: [3], pts: 'Ad', serving: true },
        b: { name: 'O. Traoré',   country: 'CIV', seed: '—',  sets: [2], pts: '40' } },
      { id: 'e2', status: 'upcoming', meta: 'Today · 15:00',
        a: { name: 'G. Rossi',    country: 'ITA', seed: '1' },
        b: { name: 'A. Kovač',    country: 'SRB', seed: '7' } },
      { id: 'e3', status: 'upcoming', meta: 'Today · 18:45',
        a: { name: 'D. Schmidt',  country: 'GER', seed: '3' },
        b: { name: 'V. Horvat',   country: 'SLO', seed: '—' } },
    ],
  },
  {
    name: 'Bad Homburg Open',
    tour: 'women',
    detail: 'WTA 500 · Quarterfinals · Grass',
    matches: [
      { id: 'b1', status: 'live', meta: 'Set 2 · 1:08', live: 'LIVE',
        a: { name: 'S. Kovačević', country: 'CRO', seed: '2',  sets: [6,4], pts: '40', serving: true },
        b: { name: 'A. Bauer',     country: 'GER', seed: '—',  sets: [3,3], pts: '30' } },
      { id: 'b2', status: 'final', meta: 'Final · 1:31',
        a: { name: 'L. Fontaine',  country: 'FRA', seed: '1',  sets: [7,6], winner: true },
        b: { name: 'Y. Tan',       country: 'CHN', seed: '8',  sets: [5,3] } },
      { id: 'b3', status: 'upcoming', meta: 'Today · 16:15',
        a: { name: 'E. Larsson',   country: 'SWE', seed: '4' },
        b: { name: 'R. Mehta',     country: 'IND', seed: '—' } },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Date strip
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

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

interface HomeProps {
    liveMatchData: Map<string, MatchEntry>;
}

function Home({ liveMatchData }: HomeProps) {
  console.log('liveMatchData size:', liveMatchData.size);
  const [tour, setTour] = useState<Tour>('men');
  const shown = TOURNAMENTS.filter(t => t.tour === tour);

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

      {shown.map((tt, i) => <TournamentSection key={tt.name + i} t={tt} />)}

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

export default Home;