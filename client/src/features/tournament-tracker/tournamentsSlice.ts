import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TournamentState, MatchStateOld } from "./types";
import type { MatchScheduled } from "../../../../common/types";

// initial state contains stub data for now
const initialState: TournamentState[] = [];

// m: match. status 'live' | 'final' | 'upcoming'
// players: [A, B] each { name, country, seed, sets:[..], pts, serving, winner }
const tournamentsSlice = createSlice({
  name: "tournaments",
  initialState,
  reducers: {
    liveMatchAdded(state, action: PayloadAction<MatchStateOld>) {
      // Push the match to the correct tournament
      // PLACEHOLDER
      const tournament = state.find(
        (t) => t.name === "Wimbledon" && t.tour === "men",
      );
      tournament?.matches.push(action.payload);
    },
    matchScheduled(state, action: PayloadAction<MatchScheduled>) {
      const ev = action.payload;

      // find or create the tournament this match belongs to
      let tournament = state.find(
        (t) => t.name === ev.tournament && t.tour === ev.tour,
      );
      if (!tournament) {
        tournament = {
          name: ev.tournament,
          tour: ev.tour,
          detail: "",
          matches: [],
        };
        state.push(tournament);
      }

      // skip if we've already added this match
      if (tournament.matches.some((m) => m.id === ev.matchId)) return;

      // map wire event -> view-model
      tournament.matches.push({
        id: ev.matchId,
        tournamentId: ev.tournament,
        scheduledDate: ev.scheduledDate,
        status: "upcoming",
        meta: `${ev.round} · ${ev.scheduledTime}`,
        a: ev.playerA,
        b: ev.playerB,
      });
    },
  },
});

export const { liveMatchAdded, matchScheduled } = tournamentsSlice.actions;
export default tournamentsSlice.reducer;
