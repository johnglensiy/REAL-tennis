import 'flag-icons/css/flag-icons.min.css';

const alpha3ToAlpha2: Record<string, string> = {
    ARG: 'ar', AUS: 'au', AUT: 'at', BEL: 'be', BRA: 'br',
    CAN: 'ca', CHI: 'cl', CHN: 'cn', CRO: 'hr', CZE: 'cz',
    DEN: 'dk', ESP: 'es', FRA: 'fr', GBR: 'gb', GER: 'de',
    GRE: 'gr', HUN: 'hu', ITA: 'it', JPN: 'jp', KAZ: 'kz',
    KOR: 'kr', NED: 'nl', NOR: 'no', POL: 'pl', POR: 'pt',
    ROU: 'ro', RSA: 'za', RUS: 'ru', SRB: 'rs', SUI: 'ch',
    SVK: 'sk', SWE: 'se', TPE: 'tw', UKR: 'ua', USA: 'us',
};

interface PlayerRowSlimProps {
    who: string;
    firstName: string;
    lastName: string;
    seed: number;
    country: string;
    sets: { a: number; b: number; tb: [number, number] | null }[];
    point: number | string;
    isServing: boolean;
    won: boolean;
    ballColor: string;
}

function BallDot({ filled = true }: { filled?: boolean }) {
    return (
        <span style={{
            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
            background: filled ? 'var(--accent)' : 'transparent',
            border: '1px solid ' + (filled ? 'var(--accent)' : 'var(--stroke)'),
        }} />
    );
}

export default function PlayerRowSlim(props: PlayerRowSlimProps) {
    const { who, firstName, lastName, seed, country, sets, point, ballColor, isServing } = props;

    return (
        <div
            className="grid items-center gap-x-3 px-3 py-2 outline"
            style={{ gridTemplateColumns: `10px 2px 1fr repeat(${sets.length}, 14px) 36px` }}
        >
            {/* serve dot */}
            <div className="flex justify-center">
                {isServing ? <BallDot /> : <BallDot filled={false} />}
            </div>

            {/* flag */}
            <span className={`fi fi-${alpha3ToAlpha2[country]} text-xs rounded-[2px]`} />

            {/* name */}
            <div className="font-bold text-black text-left truncate" style={{ fontSize: 12 }}>
                {firstName.split(' ').map(n => n[0] + '.').join('')}{' '}
                {lastName.split(' ').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                {seed > 0 && <span className="text-gray-400 ml-1" style={{ fontSize: 10 }}>({seed})</span>}
            </div>

            {/* set scores */}
            {sets.map((s, i) => {
                const isCurrent = i === sets.length - 1;
                const isLeader = i < sets.length - 1 && (
                    (who === 'a' && s.a > s.b) || (who === 'b' && s.b > s.a)
                );
                const v = who === 'a' ? s.a : s.b;
                const tb = s.tb && (who === 'a' ? s.tb[0] : s.tb[1]);
                return (
                    <div key={i} style={{
                        textAlign: 'center',
                        fontSize: 14, fontWeight: 600,
                        color: isLeader || isCurrent ? '#000' : '#9ca3af',
                        position: 'relative', lineHeight: 1,
                    }}>
                        {v}
                        {tb != null && (
                            <sup style={{ fontSize: 8, color: 'var(--mute)', marginLeft: 1, top: -4, position: 'relative', fontWeight: 500 }}>
                                {tb}
                            </sup>
                        )}
                    </div>
                );
            })}

            {/* point score */}
            <div style={{
                textAlign: 'center',
                fontSize: 16, fontWeight: 700,
                color: '#000',
                background: isServing ? ballColor : 'transparent',
                borderRadius: 3,
                padding: '1px 3px',
                lineHeight: 1.1,
            }}>{point}</div>
        </div>
    );
}
