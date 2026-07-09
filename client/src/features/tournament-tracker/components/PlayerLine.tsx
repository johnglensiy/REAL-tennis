import ScoreBlock from "./ScoreBlock";

export interface Player {
    name: string;
    country: string;
    seed?: string;
    sets?: number[];
    pts?: string;
    serving?: boolean;
    winner?: boolean;
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

export default function PlayerLine({ p, status }: { p: Player; status: string }) {
    const dim = p.winner === false || (status === 'final' && !p.winner);
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 1fr auto',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
      }}>
        {/* country flag — temporarily replaced by hardcoded avatar to test the look
        <span className="mono" style={{
            width: 24, height: 16, borderRadius: 2,
            border: '1px solid var(--stroke)', background: 'var(--bg)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, color: 'var(--ink-2)', letterSpacing: '0.02em', flex: '0 0 auto',
        }}>
            {p.country}
        </span>
        */}
        <img
            src="https://images.wimbledon.com/square_nobg/atpd643.png"
            alt=""
            style={{
                width: 24, height: 24, borderRadius: '50%',
                objectFit: 'cover', background: 'var(--ink-2)', flex: '0 0 auto',
            }}
        />

        <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{
                fontSize: 14, fontWeight: p.winner ? 700 : 600,
                color: dim ? 'var(--mute)' : 'var(--ink)',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis'
            }}>{p.name}</span>
            {p.seed && p.seed !== '—' && (
                <span className="mono" style={{ fontSize: 10, color: 'var(--mute)', flex: '0 0 auto' }}>({p.seed})</span>
            )}
        </div>
        
        <ScoreBlock p={p} status={status} dim={dim} bestOf={5}/>
      </div>
    );
}