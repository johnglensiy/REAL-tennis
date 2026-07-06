import {
  createEntityAdapter,
  type EntityState,
  createSlice,
} from "@reduxjs/toolkit";
import type { MatchStateOld } from "./types";

interface MatchesState extends EntityState<MatchStateOld, string> {
  matches: MatchStateOld[];
}

const matchesAdapter = createEntityAdapter<MatchStateOld>({});

const initialState: MatchesState = matchesAdapter.getInitialState({
  matches: [
    {
      id: "main",
      tournamentId: "wimbledon",
      status: "live",
      scheduledDate: "2026-07-04",
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
      scheduledDate: "2026-07-04",
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
      scheduledDate: "2026-07-04",
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
      scheduledDate: "2026-07-04",
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
      scheduledDate: "2026-07-04",
      meta: "Today · 16:00",
      a: { name: "R. Costa", country: "POR", seed: "8" },
      b: { name: "S. Ali", country: "PAK", seed: "—" },
    },
    {
      id: "e1",
      tournamentId: "eastbourne",
      status: "live",
      scheduledDate: "2026-07-04",
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
      scheduledDate: "2026-07-04",
      meta: "Today · 15:00",
      a: { name: "G. Rossi", country: "ITA", seed: "1" },
      b: { name: "A. Kovač", country: "SRB", seed: "7" },
    },
    {
      id: "e3",
      tournamentId: "eastbourne",
      status: "upcoming",
      scheduledDate: "2026-07-04",
      meta: "Today · 18:45",
      a: { name: "D. Schmidt", country: "GER", seed: "3" },
      b: { name: "V. Horvat", country: "SLO", seed: "—" },
    },
  ],
});

export const matchesSlice = createSlice({
  name: "matches",
  initialState: matchesAdapter.getInitialState(),
  reducers: {},
});

export default matchesSlice.reducer;
