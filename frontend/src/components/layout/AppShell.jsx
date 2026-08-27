import { NavLink, Outlet } from 'react-router-dom';

export function AppShell() {
  return <div className="app-shell"><header className="site-header"><NavLink className="brand" to="/" aria-label="MediaStream home"><span className="brand__mark" aria-hidden="true">M</span><span>MediaStream</span></NavLink><nav aria-label="Primary navigation"><NavLink to="/login">Sign in</NavLink></nav></header><main id="main-content"><Outlet /></main><footer className="site-footer"><span>MediaStream</span><span>Curate what matters.</span></footer></div>;
}
