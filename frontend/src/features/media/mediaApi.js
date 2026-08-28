import { api } from '../../services/api';

const listTags = (result) => result?.data?.media?.length ? [...result.data.media.map(({ _id }) => ({ type: 'Media', id: _id })), { type: 'MediaList', id: 'LIST' }] : [{ type: 'MediaList', id: 'LIST' }];

export const mediaApi = api.injectEndpoints({ endpoints: (builder) => ({
  myMedia: builder.query({ query: (params) => ({ url: '/media/mine', params }), providesTags: (result) => [...listTags(result), 'MyMedia'] }),
  mediaById: builder.query({ query: (id) => `/media/${id}`, providesTags: (_result, _error, id) => [{ type: 'Media', id }] }),
  uploadMedia: builder.mutation({ query: (body) => ({ url: '/media', method: 'POST', body }), invalidatesTags: [{ type: 'MediaList', id: 'LIST' }, 'MyMedia'] }),
  recordView: builder.mutation({ query: (id) => ({ url: `/media/${id}/view`, method: 'POST' }), invalidatesTags: (_result, _error, id) => [{ type: 'Media', id }, { type: 'MediaList', id: 'LIST' }] }),
  updateMedia: builder.mutation({ query: ({ id, ...body }) => ({ url: `/media/${id}`, method: 'PATCH', body }), invalidatesTags: (_result, _error, { id }) => [{ type: 'Media', id }, { type: 'MediaList', id: 'LIST' }, 'MyMedia'] }),
  deleteMedia: builder.mutation({ query: (id) => ({ url: `/media/${id}`, method: 'DELETE' }), invalidatesTags: (_result, _error, id) => [{ type: 'Media', id }, { type: 'MediaList', id: 'LIST' }, 'MyMedia'] }),
}) });

export const { useMyMediaQuery, useMediaByIdQuery, useUploadMediaMutation, useRecordViewMutation, useUpdateMediaMutation, useDeleteMediaMutation } = mediaApi;
