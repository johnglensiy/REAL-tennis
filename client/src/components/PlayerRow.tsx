interface PlayerRowProps {
    who: string;
    name: string;
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
    const { who, name, seed, sets, point, gridCols, ballColor, isServing } = props
    return (
        <div 
            className="grid items-center gap-6 px-4 py-3.5 "
            style={{ gridTemplateColumns: gridCols || '20px 28px 1fr repeat(4, 28px) 44px' }}
        >
            {/*serve indicator*/}
            <div className="flex justify-center">
                {isServing
                    ? <BallDot></BallDot>
                    : <BallDot filled={false}></BallDot> }
            </div>
            {/*name*/}
            <div className="">
                {name} {seed}
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
                    color: isLeader ? 'var(--ink)' : (isCurrent ? 'var(--ink)' : 'var(--mute)'),
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
                color: 'var(--ink)',
                background: isServing ? ballColor : 'transparent',
                borderRadius: 4,
                padding: '2px 4px',
                lineHeight: 1.1,
            }}>{point}</div>


        </div>
    );
};

{/*sets header */}
            
            {/*player A (whoever came from higher in bracket) */}

            {/*player B (whoever came from lower in bracket) */}
