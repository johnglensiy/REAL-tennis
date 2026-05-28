import 'flag-icons/css/flag-icons.min.css';

const alpha3ToAlpha2: Record<string, string> = {
    ARG: 'ar', // Argentina
    AUS: 'au', // Australia
    AUT: 'at', // Austria
    BEL: 'be', // Belgium
    BRA: 'br', // Brazil
    CAN: 'ca', // Canada
    CHI: 'cl', // Chile
    CHN: 'cn', // China
    CRO: 'hr', // Croatia
    CZE: 'cz', // Czech Republic
    DEN: 'dk', // Denmark
    ESP: 'es', // Spain
    FRA: 'fr', // France
    GBR: 'gb', // Great Britain
    GER: 'de', // Germany
    GRE: 'gr', // Greece
    HUN: 'hu', // Hungary
    ITA: 'it', // Italy
    JPN: 'jp', // Japan
    KAZ: 'kz', // Kazakhstan
    KOR: 'kr', // South Korea
    NED: 'nl', // Netherlands
    NOR: 'no', // Norway
    POL: 'pl', // Poland
    POR: 'pt', // Portugal
    ROU: 'ro', // Romania
    RSA: 'za', // South Africa
    RUS: 'ru', // Russia
    SRB: 'rs', // Serbia
    SUI: 'ch', // Switzerland
    SVK: 'sk', // Slovakia
    SWE: 'se', // Sweden
    TPE: 'tw', // Chinese Taipei
    UKR: 'ua', // Ukraine
    USA: 'us', // United States
};

interface PlayerRowProps {
    who: string;
    firstName: string;
    lastName: string;
    seed: number;
    country: string;
    sets: { a: number; b: number; tb: [number, number] | null }[];
    point: number;
    isServing: boolean;
    won: boolean;
    ballColor: string;
    gridCols?: string;
}

function BallDot({ filled = true, size = 10, style = {} }) {
    return (
        <span style={{
            display: 'inline-block', width: size, height: size, borderRadius: '50%',
            background: filled ? 'var(--accent)' : 'transparent',
            border: '1px solid ' + (filled ? 'var(--accent)' : 'var(--stroke)'),
            boxShadow: filled ? 'inset -1.5px -1.5px 0 rgba(0,0,0,0.08)' : 'none',
            ...style,
        }} />
    )
}

export default function PlayerRow(props: PlayerRowProps) {
    const { who, firstName, lastName, seed, country, sets, point, gridCols, ballColor, isServing } = props;
    return (
        <div 
            className="grid items-center gap-6 px-4 py-3.5 outline"
            style={{ gridTemplateColumns: gridCols || `14px 2px 1fr repeat(${sets.length}, 14px) 44px` }}
        >
            {/*serve indicator*/}
            <div className="flex justify-center">
                {isServing
                    ? <BallDot></BallDot>
                    : <BallDot filled={false}></BallDot> }
            </div>

            <span className={`fi fi-${alpha3ToAlpha2[country]} text-xs rounded-[2px]`}></span>

            {/*name*/}
            <div className="font-bold text-black text-left truncate">
                {firstName.split(' ').map(n => n[0] + '.').join('')}{' '}
                {lastName.split(' ').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                {seed > 0 && <span className="text-xs text-gray-400 ml-1">({seed})</span>}
            </div>

            {/*games won per set */}
            {sets.map((s, i) => {
                const isCurrent = i === sets.length - 1;
                const isLeader = i < sets.length - 1 && (
                    (who === 'a' && s.a > s.b) || (who === 'b' && s.b > s.a)
                );
                const v = who === 'a' ? s.a : s.b;
                const tb = s.tb && (who === 'a' ? s.tb[0] : s.tb[1]);
                return (
                <div key={i} className="mono" style={{
                    textAlign: 'center',
                    fontSize: 18, fontWeight: 600,
                    color: isLeader || isCurrent ? '#000' : '#9ca3af',
                    position: 'relative',
                    lineHeight: 1,
                }}>
                    {v}
                    {tb != null && (
                    <sup className="mono" style={{
                        fontSize: 9, color: 'var(--mute)', marginLeft: 1, top: -6, position: 'relative',
                        fontWeight: 500,
                    }}>{tb}</sup>
                    )}
                </div>
                );
            })}
            
            {/*pts*/}
            <div className="mono" style={{
                textAlign: 'center',
                fontSize: 22, fontWeight: 700,
                color: '#000',
                background: isServing ? ballColor : 'transparent',
                borderRadius: 4,
                padding: '2px 4px',
                lineHeight: 1.1,
            }}>{point}</div>


        </div>
    );
};