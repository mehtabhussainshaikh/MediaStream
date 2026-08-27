import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { AuthInitialization } from '../features/auth/AuthInitialization';
import { AuthForm } from '../features/auth/AuthForm';
import { ProtectedRoute, PublicOnlyRoute } from '../features/auth/ProtectedRoute';
import { UploadPage } from '../features/upload/UploadPage';
import { LibraryPage } from '../features/library/LibraryPage';
import { MediaDetailPage } from '../features/media/MediaDetailPage';

function Welcome() {
  return <section className="page page--center"><p className="eyebrow">Your private collection</p><h1>Media, thoughtfully kept.</h1><p>Sign in to upload, discover, and manage your multimedia library.</p></section>;
}

export const router = createBrowserRouter([{ path: '/', element: <AuthInitialization><AppShell /></AuthInitialization>, errorElement: <EmptyState title="A page could not be opened" actionHref="/" actionLabel="Return home" />, children: [{ index: true, element: <Welcome /> }, { element: <PublicOnlyRoute />, children: [{ path: 'login', element: <AuthForm mode="login" /> }, { path: 'register', element: <AuthForm mode="register" /> }] }, { element: <ProtectedRoute />, children: [{ path: 'media', element: <LibraryPage /> }, { path: 'media/mine', element: <LibraryPage mine /> }, { path: 'media/upload', element: <UploadPage /> }, { path: 'media/:id', element: <MediaDetailPage /> }] }, { path: '*', element: <EmptyState title="Page not found" description="The page you requested does not exist." actionHref="/" actionLabel="Return home" /> }] }]);
