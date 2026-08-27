import { api } from '../../services/api';
import { sessionStarted, sessionUserUpdated } from './authSlice';

export const authApi = api.injectEndpoints({ endpoints: (builder) => ({
  register: builder.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
  login: builder.mutation({
    query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    async onQueryStarted(_arg, { dispatch, queryFulfilled }) { const { data } = await queryFulfilled; dispatch(sessionStarted(data.data)); },
  }),
  refresh: builder.mutation({
    query: () => ({ url: '/auth/refresh', method: 'POST' }),
    async onQueryStarted(_arg, { dispatch, queryFulfilled }) { const { data } = await queryFulfilled; dispatch(sessionStarted(data.data)); },
  }),
  currentUser: builder.query({
    query: () => '/auth/me', providesTags: ['Session'],
    async onQueryStarted(_arg, { dispatch, queryFulfilled }) { const { data } = await queryFulfilled; dispatch(sessionUserUpdated(data.data.user)); },
  }),
  logout: builder.mutation({ query: () => ({ url: '/auth/logout', method: 'POST' }) }),
}) });

export const { useRegisterMutation, useLoginMutation, useRefreshMutation, useCurrentUserQuery, useLogoutMutation } = authApi;
