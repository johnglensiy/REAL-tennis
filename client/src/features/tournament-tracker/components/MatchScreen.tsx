// TennisScoreboard.tsx
// Standalone copy of the live scoreboard — tweak panel and edit-mode plumbing
// stripped out; current settings (Night theme, best-of-5, live 4th set, etc.)
// are baked in as plain constants below. Self-contained: the <style> block
// at the bottom carries the design tokens (CSS custom properties) and a
// couple of small utility classes/animations the components rely on.
//
// Usage: <TennisScoreboard /> — no props required. Import into any React
// project with React 18+; no other dependencies.

import React, { useState, useMemo, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { screenPopped } from "../navigationSlice";
import { selectMatchById } from "../matchesSlice";
import { FeedItem, FALLBACK_ATP_ID } from "./FeedItem";
import { Flag, flagAlpha2 } from "./Flag";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type Who = "A" | "B";
type MatchState = "Live" | "Final";
type Theme = "paper" | "night" | "clay" | "grass";
type Font = "plex" | "grotesk" | "archivo" | "mono";

interface SetScore {
  a: number;
  b: number;
  tb: [number, number] | null;
  complete: boolean;
  future?: boolean;
}

export interface PlayerInfo {
  name: string;
  seed: string;
  country: string;
  atpId: string;
}

interface Match {
  tournament: string;
  court: string;
  duration: string;
  status: "LIVE" | "FINAL";
  set: number;
  bestOf: number;
  serving: Who;
  players: Record<Who, PlayerInfo>;
  sets: SetScore[];
  point: { a: string; b: string };
  setsWon: { a: number; b: number };
}

interface FeedDetail {
  rally: string;
  stroke: string;
  hand: string;
  spin: string;
  height: string;
  mph: string;
  kmh: string;
}

export interface FeedEvent {
  set: number;
  game: number;
  time: string;
  text: string;
  who: Who | null;
  tag: "WINNER" | "ACE" | "DF" | "BP" | "UE" | "SET";
  detail?: FeedDetail;
}

// ─────────────────────────────────────────────────────────────
// Current match settings (baked-in — was tweak-panel state)
// ─────────────────────────────────────────────────────────────

interface Settings {
  matchState: MatchState;
  bestOf: number;
  server: Who;
  playerA: string;
  playerB: string;
  seedA: string;
  seedB: string;
  countryA: string;
  countryB: string;
  setsWonA: number;
  setsWonB: number;
  currentGamesA: number;
  currentGamesB: number;
  pointA: string;
  pointB: string;
  showMomentum: boolean;
  showPointCard: boolean;
  showFeed: boolean;
  avatarSize: number;
  ballColor: string;
  theme: Theme;
  font: Font;
}

const SETTINGS: Settings = {
  matchState: "Live",
  bestOf: 5,
  server: "A",
  playerA: "A. Sinclair",
  playerB: "M. Okonkwo",
  seedA: "(4)",
  seedB: "(11)",
  countryA: "GBR",
  countryB: "NGR",
  setsWonA: 2,
  setsWonB: 1,
  currentGamesA: 2,
  currentGamesB: 1,
  pointA: "30",
  pointB: "15",
  showMomentum: false,
  showPointCard: false,
  showFeed: true,
  avatarSize: 56,
  ballColor: "#d4e34a",
  theme: "night",
  font: "plex",
};

// Historic sets (everything before the current one) is static.
const PRIOR_SETS: Omit<SetScore, "complete">[] = [
  { a: 6, b: 4, tb: null },
  { a: 3, b: 6, tb: null },
  { a: 7, b: 6, tb: [7, 5] },
];

const MATCH_STATIC = {
  tournament: "Wimbledon",
  round: "Round of 16",
  court: "Court 1",
  duration: "2:14",
};

const FEED: FeedEvent[] = [
  {
    set: 4,
    game: 4,
    time: "2:13",
    text: "Forehand winner DTL",
    who: "A",
    tag: "WINNER",
    detail: {
      rally: "3 SHOTS",
      stroke: "NA",
      hand: "FOREHAND",
      spin: "0 RPM",
      height: "3.9 FEET",
      mph: "106",
      kmh: "171",
    },
  },
  {
    set: 4,
    game: 4,
    time: "2:13",
    text: "1st serve · 118 mph · ace",
    who: "A",
    tag: "ACE",
    detail: {
      rally: "1 SHOT",
      stroke: "SERVE",
      hand: "FOREHAND",
      spin: "2400 RPM",
      height: "9.1 FEET",
      mph: "118",
      kmh: "190",
    },
  },
  { set: 4, game: 4, time: "2:12", text: "Double fault", who: "B", tag: "DF" },
  {
    set: 4,
    game: 3,
    time: "2:10",
    text: "Break point saved",
    who: "B",
    tag: "BP",
  },
  {
    set: 4,
    game: 3,
    time: "2:09",
    text: "Backhand UE long",
    who: "A",
    tag: "UE",
  },
  {
    set: 3,
    game: 13,
    time: "2:01",
    text: "SET A — wins 7-6 (7-5)",
    who: null,
    tag: "SET",
  },
];

// Derive notable running-stat lines per feed item (aces, break points, streaks)
// from the chronological event sequence — FEED itself is newest-first.
function computeFeedStats(feed: FeedEvent[], players: Record<Who, PlayerInfo>) {
  const other = (w: Who): Who => (w === "A" ? "B" : "A");
  const chron = [...feed].map((item, i) => ({ item, i })).reverse();
  const aces: Record<Who, number> = { A: 0, B: 0 };
  const bp: Record<Who, number> = { A: 0, B: 0 };
  let streakPlayer: Who | null = null,
    streak = 0;
  const snapshots: (null | {
    aces: Record<Who, number>;
    bp: Record<Who, number>;
    streakPlayer: Who | null;
    streak: number;
  })[] = new Array(feed.length);
  for (const { item, i } of chron) {
    if (item.tag === "SET" || !item.who) {
      snapshots[i] = null;
      continue;
    }
    if (item.tag === "ACE") aces[item.who]++;
    if (item.tag === "BP") bp[item.who]++;
    const winner =
      item.tag === "DF" || item.tag === "UE" ? other(item.who) : item.who;
    if (winner === streakPlayer) streak++;
    else {
      streakPlayer = winner;
      streak = 1;
    }
    snapshots[i] = { aces: { ...aces }, bp: { ...bp }, streakPlayer, streak };
  }
  return feed.map((item, i) => {
    const snap = snapshots[i];
    if (!snap || !item.who) return [] as string[];
    const who = item.who;
    const lastName = players[who]?.name.split(" ").slice(-1)[0];
    const lines: string[] = [];
    if (snap.aces[who] > 0)
      lines.push(
        `${lastName} · ${snap.aces[who]} ace${snap.aces[who] > 1 ? "s" : ""}`,
      );
    if (snap.bp[who] > 0)
      lines.push(
        `⛓️‍💥  ${snap.bp[who]} break point${snap.bp[who] > 1 ? "s" : ""}`,
      );
    if (snap.streakPlayer === who && snap.streak >= 2)
      lines.push(
        `🔥  ${snap.streak} straight point${snap.streak > 1 ? "s" : ""}`,
      );
    return lines.slice(0, 3);
  });
}

// ─────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────

function Box({
  children,
  w,
  h,
  label,
  style = {},
}: {
  children?: ReactNode;
  w?: number | string;
  h?: number | string;
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="ph" style={{ width: w, height: h, ...style }}>
      {label || children}
    </div>
  );
}

function StatusTag({ status }: { status: "LIVE" | "FINAL" }) {
  if (status === "LIVE") {
    return (
      <span
        className="mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 6px",
          borderRadius: 3,
          border: "1px solid var(--hot)",
          color: "var(--hot)",
          background: "var(--paper)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        <span className="live-dot">●</span> LIVE
      </span>
    );
  }
  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--ink)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      Final
    </span>
  );
}

function Chip({
  children,
  tone = "mute",
}: {
  children: ReactNode;
  tone?: "live" | "mute" | "accent";
}) {
  const tones: Record<string, { bg: string; bd: string; fg: string }> = {
    live: { bg: "var(--paper)", bd: "var(--hot)", fg: "var(--hot)" },
    mute: { bg: "var(--paper)", bd: "var(--stroke)", fg: "var(--ink-2)" },
    accent: {
      bg: "var(--accent)",
      bd: "var(--accent)",
      fg: "var(--accent-ink)",
    },
  };
  const t = tones[tone] || tones.mute;
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 3,
        border: "1px solid " + t.bd,
        background: t.bg,
        color: t.fg,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main scoreboard — player rows
// ─────────────────────────────────────────────────────────────

interface PlayerRowProps {
  who: "a" | "b";
  name: string;
  seed: string;
  country: string;
  sets: SetScore[];
  point: string;
  isServing: boolean;
  gridCols: string;
}

function PlayerRow({
  who,
  name,
  seed,
  country,
  sets,
  point,
  isServing,
  gridCols,
}: PlayerRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        alignItems: "center",
        gap: 1,
        padding: "14px 12px",
        borderBottom: who === "a" ? "1px solid var(--stroke-soft)" : "none",
        background: "var(--paper)",
      }}
    >
      {/* country flag (falls back to the code box when unmapped) */}
      {flagAlpha2(country) ? (
        <Flag
          ioc={country}
          style={{
            width: 20,
            height: 15,
            borderRadius: 2,
            marginRight: 16,
            justifySelf: "center",
          }}
        />
      ) : (
        <div
          className="mono"
          style={{
            width: 24,
            height: 16,
            borderRadius: 2,
            border: "1px solid var(--stroke)",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            color: "var(--ink-2)",
            letterSpacing: "0.02em",
            marginRight: 16,
          }}
        >
          {country}
        </div>
      )}

      {/* name */}
      <div
        style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 6 }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--mute)" }}>
          {seed}
        </span>
      </div>

      {/* serve indicator — own column, between name and scores */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {isServing && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              border: "1px solid var(--accent-ink)",
            }}
          />
        )}
      </div>

      {/* set columns — dash placeholder for unplayed sets */}
      {sets.map((s, i) => {
        if (s.future) {
          return (
            <div
              key={i}
              className="mono"
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--stroke)",
                lineHeight: 1,
              }}
            >
              –
            </div>
          );
        }
        const isCurrent =
          i ===
            (sets.findIndex((x) => x.future) === -1
              ? sets.length - 1
              : sets.findIndex((x) => x.future) - 1) && !s.complete;
        const isLeader =
          s.complete &&
          ((who === "a" && s.a > s.b) || (who === "b" && s.b > s.a));
        const v = who === "a" ? s.a : s.b;
        const tb = s.tb && (who === "a" ? s.tb[0] : s.tb[1]);
        return (
          <div
            key={i}
            className="mono"
            style={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: 600,
              color: isLeader
                ? "var(--ink)"
                : isCurrent
                  ? "var(--ink)"
                  : "var(--mute)",
              position: "relative",
              lineHeight: 1,
            }}
          >
            {v}
            {tb != null && (
              <sup
                className="mono"
                style={{
                  fontSize: 9,
                  color: "var(--mute)",
                  marginLeft: 1,
                  top: -6,
                  position: "relative",
                  fontWeight: 500,
                }}
              >
                {tb}
              </sup>
            )}
          </div>
        );
      })}

      {/* current point */}
      <div
        className="mono"
        style={{
          textAlign: "center",
          fontSize: 15,
          fontWeight: 700,
          color: isServing ? "var(--on-accent)" : "var(--ink)",
          background: isServing ? "var(--accent)" : "var(--paper)",
          border:
            "1px solid " + (isServing ? "var(--accent)" : "var(--stroke)"),
          borderRadius: 4,
          padding: "1px 4px",
          minWidth: 26,
          lineHeight: 1.3,
          justifySelf: "center",
        }}
      >
        {point}
      </div>
    </div>
  );
}

function Scoreboard({ match }: { match: Match }) {
  const { sets, players, point, serving } = match;
  const setCount = sets.length;
  const gridCols = `34px 1fr 24px repeat(${setCount}, 22px) 36px`;
  return (
    <div>
      {/* <div
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          gap: 1,
          padding: "8px 12px 6px",
          background: "var(--paper)",
          borderBottom: "1px solid var(--stroke-soft)",
        }}
      >
        <div></div>
        <div></div>
        <div></div>
        {Array.from({ length: setCount }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className="mono"
            style={{
              textAlign: "center",
              fontSize: 9,
              color: "var(--mute)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            S{n}
          </div>
        ))}
        <div
          className="mono"
          style={{
            textAlign: "center",
            fontSize: 9,
            color: "var(--mute)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          PTS
        </div>
      </div> */}

      <PlayerRow
        who="a"
        name={players.A.name}
        seed={players.A.seed}
        country={players.A.country}
        sets={sets}
        point={point.a}
        isServing={serving === "A"}
        gridCols={gridCols}
      />
      <PlayerRow
        who="b"
        name={players.B.name}
        seed={players.B.seed}
        country={players.B.country}
        sets={sets}
        point={point.b}
        isServing={serving === "B"}
        gridCols={gridCols}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────

type TabName = "Points" | "Stats" | "Court" | "H2H";

function Tabs({
  active,
  onChange,
}: {
  active: TabName;
  onChange: (t: TabName) => void;
}) {
  const items: TabName[] = ["Points", "Stats", "Court", "H2H"];
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--stroke)",
        background: "var(--paper)",
        padding: "0 8px",
      }}
    >
      {items.map((it) => {
        const on = it === active;
        return (
          <button
            key={it}
            onClick={() => onChange(it)}
            style={{
              flex: 1,
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              borderBottom: on
                ? "2px solid var(--ink)"
                : "2px solid transparent",
              color: on ? "var(--ink)" : "var(--mute)",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Momentum placeholder
// ─────────────────────────────────────────────────────────────

function Momentum() {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--paper)",
        borderBottom: "1px solid var(--stroke-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--mute)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Momentum · this set
        </span>
        <span className="mono" style={{ fontSize: 10, color: "var(--mute)" }}>
          BP 2/4
        </span>
      </div>
      <Box w="100%" h={64} label="[ momentum chart placeholder ]" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <span className="mono note">0–0</span>
        <span className="mono note">2–1 →</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Point feed
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Point detail card
// ─────────────────────────────────────────────────────────────

function StatCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "12px 14px", background: "var(--paper)" }}>
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--mute)",
          letterSpacing: "0.04em",
          textTransform: "capitalize",
          marginBottom: 6,
          lineHeight: 1.25,
          minHeight: 24,
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PointCard({
  item,
  players,
}: {
  item: FeedEvent;
  players: Record<Who, PlayerInfo>;
}) {
  if (!item || !item.detail || !item.who) return null;
  const d = item.detail;
  const winner = players[item.who];
  const lastName = winner.name.split(" ").slice(-1)[0];
  const verb =
    item.tag === "ACE" ? "ace" : item.tag === "WINNER" ? "winner" : "point";
  const gameScore = item.who === "A" ? "15–30" : "30–15";

  return (
    <div
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid var(--stroke)",
      }}
    >
      <div
        style={{
          padding: "14px 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid var(--stroke-soft)",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          {lastName}'s {verb}
        </span>
        <Chip tone="accent">{item.tag}</Chip>
        <div style={{ flex: 1 }} />
        <span className="mono note">
          S{item.set} · G{item.game} · {item.time} ·{" "}
          <span style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
            {gameScore}
          </span>
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: "var(--stroke-soft)",
        }}
      >
        <StatCell label="Rally length">
          <Stat>{d.rally}</Stat>
        </StatCell>
        <StatCell label="Stroke">
          <Stat>{d.stroke}</Stat>
        </StatCell>
        <StatCell label="Hand">
          <Stat>{d.hand}</Stat>
        </StatCell>
        <StatCell label="Spin">
          <Stat>{d.spin}</Stat>
        </StatCell>
        <StatCell label="Height above ground">
          <Stat>{d.height}</Stat>
        </StatCell>
        <StatCell label="Speed">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <Stat>{d.mph}</Stat>
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  color: "var(--mute)",
                  textTransform: "uppercase",
                }}
              >
                mph
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <Stat>{d.kmh}</Stat>
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  color: "var(--mute)",
                  textTransform: "uppercase",
                }}
              >
                km/h
              </span>
            </span>
          </div>
        </StatCell>
      </div>
    </div>
  );
}

function Stat({ children }: { children: ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 16,
        fontWeight: 700,
        color: "var(--ink)",
        letterSpacing: "0.01em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function Feed({
  players,
  avatarSize,
}: {
  players: Record<Who, PlayerInfo>;
  avatarSize: number;
}) {
  const feedStats = useMemo(() => computeFeedStats(FEED, players), [players]);
  return (
    <div>
      <div
        style={{
          padding: "14px 16px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          background: "var(--paper)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>Point by point</span>
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--mute)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Newest first
        </span>
      </div>
      {FEED.map((f, i) => (
        <FeedItem
          key={i}
          item={f}
          players={players}
          avatarSize={avatarSize}
          statLines={feedStats[i]}
        />
      ))}
      <div style={{ padding: 16, textAlign: "center" }}>
        <span className="mono note">— load earlier points —</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────

interface MatchHeaderProps {
  tournament: string;
  round: string;
  court: string;
  status: "LIVE" | "FINAL";
  set: number;
  bestOf: number;
  duration: string;
  backHref?: string;
}

function MatchHeader({
  tournament,
  round,
  court,
  status,
  set,
  bestOf,
  duration,
  backHref,
}: MatchHeaderProps) {
  const dispatch = useAppDispatch();
  return (
    <div
      style={{
        padding: "12px 16px 14px",
        borderBottom: "1px solid var(--stroke)",
        background: "var(--paper)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a
          href={backHref || "#"}
          style={{
            width: 28,
            height: 28,
            border: "1px solid var(--stroke)",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-2)",
            textDecoration: "none",
          }}
          onClick={() => dispatch(screenPopped())}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono note">
            {tournament} · {round} · {court}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <StatusTag status={status} />
            <span
              className="mono note"
              style={{
                color: "var(--ink-2)",
                textTransform: "none",
                letterSpacing: "0.02em",
              }}
            >
              Set {set}/{bestOf} · {duration}
            </span>
          </div>
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            border: "1px dashed var(--stroke)",
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function TennisScoreboard({ matchId }: { matchId?: string }) {
  const [tab, setTab] = useState<TabName>("Points");
  const s = SETTINGS;

  // when a matchId is passed (via the nav stack params), pull the live match
  // from the redux slice so names reflect real data instead of the constants
  const reduxMatch = useAppSelector((state) =>
    matchId ? selectMatchById(state, matchId) : undefined,
  );

  const match = useMemo((): Match => {
    const setsWon = {
      a: Math.max(0, Math.min(s.setsWonA | 0, (s.bestOf - 1) / 2 + 1)),
      b: Math.max(0, Math.min(s.setsWonB | 0, (s.bestOf - 1) / 2 + 1)),
    };
    const playedSetCount = Math.min(PRIOR_SETS.length, setsWon.a + setsWon.b);
    const prior: SetScore[] = PRIOR_SETS.slice(0, playedSetCount).map(
      (set) => ({ ...set, complete: true }),
    );
    const isFinal = s.matchState === "Final";
    const playedAndCurrent: SetScore[] = isFinal
      ? prior
      : [
          ...prior,
          {
            a: s.currentGamesA | 0,
            b: s.currentGamesB | 0,
            tb: null,
            complete: false,
          },
        ];
    const sets: SetScore[] = [...playedAndCurrent];
    while (sets.length < s.bestOf)
      sets.push({ future: true, a: 0, b: 0, tb: null, complete: false });
    return {
      tournament: MATCH_STATIC.tournament,
      court: MATCH_STATIC.court,
      duration: MATCH_STATIC.duration,
      status: isFinal ? "FINAL" : "LIVE",
      set: playedAndCurrent.length,
      bestOf: s.bestOf,
      serving: s.server,
      players: {
        A: {
          name: reduxMatch?.a.name ?? s.playerA,
          seed: s.seedA,
          country: reduxMatch?.a.country || s.countryA,
          atpId: reduxMatch?.a.atpId ?? FALLBACK_ATP_ID.A,
        },
        B: {
          name: reduxMatch?.b.name ?? s.playerB,
          seed: s.seedB,
          country: reduxMatch?.b.country || s.countryB,
          atpId: reduxMatch?.b.atpId ?? FALLBACK_ATP_ID.B,
        },
      },
      sets,
      point: { a: s.pointA, b: s.pointB },
      setsWon,
    };
  }, [reduxMatch]);

  return (
    <div
      data-theme={s.theme}
      data-font={s.font}
      className="tennis-scoreboard-root"
      style={{
        width: "100%",
        height: "100%",
        background: "var(--bg)",
        overflowY: "auto",
        overflowX: "hidden",
        fontFamily: "var(--font-sans)",
      }}
    >
      <MatchHeader
        tournament={match.tournament}
        round={MATCH_STATIC.round}
        court={match.court}
        status={match.status}
        set={match.set}
        bestOf={match.bestOf}
        duration={match.duration}
      />
      <Scoreboard match={match} />

      <Tabs active={tab} onChange={setTab} />

      {tab === "Points" && (
        <>
          {s.showPointCard && (
            <PointCard item={FEED[0]} players={match.players} />
          )}
          {s.showMomentum && <Momentum />}
          {s.showFeed && (
            <Feed players={match.players} avatarSize={s.avatarSize} />
          )}
        </>
      )}
      {tab === "Stats" && (
        <div style={{ padding: 16 }}>
          <Box w="100%" h={220} label="[ stats table placeholder ]" />
        </div>
      )}
      {tab === "Court" && (
        <div style={{ padding: 16 }}>
          <Box w="100%" h={260} label="[ court diagram placeholder ]" />
        </div>
      )}
      {tab === "H2H" && (
        <div style={{ padding: 16 }}>
          <Box w="100%" h={180} label="[ head-to-head placeholder ]" />
        </div>
      )}

      <div style={{ height: 24 }} />

      <style>{`
        .tennis-scoreboard-root {
          --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
          --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
          --bg: #15161a;
          --paper: #1e2024;
          --ink: #f0efe9;
          --ink-2: #b6b4ab;
          --mute: #797c84;
          --stroke: #34373d;
          --stroke-soft: #292c31;
          --accent: #d4e34a;
          --accent-ink: #b3c64a;
          --on-accent: #0a0a0b;
          --hot: #ff6b6b;
        }
        .tennis-scoreboard-root * { box-sizing: border-box; }
        .tennis-scoreboard-root .mono { font-family: var(--font-mono); }
        .tennis-scoreboard-root .note {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--mute);
        }
        .tennis-scoreboard-root .ph {
          background-image: repeating-linear-gradient(45deg, var(--stroke-soft) 0 6px, transparent 6px 12px);
          border: 1px dashed var(--stroke); color: var(--mute);
          font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
          display: flex; align-items: center; justify-content: center;
        }
        @keyframes tsbLiveBlink { 0%, 45% { opacity: 1; } 55%, 100% { opacity: 0.25; } }
        .tennis-scoreboard-root .live-dot { animation: tsbLiveBlink 1.9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tennis-scoreboard-root .live-dot { animation: none; }
        }
      `}</style>
    </div>
  );
}
