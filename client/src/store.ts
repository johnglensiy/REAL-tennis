import { configureStore } from '@reduxjs/toolkit';
import type { Action } from '@reduxjs/toolkit';
import type { MatchState } from '../../common/types';

import matchesReducer from './features/match-tracker/matchSlice'

export const store = configureStore({
    reducer: {
        // Declare that `state.match` will be updated by the `counterReducer` function
        matches: matchesReducer
    }
})

export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch 
export type RootState = ReturnType<typeof store.getState>

