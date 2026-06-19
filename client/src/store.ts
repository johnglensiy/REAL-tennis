import { configureStore } from '@reduxjs/toolkit';
import type { Action } from '@reduxjs/toolkit';
import type { MatchState } from '../../common/types';

function matchReducer(state: MatchState, action: Action) {
    switch (action.type) {
        default: {
            return state
        }
    }
}

export const store = configureStore({
    reducer: {
        // Declare that `state.match` will be updated by the `counterReducer` function
        match: matchReducer
    }
})

export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch 
export type RootState = ReturnType<typeof store.getState>

