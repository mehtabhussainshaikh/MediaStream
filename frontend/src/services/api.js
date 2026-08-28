import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { sessionCleared, sessionStarted } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/v1`,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise;
const baseQueryWithRefresh = async (args, apiContext, extraOptions) => {
  let result = await rawBaseQuery(args, apiContext, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && url !== '/auth/refresh' && url !== '/auth/login') {
    refreshPromise ||= rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, apiContext, extraOptions)
      .then((refresh) => {
        if (refresh.data?.data) apiContext.dispatch(sessionStarted(refresh.data.data));
        else apiContext.dispatch(sessionCleared());
        return refresh;
      })
      .finally(() => { refreshPromise = null; });
    const refresh = await refreshPromise;
    if (refresh.data) result = await rawBaseQuery(args, apiContext, extraOptions);
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api', baseQuery: baseQueryWithRefresh,
  tagTypes: ['Session', 'Media', 'MediaList', 'MyMedia'],
  endpoints: () => ({}),
});

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.status === 'FETCH_ERROR') return 'Unable to reach the server. Check your connection and try again.';
  const statusMessages = { 403: 'You do not have permission to do that.', 404: 'The requested item could not be found.', 413: 'This file is larger than the allowed limit.', 415: 'This file type is not supported.', 429: 'Too many requests. Please wait and try again.' };
  return error.data?.error?.message || statusMessages[error.status] || fallback;
}
