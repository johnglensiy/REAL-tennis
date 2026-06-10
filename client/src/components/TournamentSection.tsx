export type MatchStatus = 'live' | 'final' | 'upcoming';
export type Tour = 'men' | 'women';

export interface Player {
  name: string;
  country: string;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  meta: string;
  live?: string;
  href?: string;
  a: Player;
  b: Player;
}

export interface Tournament {
  name: string;
  tour: Tour;
  detail: string;
  matches: Match[];
}

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

function PlayerLine({ p, status }: { p: Player; status: MatchStatus }) {
  const dim = p.winner === false || (status === 'final' && !p.winner);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '10px 24px 1fr auto',
      alignItems: 'center',
      gap: 8,
      padding: '6px 0',
    }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, minHeight: 20 }}>
        <StatusTag m={m} />
        <span className="mono note">{m.meta}</span>
      </div>

      <div style={{ height: 1, background: 'var(--stroke-soft)', margin: '7px 0 1px' }} />

      <PlayerLine p={m.a} status={m.status} />
      <div style={{ height: 1, background: 'var(--stroke-soft)' }} />
      <PlayerLine p={m.b} status={m.status} />

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

export default function TournamentSection({ t, livePulse }: { t: Tournament; livePulse?: boolean }) {
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
        <div style={{ width: 4 }} />
      </div>
    </div>
  );
}
