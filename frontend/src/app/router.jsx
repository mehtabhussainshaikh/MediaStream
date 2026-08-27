import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/feedback/EmptyState';

function Welcome() {
  return <section className="page page--center"><p className="eyebrow">Your private collection</p><h1>Media, thoughtfully kept.</h1><p>Sign in to upload, discover, and manage your multimedia library.</p></section>;
}

export const router = createBrowserRouter([{ path: '/', element: <AppShell />, errorElement: <EmptyState title="A page could not be opened" actionHref="/" actionLabel="Return home" />, children: [{ index: true, element: <Welcome /> }, { path: '*', element: <EmptyState title="Page not found" description="The page you requested does not exist." actionHref="/" actionLabel="Return home" /> }] }]);
