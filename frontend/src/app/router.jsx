import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { AuthInitialization } from '../features/auth/AuthInitialization';
import { AuthForm } from '../features/auth/AuthForm';
import { ProtectedRoute, PublicOnlyRoute } from '../features/auth/ProtectedRoute';
import { UploadPage } from '../features/upload/UploadPage';
import { LibraryPage } from '../features/library/LibraryPage';
import { MediaDetailPage } from '../features/media/MediaDetailPage';
import { WelcomePage } from '../pages/WelcomePage';

export const router = createBrowserRouter([{ path: '/', element: <AuthInitialization><AppShell /></AuthInitialization>, errorElement: <EmptyState title="A page could not be opened" actionHref="/" actionLabel="Return home" />, children: [{ index: true, element: <WelcomePage /> }, { element: <PublicOnlyRoute />, children: [{ path: 'login', element: <AuthForm mode="login" /> }, { path: 'register', element: <AuthForm mode="register" /> }] }, { element: <ProtectedRoute />, children: [{ path: 'media', element: <LibraryPage /> }, { path: 'media/mine', element: <Navigate to="/media" replace /> }, { path: 'media/upload', element: <UploadPage /> }, { path: 'media/:id', element: <MediaDetailPage /> }] }, { path: '*', element: <EmptyState title="Page not found" description="The page you requested does not exist." actionHref="/" actionLabel="Return home" /> }] }]);
