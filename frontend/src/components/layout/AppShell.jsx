import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../services/api';
import { useLogoutMutation } from '../../features/auth/authApi';
import { sessionCleared } from '../../features/auth/authSlice';

export function AppShell() {
  const user = useSelector((state) => state.auth.user); const dispatch = useDispatch(); const navigate = useNavigate(); const [logout, { isLoading }] = useLogoutMutation();
  const signOut = async () => { try { await logout().unwrap(); } catch { /* local cleanup is required regardless */ } finally { dispatch(sessionCleared()); dispatch(api.util.resetApiState()); navigate('/login', { replace: true }); } };
  return <div className="app-shell"><header className="site-header"><NavLink className="brand" to={user ? '/media' : '/'} aria-label="MediaStream home"><span className="brand__mark" aria-hidden="true">M</span><span>MediaStream</span></NavLink><nav aria-label="Primary navigation">{user ? <><NavLink to="/media">Library</NavLink><NavLink to="/media/mine">My media</NavLink><NavLink to="/media/upload">Upload</NavLink><button className="nav-button" type="button" onClick={signOut} disabled={isLoading}>Sign out</button></> : <><NavLink to="/login">Sign in</NavLink><NavLink to="/register">Register</NavLink></>}</nav></header><main id="main-content"><Outlet /></main><footer className="site-footer"><span>MediaStream</span><span>Curate what matters.</span></footer></div>;
}
