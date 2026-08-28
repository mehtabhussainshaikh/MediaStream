import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../services/api';
import { useLogoutMutation } from '../../features/auth/authApi';
import { sessionCleared } from '../../features/auth/authSlice';
import { RealtimeNotifications } from '../../features/notifications/RealtimeNotifications';

export function AppShell() {
  const user = useSelector((state) => state.auth.user); const dispatch = useDispatch(); const navigate = useNavigate(); const [logout, { isLoading }] = useLogoutMutation();
  const signOut = async () => { try { await logout().unwrap(); } catch { /* local cleanup is required regardless */ } finally { dispatch(sessionCleared()); dispatch(api.util.resetApiState()); navigate('/login', { replace: true }); } };
  return <div className="app-shell"><header className="site-header"><NavLink className="brand" to={user ? '/media' : '/'} aria-label="MediaStream home"><span className="brand__mark" aria-hidden="true">M</span><span>MediaStream</span></NavLink>{user && <HeaderSearch />}<nav aria-label="Primary navigation">{user ? <><NavLink to="/media">Library</NavLink><NavLink to="/media/mine">My media</NavLink><NavLink className="upload-link" to="/media/upload">Upload</NavLink><button className="nav-button" type="button" onClick={signOut} disabled={isLoading}>Sign out</button></> : <><NavLink to="/login">Sign in</NavLink><NavLink to="/register">Register</NavLink></>}</nav></header>{user && <RealtimeNotifications />}<main id="main-content"><Outlet /></main><footer className="site-footer"><span>MediaStream</span><span>Curate what matters.</span></footer></div>;
}

function HeaderSearch() {
  const location = useLocation(); const navigate = useNavigate(); const [params] = useSearchParams(); const [query, setQuery] = useState(params.get('q') || '');
  const libraryRoute = location.pathname === '/media' || location.pathname === '/media/mine';
  useEffect(() => setQuery(libraryRoute ? params.get('q') || '' : ''), [libraryRoute, params]);
  const submit = (event) => { event.preventDefault(); const next = new URLSearchParams(libraryRoute ? params : undefined); const value = query.trim(); if (value) { next.set('q', value); next.set('sort', 'relevance'); } else { next.delete('q'); next.delete('sort'); } next.delete('page'); navigate(`/media${next.size ? `?${next}` : ''}`); };
  return <form className="header-search" role="search" onSubmit={submit}><span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="header-search">Search media</label><input id="header-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media…" /><button type="submit">Search</button></form>;
}
