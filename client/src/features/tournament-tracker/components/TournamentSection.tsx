import type { MatchStateOld } from "../types";
import MatchCard from "./MatchCard";

interface TournamentSectionProps {
  t: { name: string; detail: string; matches: MatchStateOld[] };
  livePulse?: boolean;
}

export default function TournamentSection({
  t,
  livePulse,
}: TournamentSectionProps) {
  const liveCount = t.matches.filter((m) => m.status === "live").length;
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          padding: "0 16px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            {t.name}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--mute)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {t.detail}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "0 0 auto",
          }}
        >
          {liveCount > 0 && (
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--hot)",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              {liveCount} LIVE
            </span>
          )}
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-2)" }}
          >
            All ›
          </span>
        </div>
      </div>

      <div
        className="hscroll"
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(3, auto)",
          gridAutoColumns: "max-content",
          alignItems: "start",
          gap: 10,
          padding: "0 16px 4px",
        }}
      >
        {t.matches.map((m) => (
          <MatchCard key={m.id} m={m} livePulse={livePulse} />
        ))}
        <div style={{ width: 4 }} />
      </div>
    </div>
  );
}
