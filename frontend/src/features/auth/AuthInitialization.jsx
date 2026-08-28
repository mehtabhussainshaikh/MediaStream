import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sessionChecking, sessionCleared } from './authSlice';
import { useRefreshMutation } from './authApi';

export function AuthInitialization({ children }) {
  const status = useSelector((state) => state.auth.status);
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();
  const started = useRef(false);
  useEffect(() => {
    if (started.current || status !== 'idle') return;
    started.current = true; dispatch(sessionChecking());
    refresh().unwrap().catch(() => dispatch(sessionCleared()));
  }, [dispatch, refresh, status]);
  if (status === 'idle' || status === 'checking') return <div className="auth-loading" role="status"><span className="brand__mark">M</span><span>Restoring your media…</span></div>;
  return children;
}
