import type { Who, PlayerInfo, FeedEvent } from "./MatchScreen";
import { Flag } from "./Flag";

export const FALLBACK_ATP_ID: Record<Who, string> = { A: "s0ag", B: "d643" };

function playerPhoto(atpId: string) {
  // return `https://www.atptour.com/-/media/alias/player-headshot/${atpId}`;
  return `https://images.wimbledon.com/square_nobg/atp${atpId}.png`;
}

export function FeedItem({
  item,
  players,
  avatarSize = 32,
  statLines = [],
}: {
  item: FeedEvent;
  players: Record<Who, PlayerInfo>;
  avatarSize?: number;
  statLines?: string[];
}) {
  const who = item.who;
  const isSet = item.tag === "SET";
  if (isSet) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "var(--bg)",
          borderTop: "1px dashed var(--stroke)",
          borderBottom: "1px dashed var(--stroke)",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--stroke)" }} />
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-2)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          End of Set {item.set - 1} · {item.text.replace("SET A — ", "")}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--stroke)" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: avatarSize + "px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid var(--stroke-soft)",
        background: "var(--paper)",
      }}
    >
      <div style={{ position: "relative", width: avatarSize, height: avatarSize }}>
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            // border: "1px solid var(--stroke)",
            background: "var(--bg)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={playerPhoto(players[who]?.atpId ?? FALLBACK_ATP_ID[who])}
            alt={players[who]?.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {who && (
          <Flag
            ioc={players[who]?.country}
            style={{
              position: "absolute",
              right: -2,
              bottom: -1,
              width: 16,
              height: 12,
              borderRadius: 2,
              boxShadow: "0 0 0 1.5px var(--paper)",
            }}
          />
        )}
      </div>

      <div>
        <div style={{ marginBottom: 2 }}>
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--mute)",
              letterSpacing: "0.06em",
            }}
          >
            S{item.set} · G{item.game} · {item.time}
          </span>
        </div>
        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
          {players[who]?.name.split(" ").slice(-1)[0]} · {item.text}
        </div>
        {statLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              color: "var(--mute)",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 11, color: "var(--mute)" }}>
        ›
      </div>
    </div>
  );
}
