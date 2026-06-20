export interface Player {
    name: string;
    country: string;
    seed?: string;
    sets?: number[];
    pts?: string;
    serving?: boolean;
    winner?: boolean;
}

// Score block (set columns + live pts) — shared across fit modes.
// Renders placeholder dashes for the unplayed sets up to `bestOf`.
export default function ScoreBlock({ p, status, dim, bestOf = 3, align = 'flex-end' }:
    { p: Player; status: string; dim: boolean; bestOf?: number; align?: string }) {
    const played = p.sets ? p.sets.length : 0;
    // live: dashes fill out to bestOf. upcoming: every potential set is a dash.
    const ghost = status === 'live' ? Math.max(0, bestOf - played)
                : status === 'upcoming' ? bestOf
                : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: align, gap: 8, minHeight: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: ghost }).map((_, i) => (
            <span key={'g' + i} className="mono" style={{
              width: 12, textAlign: 'center',
              fontSize: 15, fontWeight: 600, color: 'var(--stroke)',
            }}>–</span>
          ))}
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
      </div>
    );
}