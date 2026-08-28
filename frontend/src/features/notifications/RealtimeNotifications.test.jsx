import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '../../services/api';
import authReducer from '../auth/authSlice';
import { RealtimeNotifications } from './RealtimeNotifications';

const handlers = {};
const close = vi.fn();
vi.mock('socket.io-client', () => ({ io: vi.fn(() => ({ on: (name, callback) => { handlers[name] = callback; }, close })) }));

beforeEach(() => { Object.keys(handlers).forEach((key) => delete handlers[key]); close.mockClear(); });

it('announces upload events and closes the authenticated socket', () => {
  const store = configureStore({ reducer: { auth: authReducer, [api.reducerPath]: api.reducer }, preloadedState: { auth: { status: 'authenticated', accessToken: 'token', user: { _id: 'user-1' } } }, middleware: (getDefault) => getDefault().concat(api.middleware) });
  const view = render(<Provider store={store}><RealtimeNotifications /></Provider>);
  act(() => handlers['media:uploaded']({ id: 'media-1', ownerId: 'user-1', title: 'A new piece', mediaType: 'image' }));
  expect(screen.getByRole('status')).toHaveTextContent('Upload complete');
  expect(screen.getByRole('status')).toHaveTextContent('A new piece is now available in your media');
  view.unmount();
  expect(close).toHaveBeenCalled();
});
