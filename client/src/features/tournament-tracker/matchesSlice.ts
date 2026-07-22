import {
  createEntityAdapter,
  type EntityState,
  createSlice,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import type { MatchStateOld, PlayerStateOld, Point } from "./types";
import type { MatchScheduled, ScoreUpdated } from "../../../../common/types";

interface MatchesState extends EntityState<MatchStateOld, string> {}

// Stub dates are relative to today so they always land inside the date strip
// (which renders today ±7 days). Hardcoded dates go stale and the stubs vanish.
const dayOffsetISO = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const STUB_MATCHES = [
  {
    id: "main",
    tournamentId: "wimbledon",
    status: "live",
    scheduledDate: dayOffsetISO(0),
    meta: "Set 4 · 2:14",
    live: "LIVE",
    href: "Tennis Scoreboard.html",
    a: {
      name: "A. Sinclair",
      country: "GBR",
      seed: "4",
      sets: [6, 3, 7, 2],
      pts: "30",
      serving: true,
    },
    b: {
      name: "M. Okonkwo",
      country: "NGR",
      seed: "11",
      sets: [4, 6, 6, 1],
      pts: "15",
    },
  },
  {
    id: "m2",
    tournamentId: "wimbledon",
    status: "live",
    scheduledDate: dayOffsetISO(0),
    meta: "Set 2 · 0:51",
    live: "LIVE",
    a: {
      name: "L. Vasquez",
      country: "ESP",
      seed: "2",
      sets: [6, 3],
      pts: "40",
      serving: true,
    },
    b: {
      name: "F. Lindqvist",
      country: "SWE",
      seed: "15",
      sets: [4, 2],
      pts: "15",
    },
  },
  {
    id: "m3",
    tournamentId: "wimbledon",
    status: "final",
    scheduledDate: dayOffsetISO(0),
    meta: "Final · 2:38",
    a: {
      name: "T. Haas",
      country: "GER",
      seed: "7",
      sets: [7, 6, 6],
      winner: true,
    },
    b: { name: "D. Petrov", country: "BUL", seed: "9", sets: [5, 7, 3] },
  },
  {
    id: "m4",
    tournamentId: "wimbledon",
    status: "final",
    scheduledDate: dayOffsetISO(-1), // yesterday — tests past dates
    meta: "Final · 1:54",
    a: {
      name: "K. Nakamura",
      country: "JPN",
      seed: "5",
      sets: [6, 6],
      winner: true,
    },
    b: { name: "É. Dubois", country: "FRA", seed: "12", sets: [3, 4] },
  },
  {
    id: "m5",
    tournamentId: "wimbledon",
    status: "upcoming",
    scheduledDate: dayOffsetISO(0),
    meta: "Today · 16:00",
    a: { name: "R. Costa", country: "POR", seed: "8" },
    b: { name: "S. Ali", country: "PAK", seed: "—" },
  },
  {
    id: "e1",
    tournamentId: "eastbourne",
    status: "live",
    scheduledDate: dayOffsetISO(0),
    meta: "Set 1 · 0:23",
    live: "LIVE",
    a: {
      name: "B. Müller",
      country: "AUT",
      seed: "4",
      sets: [3],
      pts: "Ad",
      serving: true,
    },
    b: { name: "O. Traoré", country: "CIV", seed: "—", sets: [2], pts: "40" },
  },
  {
    id: "e2",
    tournamentId: "eastbourne",
    status: "upcoming",
    scheduledDate: dayOffsetISO(1), // tomorrow — tests future dates
    meta: "Today · 15:00",
    a: { name: "G. Rossi", country: "ITA", seed: "1" },
    b: { name: "A. Kovač", country: "SRB", seed: "7" },
  },
  {
    id: "e3",
    tournamentId: "eastbourne",
    status: "upcoming",
    scheduledDate: dayOffsetISO(1), // tomorrow
    meta: "Today · 18:45",
    a: { name: "D. Schmidt", country: "GER", seed: "3" },
    b: { name: "V. Horvat", country: "SLO", seed: "—" },
  },
];

// local YYYY-MM-DD (avoids toISOString's UTC shift) — live matches are "today"
const todayLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const matchesAdapter = createEntityAdapter<MatchStateOld>();

const initialState: MatchesState = matchesAdapter.setAll(
  matchesAdapter.getInitialState(),
  STUB_MATCHES.map((m) => ({ ...m, pointHistory: [] })),
);

export const matchesSlice = createSlice({
  name: "matches",
  initialState,
  reducers: {
    matchScheduled(state, action: PayloadAction<MatchScheduled>) {
      const ev = action.payload;

      // find or create the tournament this match belongs to

      // skip if we've already added this match
      // if (state.entities.some((m) => m.id === ev.matchId)) return;
      if (state.entities[ev.matchId]) return;

      // map wire event -> view-model
      matchesAdapter.addOne(state, {
        id: ev.matchId,
        tournamentId: ev.tournamentId,
        status: "upcoming",
        scheduledDate: ev.scheduledDate,
        meta: `${ev.round} · ${ev.scheduledTime}`,
        round: ev.round,
        court: ev.court,
        time: ev.scheduledTime,
        a: { ...ev.playerA, atpId: ev.playerA.atpId ?? undefined },
        b: { ...ev.playerB, atpId: ev.playerB.atpId ?? undefined },
        pointHistory: [],
      });
    },

    // Bulk-load a match's point history (the court-vision dump). Points live
    // nested on the match for now; when they outgrow it they move to their own
    // slice keyed by matchId. Replaces rather than appends — this is a
    // full-history fetch, and re-fetching must stay idempotent.
    pointsLoaded(
      state,
      action: PayloadAction<{ matchId: string; points: Point[] }>,
    ) {
      const match = state.entities[action.payload.matchId];
      if (!match) return; // point history for an unknown match is dropped
      match.pointHistory = action.payload.points;
    },

    scoreUpdated(state, action: PayloadAction<ScoreUpdated>) {
      const ev = action.payload;
      const existing = state.entities[ev.matchId];

      // ScoreUpdated carries no player identity — merge scores onto the
      // existing match (from the schedule) so names/country/seed are kept.
      // If the match isn't known yet, it's created with empty player info.
      const a: PlayerStateOld = {
        name: ev.playerScore.name,
        country: ev.playerScore.country,
        seed: ev.playerScore.seed,
        sets: ev.playerScore.setScores.filter((s): s is number => s !== null),
        pts: ev.playerScore.gameScore,
        serving: ev.server === "p",
      };
      const b: PlayerStateOld = {
        name: ev.opponentScore.name,
        country: ev.opponentScore.country,
        seed: ev.opponentScore.seed,
        sets: ev.opponentScore.setScores.filter((s): s is number => s !== null),
        pts: ev.opponentScore.gameScore,
        serving: ev.server === "o",
      };

      matchesAdapter.upsertOne(state, {
        id: ev.matchId,
        tournamentId: existing?.tournamentId ?? "wimbledon",
        status: "live",
        // no schedule to merge onto — stamp today so it shows on the live column
        scheduledDate: existing?.scheduledDate ?? todayLocalISO(),
        meta: existing?.meta ?? "",
        round: existing?.round,
        court: existing?.court,
        time: existing?.time,
        live: "LIVE",
        a,
        b,
        pointHistory: existing?.pointHistory ?? [],
      });
    },
  },
});

export const {
  selectAll: selectAllMatches,
  selectById: selectMatchById,
  selectIds: selectMatchIds,
} = matchesAdapter.getSelectors((state: RootState) => state.matches);

export const selectMatchesByTournament = createSelector(
  [selectAllMatches, (state: RootState, tournamentId: string) => tournamentId],
  (allMatches, tournamentId) =>
    allMatches.filter((m) => m.tournamentId === tournamentId),
);

export const selectPointsByMatch = createSelector(
  [(state: RootState, matchId: string) => selectMatchById(state, matchId)],
  (match): Point[] => match?.pointHistory ?? [],
);

export const { matchScheduled, scoreUpdated, pointsLoaded } =
  matchesSlice.actions;
export default matchesSlice.reducer;
