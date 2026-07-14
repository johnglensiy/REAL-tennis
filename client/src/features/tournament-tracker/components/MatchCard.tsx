import type { MatchStateOld } from "../../../../../common/types";
import PlayerLine from "./PlayerLine";
import { useAppDispatch } from "../../../hooks";
import { screenPushed } from "../navigationSlice";

/**
 * Reduces a verbose schedule time like "Day 4 Starts At 16:00" to just "16:00".
 * "Not Before" slots are tentative (`tentative: true`) and get a trailing
 * superscript asterisk at render. Falls back to the raw string if no HH:MM.
 */
function formatTime(raw?: string): { time: string; tentative: boolean } {
  if (!raw) return { time: "", tentative: false };
  const time = raw.match(/\b\d{1,2}:\d{2}\b/)?.[0] ?? raw;
  return { time, tentative: /not before/i.test(raw) };
}

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
    const dispatch = useAppDispatch();
    const isLive = m.status === 'live';
    const inner = (
      <div
        className={isLive && livePulse ? 'live-pulse' : undefined}
        onClick={() => dispatch(screenPushed({ name: 'Match', params: { matchId: m.id } }))}
        style={{
        width: 344,
        scrollSnapAlign: 'start',
        background: 'var(--paper)',
        border: '1px solid ' + (isLive ? 'var(--hot)' : 'var(--stroke)'),
        borderRadius: 8,
        padding: '9px 12px 8px',
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
      }}>
        {/* card header: round + court on left and match data right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, minHeight: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0,
            fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            {m.round && <span style={{ fontWeight: 600, color: 'var(--ink)', flex: '0 0 auto' }}>{m.round}</span>}
            {m.court && (
              <span style={{ color: 'var(--mute)', overflow: 'hidden', textOverflow: 'ellipsis' }}>· {m.court}</span>
            )}
          </span>
          {(() => {
            const t = formatTime(m.time);
            return (
              <span className="mono note" style={{ flex: '0 0 auto' }}>
                {t.time || m.meta}
                {t.tentative && <sup style={{ marginLeft: 1 }}>*</sup>}
              </span>
            );
          })()}
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
  
    return inner;
}