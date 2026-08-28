import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProtectedRoute() {
  const authenticated = useSelector((state) => state.auth.status === 'authenticated');
  const location = useLocation();
  return authenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}

export function PublicOnlyRoute() {
  const authenticated = useSelector((state) => state.auth.status === 'authenticated');
  return authenticated ? <Navigate to="/media" replace /> : <Outlet />;
}
