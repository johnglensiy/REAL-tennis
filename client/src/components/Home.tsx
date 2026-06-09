import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type MatchStatus = 'live' | 'final' | 'upcoming';
type Tour = 'men' | 'women';

interface Player {
  name: string;
  country: string;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

interface Match {
  id: string;
  status: MatchStatus;
  meta: string;
  live?: string;
  href?: string;
  a: Player;
  b: Player;
}

interface Tournament {
  name: string;
  tour: Tour;
  detail: string;
  matches: Match[];
}

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
// Atoms
// ─────────────────────────────────────────────────────────────

function FlagBox({ code }: { code: string }) {
  return (
    <span className="mono" style={{
      width: 24, height: 16, borderRadius: 2,
      border: '1px solid var(--stroke)', background: 'var(--bg)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 8, color: 'var(--ink-2)', letterSpacing: '0.02em', flex: '0 0 auto',
    }}>{code}</span>
  );
}

function BallDot({ color = 'var(--accent)' }: { color?: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, border: '1px solid ' + color,
      boxShadow: 'inset -1.5px -1.5px 0 rgba(0,0,0,0.08)', flex: '0 0 auto',
    }} />
  );
}

function StatusTag({ m }: { m: Match }) {
  if (m.status === 'live') {
    return (
      <span className="mono" style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 6px', borderRadius: 3,
        border: '1px solid var(--hot)', color: 'var(--hot)', background: 'var(--paper)',
        fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap',
      }}><span className="live-dot">●</span> LIVE</span>
    );
  }
  if (m.status === 'final') {
    return (
      <span className="mono" style={{
        fontSize: 11, fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>Final</span>
    );
  }
  return (
    <span className="mono" style={{
      fontSize: 11, fontWeight: 600, color: 'var(--mute)',
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>Upcoming</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Match card
// ─────────────────────────────────────────────────────────────

function PlayerLine({ p, maxSets, status }: { p: Player; maxSets?: number; status: MatchStatus }) {
  const dim = p.winner === false || (status === 'final' && !p.winner);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '10px 24px 1fr auto',
      alignItems: 'center',
      gap: 8,
      padding: '6px 0',
    }}>
      {/* serve dot */}
      <span style={{ display: 'flex', justifyContent: 'center' }}>
        {p.serving ? <BallDot /> : null}
      </span>

      <FlagBox code={p.country} />

      <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{
          fontSize: 14, fontWeight: p.winner ? 700 : 600,
          color: dim ? 'var(--mute)' : 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{p.name}</span>
        {p.seed && p.seed !== '—' && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)', flex: '0 0 auto' }}>({p.seed})</span>
        )}
      </div>

      {/* set scores + current pts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {p.sets && p.sets.map((s, i) => {
            const isLast = i === p.sets!.length - 1;
            const live = status === 'live' && isLast;
            return (
              <span key={i} className="mono" style={{
                width: 12, textAlign: 'center',
                fontSize: 15, fontWeight: 600,
                color: live ? 'var(--ink)' : (dim ? 'var(--mute)' : 'var(--ink-2)'),
              }}>{s}</span>
            );
          })}
        </div>
        {status === 'live' && p.pts != null && (
          <span className="mono" style={{
            minWidth: 26, textAlign: 'center',
            fontSize: 15, fontWeight: 700,
            color: p.serving ? 'var(--on-accent)' : 'var(--ink)',
            background: p.serving ? 'var(--accent)' : 'var(--bg)',
            border: '1px solid ' + (p.serving ? 'var(--accent)' : 'var(--stroke)'),
            borderRadius: 4, padding: '1px 4px',
          }}>{p.pts}</span>
        )}
        {status === 'upcoming' && (
          <span className="mono" style={{ minWidth: 26, textAlign: 'center', fontSize: 13, color: 'var(--stroke)' }}>–</span>
        )}
      </div>
    </div>
  );
}

function MatchCard({ m, livePulse }: { m: Match; livePulse?: boolean }) {
  const isLive = m.status === 'live';
  const inner = (
    <div className={isLive && livePulse ? 'live-pulse' : undefined} style={{
      width: 252,
      scrollSnapAlign: 'start',
      background: 'var(--paper)',
      border: '1px solid ' + (isLive && livePulse ? 'var(--hot)' : 'var(--stroke)'),
      borderRadius: 8,
      padding: '9px 12px 8px',
      display: 'flex', flexDirection: 'column',
      cursor: m.href ? 'pointer' : 'default',
      position: 'relative',
    }}>
      {/* card header: status + meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, minHeight: 20 }}>
        <StatusTag m={m} />
        <span className="mono note">{m.meta}</span>
      </div>

      <div style={{ height: 1, background: 'var(--stroke-soft)', margin: '7px 0 1px' }} />

      <PlayerLine p={m.a} status={m.status} />
      <div style={{ height: 1, background: 'var(--stroke-soft)' }} />
      <PlayerLine p={m.b} status={m.status} />

      {/* footer: every card has one so heights match */}
      <div style={{
        marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--stroke)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span className="mono note">
          {m.status === 'live' ? 'Live scoreboard'
            : m.status === 'final' ? 'Match summary'
            : 'Match preview'}
        </span>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>›</span>
      </div>
    </div>
  );

  if (m.href) {
    return <a href={m.href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{inner}</a>;
  }
  return inner;
}
// ─────────────────────────────────────────────────────────────
// Tournament section
// ─────────────────────────────────────────────────────────────

function TournamentSection({ t, livePulse }: { t: Tournament; livePulse?: boolean }) {
  const liveCount = t.matches.filter(m => m.status === 'live').length;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{t.name}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
            {t.detail}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {liveCount > 0 && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--hot)', fontWeight: 600, letterSpacing: '0.06em' }}>
              {liveCount} LIVE
            </span>
          )}
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>All ›</span>
        </div>
      </div>

      {/* side-scrolling rail: 2 rows, flow into columns, overflow scrolls right */}
      <div className="hscroll" style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridTemplateRows: 'repeat(2, auto)',
        gridAutoColumns: 'max-content',
        alignItems: 'start',
        gap: 10,
        padding: '0 16px 4px',
      }}>
        {t.matches.map(m => <MatchCard key={m.id} m={m} livePulse={livePulse} />)}
        {/* trailing affordance */}
        <div style={{ width: 4 }} />
      </div>
    </div>
  );
}

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

function Home() {
  const [tour, setTour] = useState<Tour>('men');
  const shown = TOURNAMENTS.filter(t => t.tour === tour);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg)',
      overflowY: 'auto', overflowX: 'hidden',
      fontFamily: 'var(--font-sans)',
      paddingTop: 54,
    }}>
      {/* annotation strip */}
      <div style={{
        padding: '6px 16px', background: 'var(--bg)',
        borderBottom: '1px dashed var(--stroke)',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span className="mono note">// home · today's matches</span>
        <span className="mono note">v0.1 — wireframe</span>
      </div>

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