import { createSlice } from '@reduxjs/toolkit'
import type { MatchState } from '../../../../common/types';

const initialState: MatchState[] = [];

const matchesSlice = createSlice({
    name: 'matches',
    initialState,
    reducers: {}
});

export default matchesSlice.reducer;