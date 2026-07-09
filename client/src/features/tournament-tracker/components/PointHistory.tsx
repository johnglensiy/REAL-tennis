// Renders a match's point-by-point history (from the ATP pointHistory feed)
// as a scrollable list of point cards.

// shape of one point in the decoded `pointHistory.history` array
// (fields come through as strings from the feed)
export interface PointHistoryEntry {
  ElapsedTime: string;
  SetNo: string;
  GameNo: string;
  PointNumber: string;
  ServeNumber: string;
  Sentence: string;
  PointWinner: string; // "1" | "2"
  PointServer: string; // "1" | "2"
  P1Score: string;
  P2Score: string;
  P1GamesWon: string;
  P2GamesWon: string;
  P1SetsWon: string;
  P2SetsWon: string;
  Ace: string;
  DoubleFault: string;
  Winner: string;
  UnforcedError: string;
  Speed_KMH: string;
  Speed_MPH: string;
  RallyCount: string;
  GameWinner: string;
  SetWinner: string;
  MatchWinner: string;
}

function Avatar({ isP1 }: { isP1: boolean }) {
  // Felix Auger-Aliassime is P1, Djokovic is P2
  const id = isP1 ? "atpag37" : "atpd643";
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: 32,
        height: 32,
        borderRadius: "50%",
        overflow: "hidden",
        background: isP1 ? "var(--accent-ink)" : "var(--ink-2)",
      }}
    >
      <img
        src={`https://images.wimbledon.com/square_nobg/${id}.png`}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "hot" | "mute" }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 5px",
        borderRadius: 3,
        whiteSpace: "nowrap",
        border:
          "1px solid " + (tone === "hot" ? "var(--hot)" : "var(--stroke)"),
        color: tone === "hot" ? "var(--hot)" : "var(--mute)",
        background: "var(--paper)",
      }}
    >
      {label}
    </span>
  );
}

function PointCard({ p }: { p: PointHistoryEntry }) {
  const winnerIsP1 = p.PointWinner === "1";

  return (
    <div
      style={{
        width: 344,
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        background: "var(--paper)",
        border: "1px solid var(--stroke)",
        borderLeft:
          "3px solid " + (winnerIsP1 ? "var(--accent-ink)" : "var(--ink-2)"),
        borderRadius: 8,
        padding: "9px 12px 8px",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      {/* winner avatar */}
      <Avatar isP1={winnerIsP1} />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* header: set/game left, point# + elapsed right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Set {p.SetNo} · Game {p.GameNo}
          </span>
          <span className="mono note">
            #{p.PointNumber} · {p.ElapsedTime}
          </span>
        </div>

        {/* commentary line */}
        <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.3 }}>
          {p.Sentence}
        </span>

        {/* score line */}
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--mute)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "var(--ink)", fontWeight: 700 }}>
            {p.P1Score}–{p.P2Score}
          </span>
          <span>
            Games {p.P1GamesWon}–{p.P2GamesWon}
          </span>
          <span>
            Sets {p.P1SetsWon}–{p.P2SetsWon}
          </span>
        </div>

        {/* badges: shot outcome / rally / serve speed */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {p.Ace !== "0" && <Badge label="Ace" tone="hot" />}
          {p.DoubleFault !== "0" && <Badge label="Double Fault" tone="hot" />}
          {p.Winner !== "0" && <Badge label="Winner" tone="mute" />}
          {p.UnforcedError !== "0" && (
            <Badge label="Unforced Error" tone="mute" />
          )}
          {Number(p.RallyCount) > 0 && (
            <Badge label={`${p.RallyCount}-shot rally`} tone="mute" />
          )}
          {Number(p.Speed_MPH) > 0 && (
            <Badge label={`${p.Speed_MPH} mph`} tone="mute" />
          )}
        </div>
      </div>
    </div>
  );
}

// a few real points from the Auger-Aliassime vs Djokovic match (matchId 1502)
const STUB_HISTORY: PointHistoryEntry[] = [
  {
    ElapsedTime: "0:00:00",
    SetNo: "1",
    GameNo: "1",
    PointNumber: "1",
    ServeNumber: "1",
    Sentence: "N. Djokovic wins the point with a forehand winner",
    PointWinner: "2",
    PointServer: "2",
    P1Score: "0",
    P2Score: "15",
    P1GamesWon: "0",
    P2GamesWon: "0",
    P1SetsWon: "0",
    P2SetsWon: "0",
    Ace: "0",
    DoubleFault: "0",
    Winner: "2",
    UnforcedError: "0",
    Speed_KMH: "199",
    Speed_MPH: "124",
    RallyCount: "3",
    GameWinner: "0",
    SetWinner: "0",
    MatchWinner: "0",
  },
  {
    ElapsedTime: "0:00:27",
    SetNo: "1",
    GameNo: "1",
    PointNumber: "2",
    ServeNumber: "0",
    Sentence: "N. Djokovic loses the point with a double fault",
    PointWinner: "1",
    PointServer: "2",
    P1Score: "15",
    P2Score: "15",
    P1GamesWon: "0",
    P2GamesWon: "0",
    P1SetsWon: "0",
    P2SetsWon: "0",
    Ace: "0",
    DoubleFault: "2",
    Winner: "0",
    UnforcedError: "2",
    Speed_KMH: "0",
    Speed_MPH: "0",
    RallyCount: "0",
    GameWinner: "0",
    SetWinner: "0",
    MatchWinner: "0",
  },
  {
    ElapsedTime: "0:05:18",
    SetNo: "1",
    GameNo: "2",
    PointNumber: "9",
    ServeNumber: "1",
    Sentence: "F. Auger-Aliassime wins the point with an ace",
    PointWinner: "1",
    PointServer: "1",
    P1Score: "40",
    P2Score: "0",
    P1GamesWon: "0",
    P2GamesWon: "1",
    P1SetsWon: "0",
    P2SetsWon: "0",
    Ace: "1",
    DoubleFault: "0",
    Winner: "1",
    UnforcedError: "0",
    Speed_KMH: "197",
    Speed_MPH: "123",
    RallyCount: "1",
    GameWinner: "0",
    SetWinner: "0",
    MatchWinner: "0",
  },
  {
    ElapsedTime: "1:05:07",
    SetNo: "1",
    GameNo: "13",
    PointNumber: "81",
    ServeNumber: "1",
    Sentence: "F. Auger-Aliassime wins the point with a backhand volley winner",
    PointWinner: "1",
    PointServer: "2",
    P1Score: "2",
    P2Score: "2",
    P1GamesWon: "6",
    P2GamesWon: "6",
    P1SetsWon: "0",
    P2SetsWon: "0",
    Ace: "0",
    DoubleFault: "0",
    Winner: "1",
    UnforcedError: "0",
    Speed_KMH: "194",
    Speed_MPH: "121",
    RallyCount: "22",
    GameWinner: "0",
    SetWinner: "0",
    MatchWinner: "0",
  },
  {
    ElapsedTime: "5:14:31",
    SetNo: "5",
    GameNo: "13",
    PointNumber: "374",
    ServeNumber: "2",
    Sentence: "F. Auger-Aliassime loses the match with a backhand forced error",
    PointWinner: "2",
    PointServer: "1",
    P1Score: "0",
    P2Score: "0",
    P1GamesWon: "6",
    P2GamesWon: "7",
    P1SetsWon: "2",
    P2SetsWon: "3",
    Ace: "0",
    DoubleFault: "0",
    Winner: "0",
    UnforcedError: "0",
    Speed_KMH: "151",
    Speed_MPH: "94",
    RallyCount: "4",
    GameWinner: "2",
    SetWinner: "2",
    MatchWinner: "2",
  },
];

export default function PointHistory({
  history = STUB_HISTORY,
}: {
  history?: PointHistoryEntry[];
}) {
  // warmup rows (PointNumber "0X"/"0Y") carry no score — drop them
  const points = history.filter((p) => /^\d+$/.test(p.PointNumber));
  if (points.length === 0) return null;

  return (
    <div style={{ padding: "8px 0 4px" }}>
      <div style={{ padding: "0 16px 8px" }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Point History
        </span>
        <span className="mono note" style={{ marginLeft: 8 }}>
          {points.length} points
        </span>
      </div>

      <div
        className="hscroll"
        style={{
          display: "flex",
          gap: 8,
          padding: "0 16px 12px",
          overflowX: "auto",
        }}
      >
        {points.map((p) => (
          <PointCard key={p.PointNumber} p={p} />
        ))}
      </div>
    </div>
  );
}
