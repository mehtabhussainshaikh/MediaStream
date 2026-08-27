import { createSlice } from '@reduxjs/toolkit';

const initialState = { accessToken: null, user: null, status: 'idle' };

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    sessionStarted: (state, { payload }) => { state.accessToken = payload.accessToken; state.user = payload.user; state.status = 'authenticated'; },
    sessionUserUpdated: (state, { payload }) => { state.user = payload; state.status = 'authenticated'; },
    sessionCleared: (state) => { Object.assign(state, { accessToken: null, user: null, status: 'unauthenticated' }); },
    sessionChecking: (state) => { state.status = 'checking'; },
  },
});

export const { sessionStarted, sessionUserUpdated, sessionCleared, sessionChecking } = authSlice.actions;
export default authSlice.reducer;
