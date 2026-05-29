import type { TeamSnapshot } from "../App";

interface Point {
    result: string;
    rallyLength: number;
    team1: TeamSnapshot;
    team2: TeamSnapshot;
    scorer: string;
}

interface PointCardProps {
  point: Point;
}

const shotLabel: Record<string, string> = {
  ForeHand: 'FH',
  BackHand: 'BH',
  NA: 'Sv',
};

const shotChipClass: Record<string, string> = {
  ForeHand: 'bg-blue-100 text-blue-600',
  BackHand: 'bg-violet-100 text-violet-600',
  NA: 'bg-gray-100 text-gray-500',
};

const handClass: Record<string, string> = {
  ForeHand: 'text-blue-600',
  BackHand: 'text-violet-600',
  NA: 'text-gray-500',
};

const keyToPoint: Record<string, string> = {
  'UE': 'Unforced Error',
  'FE': 'Forced Error',
  'W': 'Winner',
  'A': 'Ace',
  'DF': 'Double Fault'
}

function StatCell({ label, children }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'white',
    }}>
      <div className="mono" style={{
        fontSize: 10, color: 'gray', letterSpacing: '0.04em',
        textTransform: 'capitalize', marginBottom: 6, lineHeight: 1.25, minHeight: 24,
      }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function PointCard({ point }: PointCardProps) {
  // const isAce = winner.pointEndType === 'Ace';
  // const courtLabel = winner.court === 'DeuceCourt' ? 'Deuce' : winner.court === 'AdCourt' ? 'Ad' : winner.court;
  // const serveLabel = winner.serveNumber === 1 ? '1st' : '2nd';
  const winner = point.scorer == '1' ? point.team1 : point.team2;
  const loser = point.scorer == '1' ? point.team2 : point.team1;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm w-full">
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--stroke-soft)',
        background: 'var(--paper)',
        outline: '1px solid black'
      }}>
        {/* avatar placeholder */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          marginTop: 32,
          border: '1px dashed var(--stroke)',
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11, color: 'var(--mute)', fontWeight: 600,
        }}>who</div>

        <div className={'border'}>
          {/* set game time header */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.06em' }}>
              S · G · time
            </span>
          </div>

          {/* headers */}
          <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, textTransform: 'capitalize'}}>
            {keyToPoint[point.result]}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
          {point.result == 'UE' || point.result == 'DF' ? 
            `${loser.lastName} 3 unforced errors` :
            `${winner.lastName} 3 winners`
          }
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
            Break point saved
          </div>

          {/* stats grid */}
          <div className="mono" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'gray',
          }}>
            <StatCell label="Rally length">{point.rallyLength} shot{point.rallyLength > 1 ? 's' : ''}</StatCell>
            <StatCell label="Stroke">NA</StatCell>
            <StatCell label="Hand">Forehand</StatCell>
            <StatCell label="Spin">0 RPM</StatCell>
            <StatCell label="Height above ground">3.9 feet</StatCell>
            <StatCell label="Speed">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  106 mph
                </span>
              </div>
            </StatCell>
          </div>
        </div>
      </div>
    </div>

    
  );
}

function Stat({ label, value, valueClass = 'text-gray-800' }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
  