interface WinnerPoint {
  pointId: string;
  pointEndType: string;
  serverName: string;
  serverCountry: string;
  receiverName: string;
  receiverCountry: string;
  serveSpeed: string;
  serveType: string;
  serveNumber: number;
  hand: string;
  placement: string;
  court: string;
  rallyLength: number;
  shotSequence: string[];
  set: number;
  game: number;
  point: number;
  playerGameScore: string;
  opponentGameScore: string;
  netClearance: string;
  ballHeightAtNet: string;
  breakPoint: boolean;
  isSetWinning: boolean;
  isMatchWinning: boolean;
}

interface WinnerCardProps {
  winner: WinnerPoint;
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

export default function WinnerCard({ winner }: WinnerCardProps) {
  const isAce = winner.pointEndType === 'Ace';
  const courtLabel = winner.court === 'DeuceCourt' ? 'Deuce' : winner.court === 'AdCourt' ? 'Ad' : winner.court;
  const serveLabel = winner.serveNumber === 1 ? '1st' : '2nd';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm w-72">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 tracking-wide">
          S{winner.set} · G{winner.game} · P{winner.point}
        </span>
        <div className="flex items-center gap-1">
          {winner.breakPoint && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">BP</span>
          )}
          {winner.isSetWinning && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Set</span>
          )}
          {winner.isMatchWinning && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">Match</span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isAce ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700'}`}>
            {winner.pointEndType}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 flex-1">{winner.serverName}</span>
          <span className="text-xs text-gray-400 font-medium">{winner.serverCountry}</span>
          <span className="text-sm font-bold text-gray-700 min-w-6 text-right">{winner.playerGameScore}</span>
        </div>
        <div className="flex items-center gap-2 opacity-50">
          <span className="text-sm font-semibold text-gray-900 flex-1">{winner.receiverName}</span>
          <span className="text-xs text-gray-400 font-medium">{winner.receiverCountry}</span>
          <span className="text-sm font-bold text-gray-700 min-w-6 text-right">{winner.opponentGameScore}</span>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <Stat label="Hand" value={winner.hand} valueClass={handClass[winner.hand] ?? 'text-gray-800'} />
        <Stat label="Placement" value={winner.placement} />
        <Stat label="Court" value={courtLabel} />
        <Stat label="Serve" value={`${serveLabel} · ${winner.serveType}`} />
        <Stat label="Speed" value={winner.serveSpeed} />
        <Stat label="Rally" value={`${winner.rallyLength} shot${winner.rallyLength !== 1 ? 's' : ''}`} />
        <Stat label="Net Clear" value={winner.netClearance} />
        <Stat label="Ball @ Net" value={winner.ballHeightAtNet} />
      </div>

      {/* Shot Sequence */}
      {winner.shotSequence.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {winner.shotSequence.map((shot, i) => (
            <span
              key={i}
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${shotChipClass[shot] ?? 'bg-gray-100 text-gray-500'}`}
            >
              {shotLabel[shot] ?? shot}
            </span>
          ))}
        </div>
      )}
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
