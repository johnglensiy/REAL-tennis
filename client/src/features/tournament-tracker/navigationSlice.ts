import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

export interface Screen {
  name: string;
  params?: Record<string, unknown>;
}

interface NavigationState {
  stack: Screen[];
}

const initialState: NavigationState = {
  stack: [{ name: "Home" }],
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    screenPushed: (state, action: PayloadAction<Screen>) => {
      state.stack.push(action.payload);
    },
    screenPopped: (state) => {
      if (state.stack.length > 1) state.stack.pop();
    },
    screenReplaced: (state, action: PayloadAction<Screen>) => {
      state.stack[state.stack.length - 1] = action.payload;
    },
  },
});

export const { screenPushed, screenPopped, screenReplaced } =
  navigationSlice.actions;

export const selectCurrentScreen = (state: RootState) =>
  state.navigation.stack[state.navigation.stack.length - 1];

export default navigationSlice.reducer;
