import ScoreBlock from "./ScoreBlock";
import { flagAlpha2 } from "./Flag";

export interface Player {
  name: string;
  country: string;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
  winner?: boolean;
}

export default function PlayerLine({
  p,
  status,
}: {
  p: Player;
  status: string;
}) {
  const dim = p.winner === false || (status === "final" && !p.winner);
  const alpha2 = flagAlpha2(p.country);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr auto",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
      }}
    >
      {alpha2 ? (
        <span
          className={`fi fi-${alpha2}`}
          title={p.country}
          style={{
            width: 16,
            height: 12,
            borderRadius: 2,
            flex: "0 0 auto",
            justifySelf: "center",
          }}
        />
      ) : (
        <span
          className="mono"
          style={{
            width: 24,
            height: 16,
            borderRadius: 2,
            border: "1px solid var(--stroke)",
            background: "var(--bg)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            color: "var(--ink-2)",
            letterSpacing: "0.02em",
            flex: "0 0 auto",
          }}
        >
          {p.country}
        </span>
      )}

      {/* <img
            src="https://images.wimbledon.com/square_nobg/atpd643.png"
            alt=""
            style={{
                width: 24, height: 24, borderRadius: '50%',
                objectFit: 'cover', background: 'var(--ink-2)', flex: '0 0 auto',
            }}
        /> */}

      <div
        style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 5 }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: p.winner ? 700 : 600,
            color: dim ? "var(--mute)" : "var(--ink)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.name}
        </span>
        {p.seed && p.seed !== "—" && (
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--mute)", flex: "0 0 auto" }}
          >
            ({p.seed})
          </span>
        )}
      </div>

      <ScoreBlock p={p} status={status} dim={dim} bestOf={5} />
    </div>
  );
}
