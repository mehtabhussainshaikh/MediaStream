import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { MediaCard } from '../../components/media/MediaCard';
import { getApiError } from '../../services/api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useMyMediaQuery } from '../media/mediaApi';
import { Pagination } from './Pagination';
import { SearchControls } from './SearchControls';

const defaults = { q: '', type: '', tags: '', from: '', to: '', sort: 'newest', page: '1' };
export function MediaPage() {
  const [params, setParams] = useSearchParams();
  const urlValues = useMemo(() => Object.fromEntries(Object.keys(defaults).map((key) => [key, params.get(key) || defaults[key]])), [params]);
  const [draftQuery, setDraftQuery] = useState(urlValues.q); const debouncedQuery = useDebouncedValue(draftQuery, 400);
  useEffect(() => { if (debouncedQuery === urlValues.q) return; setParams((current) => { if (debouncedQuery) { current.set('q', debouncedQuery); current.set('sort', 'relevance'); } else { current.delete('q'); current.delete('sort'); } current.delete('page'); return current; }, { replace: true }); }, [debouncedQuery, setParams, urlValues.q]);
  useEffect(() => setDraftQuery(urlValues.q), [urlValues.q]);
  const queryArgs = useMemo(() => {
    const values = urlValues.q ? { ...urlValues, sort: 'relevance' } : urlValues;
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value));
  }, [urlValues]);
  const result = useMyMediaQuery(queryArgs);
  const change = (name, value) => { if (name === 'q') { setDraftQuery(value); return; } setParams((current) => { if (value && value !== defaults[name]) current.set(name, value); else current.delete(name); if (name !== 'page') current.delete('page'); return current; }); };
  const clear = () => { setDraftQuery(''); setParams({}); };
  const items = result.data?.data?.media || []; const meta = result.data?.meta;
  const hasFilters = Object.entries(urlValues).some(([key, value]) => key !== 'page' && value && value !== defaults[key]);
  return <section className="page media-page"><header className="page-header"><div><p className="eyebrow">Private collection</p><h1>Your media</h1></div><p>Only media uploaded by your account appears here.</p></header><SearchControls values={{ ...urlValues, q: draftQuery }} onChange={change} onClear={clear} />{result.isLoading ? <LoadingSkeleton count={6} label="Loading media" /> : result.isError ? <ErrorAlert message={getApiError(result.error, 'Your media could not be loaded.')} onRetry={result.refetch} /> : items.length === 0 ? <EmptyState title={hasFilters ? 'No matching media' : 'Your media is empty'} description={hasFilters ? 'Try changing or clearing the current search.' : 'Upload your first piece to begin.'} actionHref={!hasFilters ? '/media/upload' : undefined} actionLabel="Upload media" /> : <><div className="result-summary"><span>{meta?.total ?? items.length} {meta?.total === 1 ? 'item' : 'items'}</span><Link to="/media/upload">Add media</Link></div><div className="media-grid">{items.map((media) => <MediaCard key={media._id} media={media} />)}</div><Pagination meta={meta} onPage={(page) => change('page', String(page))} /></>}</section>;
}
