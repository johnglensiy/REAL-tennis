import {
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Tour } from "./types";
import type { RootState } from "../../store";

interface TournamentState {
  id: string;
  name: string;
  tour: Tour;
  detail: string;
  // draw, num rounds, num players, etc.
}

const tournamentsAdapter = createEntityAdapter<TournamentState>();

// initial state contains stub data for now
const initialState = tournamentsAdapter.setAll(
  tournamentsAdapter.getInitialState(),
  [
    { id: "wimbledon", name: "Wimbledon", tour: "men", detail: "..." },
    { id: "eastbourne", name: "Eastbourne Intl", tour: "men", detail: "..." },
    // ...
  ],
);

// m: match. status 'live' | 'final' | 'upcoming'
// players: [A, B] each { name, country, seed, sets:[..], pts, serving, winner }
const tournamentsSlice = createSlice({
  name: "tournaments",
  initialState,
  reducers: {
    // liveMatchAdded(state, action: PayloadAction<MatchStateOld>) {
    //   // Push the match to the correct tournament
    //   // PLACEHOLDER
    //   const tournament = state.find(
    //     (t) => t.name === "Wimbledon" && t.tour === "men",
    //   );
    //   tournament?.matches.push(action.payload);
    // },
  },
});

export const {
  selectAll: selectAllTournaments,
  selectById: selectTournamentById,
} = tournamentsAdapter.getSelectors((state: RootState) => state.tournaments);

export const {} = tournamentsSlice.actions;
export default tournamentsSlice.reducer;
