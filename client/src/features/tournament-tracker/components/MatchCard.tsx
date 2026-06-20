import type { MatchStateOld } from "../../../../../common/types";
import PlayerLine from "./PlayerLine";

// function StatusTag({ m }: { m: Match }) {
//   if (m.status === 'live') {
//     return (
//       <span className="mono" style={{
//         display: 'inline-flex', alignItems: 'center', gap: 4,
//         padding: '2px 6px', borderRadius: 3,
//         border: '1px solid var(--hot)', color: 'var(--hot)', background: 'var(--paper)',
//         fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap',
//       }}><span className="live-dot">●</span> LIVE</span>
//     );
//   }
//   if (m.status === 'final') {
//     return (
//       <span className="mono" style={{
//         fontSize: 11, fontWeight: 700, color: 'var(--ink)',
//         letterSpacing: '0.06em', textTransform: 'uppercase',
//       }}>Final</span>
//     );
//   }
//   return (
//     <span className="mono" style={{
//       fontSize: 11, fontWeight: 600, color: 'var(--mute)',
//       letterSpacing: '0.04em', textTransform: 'uppercase',
//     }}>Upcoming</span>
//   );
// }

export default function MatchCard({ m, livePulse }: { m: MatchStateOld; livePulse?: boolean }) {
    const isLive = m.status === 'live';
    const inner = (
      <div className={isLive && livePulse ? 'live-pulse' : undefined} style={{
        width: 344,
        scrollSnapAlign: 'start',
        background: 'var(--paper)',
        border: '1px solid ' + (isLive && livePulse ? 'var(--hot)' : 'var(--stroke)'),
        borderRadius: 8,
        padding: '9px 12px 8px',
        display: 'flex', flexDirection: 'column',
        cursor: m.href ? 'pointer' : 'default',
        position: 'relative',
      }}>
        {/* card header: round + court on left and match data right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, minHeight: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0,
            fontSize: 13, whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Quarterfinal</span>
            <span style={{ color: 'var(--mute)' }}>· Center Court</span>
          </span>
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