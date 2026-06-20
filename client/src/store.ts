import { configureStore } from '@reduxjs/toolkit';
import type { Action } from '@reduxjs/toolkit';

import tournamentsReducer from './features/tournament-tracker/tournamentsSlice'

export const store = configureStore({
    reducer: {
        // Declare that `state.match` will be updated by the `counterReducer` function
        tournaments: tournamentsReducer
    }
})

export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch 
export type RootState = ReturnType<typeof store.getState>

