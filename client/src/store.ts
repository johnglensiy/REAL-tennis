import { configureStore } from "@reduxjs/toolkit";
import type { Action } from "@reduxjs/toolkit";

import tournamentsReducer from "./features/tournament-tracker/tournamentsSlice";
import matchesReducer from "./features/tournament-tracker/matchesSlice";
import navigationReducer from "./features/tournament-tracker/navigationSlice";

export const store = configureStore({
  reducer: {
    // Declare that `state.match` will be updated by the `counterReducer` function
    tournaments: tournamentsReducer,
    matches: matchesReducer,
    navigation: navigationReducer,
  },
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
