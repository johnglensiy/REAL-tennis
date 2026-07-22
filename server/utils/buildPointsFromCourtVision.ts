import type {
  BallEvent,
  BallPosition,
  Hand,
  PointDTO,
  PointResult,
  RallyDetail,
  Shot,
} from "../../common/types.ts";

/**
 * court-vision3d-firstservein.json -> PointDTO[].
 *
 * Deliberately accepts only that one variant. It's the only feed whose
 * `trajectoryData` is grouped per stroke and carries per-sample timings —
 * everything `Shot`/`BallPosition` exist to express. The flat court-vision.json
 * has neither, so it's rejected rather than silently degraded; see the guard in
 * `assertFirstServeIn`.
 *
 * Known coverage limit: this feed contains only points won or lost on a first
 * serve. Any point that went to a second serve is absent entirely — both the
 * fault and the rally that followed it. That's ~35% of a match missing, not a
 * bug in this util. Don't treat the output as a complete point history.
 */

// the feed spells these with spaces; the live scraper without. accept both.
const POINT_RESULT: Record<string, PointResult> = {
  Ace: "A",
  DoubleFault: "DF",
  "Double Fault": "DF",
  Winner: "W",
  UnforcedError: "UE",
  "Unforced Error": "UE",
  ForcedError: "FE",
  "Forced Error": "FE",
};

const BALL_EVENTS: BallEvent[] = ["hit", "peak", "net", "bounce", "last"];

// Feed timings are 3dp; subtracting them reintroduces binary-float noise
// (0.389 - 0.244 = 0.14500000000000002). Round every derived duration back.
const ms = (n: number) => Math.round(n * 1000) / 1000;

// "159.05 KPH" -> 159.05, "NA" -> null
function parseMeasure(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function parseHand(raw: unknown): Hand | null {
  return raw === "ForeHand" || raw === "BackHand" ? raw : null;
}

// the feed reports absent placement as the string "NA"
function orNull(raw: unknown): string | null {
  return typeof raw === "string" && raw !== "NA" ? raw : null;
}

/**
 * A point's named summary coordinates (ballHitCordinate & friends) are copied
 * out of its *final* stroke. When the tracker loses that stroke they come back
 * with null x/y/z — which is our only signal that `trajectoryData` is short.
 */
function isTruncated(raw: any): boolean {
  return raw?.ballLastCordinate?.x == null;
}

/**
 * Fails fast on the wrong court-vision variant. Both mistakes are easy to make
 * and neither would throw on its own — the wrapped file would yield zero
 * points, and the flat one would produce shots with every timing set to 0.
 */
function assertFirstServeIn(raw: any): void {
  if (raw?.courtVisionData) {
    throw new Error(
      "buildPointsFromCourtVision: got the wrapped court-vision.json. " +
        "Only court-vision3d-firstservein.json (unwrapped) is supported.",
    );
  }
  const first: any = Object.values(raw?.pointsData ?? {})[0];
  if (first && !Array.isArray(first.trajectoryData?.[0])) {
    throw new Error(
      "buildPointsFromCourtVision: trajectoryData is flat. This util needs " +
        "the per-stroke grouped form from court-vision3d-firstservein.json.",
    );
  }
}

function buildShots(raw: any): Shot[] {
  const groups: any[][] = Array.isArray(raw?.trajectoryData)
    ? raw.trajectoryData
    : [];
  // shotHandTypeIds is index-aligned with the groups, serve first (always "NA")
  const hands: unknown[] = Array.isArray(raw?.shotHandTypeIds)
    ? raw.shotHandTypeIds
    : [];

  return groups.map((samples, index) => {
    const path: BallPosition[] = samples.map((s, i) => {
      const t = s.time ?? 0;
      return {
        x: s.point?.x ?? 0,
        y: s.point?.y ?? 0,
        z: s.point?.z ?? 0,
        at: BALL_EVENTS.includes(s.shotType) ? s.shotType : "peak",
        t,
        dt: i === 0 ? 0 : ms(t - (samples[i - 1].time ?? 0)),
      };
    });

    const t = path[0]?.t ?? 0;
    return {
      index,
      isServe: index === 0,
      hand: index === 0 ? null : parseHand(hands[index]),
      t,
      duration: ms((path.at(-1)?.t ?? t) - t),
      path,
    };
  });
}

function buildRally(raw: any): RallyDetail | null {
  const shots = buildShots(raw);
  if (shots.length === 0) return null;

  const serveType = raw.serveType;
  return {
    // official count; can disagree with shots.length when a stroke was lost
    length: raw.rallyLength ?? shots.length,
    shots,
    duration: ms((shots.at(-1)?.t ?? 0) + (shots.at(-1)?.duration ?? 0)),

    serveType:
      serveType === "Flat" ||
      serveType === "Slice" ||
      serveType === "Kick" ||
      serveType === "Pronated"
        ? serveType
        : undefined,
    serveCourt: raw.court === "AdCourt" ? "ad" : "deuce",
    serveSpeedKph: parseMeasure(raw.ballSpeed),
    spin: parseMeasure(raw.spin),

    // derive from the last stroke, not raw.hand — that scalar has no null
    // representation, so on an ace (no groundstroke at all) it falls through
    // to "ForeHand". shotHandTypeIds correctly reports "NA" there.
    endHand: shots.at(-1)?.hand ?? null,
    // exactly one of these carries a value per point; the other reads "NA"
    placement: orNull(raw.winnerPlacement) ?? orNull(raw.unforcedErrorPlacement),
    trappedByNet: raw.trappedByNet === true,

    breakPoint: raw.breakPoint === true,
    breakPointConverted: raw.breakPointConverted === true,

    ...(isTruncated(raw) ? { truncated: true } : {}),
  };
}

// scoreBoard holds all five sets whether or not they were played; trim to the
// set this point belongs to so the client doesn't render phantom 0-0 sets.
function setScores(board: any, side: "player" | "opponent", upTo: number) {
  return Array.from({ length: upTo }, (_, i) =>
    Number(board?.[`${side}Set${i + 1}Score`] ?? 0),
  );
}

function completesOf(raw: any, board: any): PointDTO["completes"] | undefined {
  if (raw.isMatchWinning === true) return "match";
  if (raw.isSetWinning === true) return "set";
  if (board?.playergamescore === "GAME" || board?.opponentgamescore === "GAME")
    return "game";
  return undefined;
}

function toPointDTO(
  key: string,
  raw: any,
  matchId: string,
  playerId: string,
): PointDTO {
  const board = raw.scoreBoard ?? {};
  const setCount = Number(raw.setNumber ?? raw.set ?? 1) || 1;

  return {
    type: "point",
    matchId,
    // keys are "set_game_point_serve"; the serve segment is always 1 in this
    // feed, so drop it — the id keys a point, not a delivery
    id: key.split("_").slice(0, 3).join("_"),

    scorer: raw.scorerId === playerId ? "1" : "2",
    server: raw.serverId === playerId ? "1" : "2",
    result: POINT_RESULT[raw.pointEndType] ?? "W",

    playerGameScore: board.playergamescore ?? "0",
    opponentGameScore: board.opponentgamescore ?? "0",
    playerSetScores: setScores(board, "player", setCount),
    opponentSetScores: setScores(board, "opponent", setCount),

    completes: completesOf(raw, board),
    rally: buildRally(raw),

    // this feed carries no match clock — trajectory times are relative to the
    // point, not the match. Fill from the score feed before trusting it.
    timeElapsed: 0,
  };
}

// keys sort as text by default, which puts 1_10_1_1 before 1_9_1_1 — compare
// each underscore segment numerically instead.
const byPointId = (a: string, b: string) => {
  const x = a.split("_").map(Number);
  const y = b.split("_").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  }
  return 0;
};

/**
 * @param raw     parsed court-vision3d-firstservein.json (unwrapped)
 * @param matchId the id points route to on the client; the feed has none
 * @throws if handed the wrapped or flat court-vision.json instead
 */
export function buildPointsFromCourtVision(
  raw: any,
  matchId: string,
): PointDTO[] {
  assertFirstServeIn(raw);

  const points = raw?.pointsData;
  if (!points) return [];

  // "player" is whoever playersData lists first — the same convention the
  // scoreboard uses, so scorer/server "1" means playerTeam throughout.
  const playerId = raw.playersData?.playerTeam?.[0]?.id;

  return Object.keys(points)
    .sort(byPointId)
    .map((key) => toPointDTO(key, points[key], matchId, playerId));
}
