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

export default function PointCard({ point }: PointCardProps) {
  // const isAce = winner.pointEndType === 'Ace';
  // const courtLabel = winner.court === 'DeuceCourt' ? 'Deuce' : winner.court === 'AdCourt' ? 'Ad' : winner.court;
  // const serveLabel = winner.serveNumber === 1 ? '1st' : '2nd';
  const winner = point.scorer == '1' ? point.team1 : point.team2;
  const loser = point.scorer == '1' ? point.team2 : point.team1;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm w-72">
      <span>{keyToPoint[point.result]}</span>
      <span>
        {point.result == 'UE' || point.result == 'DF' ? 
          `${loser.lastName}` :
          `${winner.lastName}` 
        }
      </span>
      <span>{point.rallyLength} shots</span>
      <span></span>
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
  