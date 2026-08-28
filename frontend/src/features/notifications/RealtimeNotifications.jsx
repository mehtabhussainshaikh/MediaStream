import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { api } from '../../services/api';

const realtimeUrl = (import.meta.env.VITE_REALTIME_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export function RealtimeNotifications() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const currentUserId = useSelector((state) => state.auth.user?._id);
  const dispatch = useDispatch();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!accessToken) return undefined;
    const socket = io(realtimeUrl, { auth: { token: accessToken }, transports: ['websocket', 'polling'], reconnectionDelayMax: 5_000 });
    socket.on('media:uploaded', (event) => {
      dispatch(api.util.invalidateTags([{ type: 'MediaList', id: 'LIST' }, 'MyMedia']));
      setNotification({ ...event, own: String(event.ownerId) === String(currentUserId) });
    });
    return () => socket.close();
  }, [accessToken, currentUserId, dispatch]);

  useEffect(() => {
    if (!notification) return undefined;
    const timeout = setTimeout(() => setNotification(null), 7_000);
    return () => clearTimeout(timeout);
  }, [notification]);

  if (!notification) return <div className="sr-only" aria-live="polite" aria-atomic="true" />;
  return <aside className="realtime-toast" role="status" aria-live="polite" aria-atomic="true"><span className="realtime-toast__mark" aria-hidden="true">✦</span><div><strong>{notification.own ? 'Upload complete' : 'New media added'}</strong><p>{notification.title} is now available in your media.</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotification(null)}>×</button></aside>;
}
