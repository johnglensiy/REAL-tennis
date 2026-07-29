import type { Point } from "./types";
import type { FeedEvent, Who } from "./components/MatchScreen";

/**
 * PointDTO (wire/store) -> FeedEvent (view).
 *
 * The single mapping site for this boundary — the feed's presentation strings
 * are built here, never on the server and never inside FeedItem.
 *
 * Attribution note: `who` is the player the *event* is about, not always the
 * player who won the point. On an error (UE/DF/FE) the feed names whoever
 * committed it, which is the opposite of `scorer`.
 */

const KPH_TO_MPH = 0.621371;

const side = (s: "1" | "2"): Who => (s === "1" ? "A" : "B");
const other = (w: Who): Who => (w === "A" ? "B" : "A");

// "3_7_2" -> { set: 3, game: 7 }
function locate(id: string) {
  const [set, game] = id.split("_").map(Number);
  return { set: set || 1, game: game || 1 };
}

// seconds -> "1:23". This feed carries no match clock (timeElapsed is 0), so
// callers get "—" until the score feed fills it in.
function clock(seconds: number): string {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function describe(p: Point): string {
  const r = p.rally;
  const hand = r?.endHand ? titleCase(r.endHand) : "";
  const speed = r?.serveSpeedKph ? `${Math.round(r.serveSpeedKph)} kph` : null;

  switch (p.result) {
    case "A":
      return ["1st serve", speed, "ace"].filter(Boolean).join(" · ");
    case "DF":
      return "Double fault";
    case "W":
      return [hand, "winner", r?.placement].filter(Boolean).join(" ");
    case "UE":
      return [hand, "UE", r?.placement].filter(Boolean).join(" ");
    case "FE":
      // the feed supplies no placement for forced errors — see RallyDetail
      return [hand, "forced error"].filter(Boolean).join(" ");
    default:
      return p.result;
  }
}

function detail(p: Point): FeedEvent["detail"] {
  const r = p.rally;
  if (!r) return undefined;
  const kph = r.serveSpeedKph;
  return {
    rally: `${r.length} SHOT${r.length === 1 ? "" : "S"}`,
    stroke: (r.shots?.length ?? 0) <= 1 ? "SERVE" : "GROUND",
    hand: r.endHand?.toUpperCase() ?? "NA",
    spin: r.spin ? `${Math.round(r.spin)} RPM` : "NA",
    height: "NA", // not carried on RallyDetail
    mph: kph ? String(Math.round(kph * KPH_TO_MPH)) : "NA",
    kmh: kph ? String(Math.round(kph)) : "NA",
  };
}

function toFeedEvent(p: Point): FeedEvent {
  const { set, game } = locate(p.id);
  const scorer = side(p.scorer);
  // errors are attributed to the player who made them, not the point winner
  const isError = p.result === "UE" || p.result === "DF" || p.result === "FE";

  return {
    set,
    game,
    time: clock(p.timeElapsed),
    text: describe(p),
    who: isError ? other(scorer) : scorer,
    tag:
      p.result === "A"
        ? "ACE"
        : p.result === "W"
          ? "WINNER"
          : p.result === "DF"
            ? "DF"
            : p.result === "FE"
              ? "FE"
              : "UE",
    detail: detail(p),
    pointId: p.id,
  };
}

// a point that closed a set gets a divider rendered after it
function toSetDivider(p: Point): FeedEvent {
  const { set } = locate(p.id);
  const a = p.playerSetScores.at(-1) ?? 0;
  const b = p.opponentSetScores.at(-1) ?? 0;
  const winner = side(a > b ? "1" : "2");
  return {
    set: set + 1, // FeedItem renders "End of Set {set - 1}"
    game: 0,
    time: clock(p.timeElapsed),
    text: `SET ${winner} — wins ${Math.max(a, b)}-${Math.min(a, b)}`,
    who: null,
    tag: "SET",
  };
}

/**
 * Points arrive oldest-first; the feed renders newest-first.
 */
export function pointsToFeed(points: Point[]): FeedEvent[] {
  const feed: FeedEvent[] = [];
  for (const p of points) {
    feed.push(toFeedEvent(p));
    if (p.completes === "set" || p.completes === "match") {
      feed.push(toSetDivider(p));
    }
  }
  return feed.reverse();
}
