import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { MediaCard } from '../../components/media/MediaCard';
import { getApiError } from '../../services/api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useMyMediaQuery, useSearchMediaQuery } from '../media/mediaApi';
import { Pagination } from './Pagination';
import { SearchControls } from './SearchControls';

const defaults = { q: '', type: '', tags: '', from: '', to: '', sort: 'newest', page: '1' };
export function LibraryPage({ mine = false }) {
  const [params, setParams] = useSearchParams();
  const urlValues = useMemo(() => Object.fromEntries(Object.keys(defaults).map((key) => [key, params.get(key) || defaults[key]])), [params]);
  const [draftQuery, setDraftQuery] = useState(urlValues.q); const debouncedQuery = useDebouncedValue(draftQuery, 400);
  useEffect(() => { if (debouncedQuery === urlValues.q) return; setParams((current) => { if (debouncedQuery) { current.set('q', debouncedQuery); current.set('sort', 'relevance'); } else { current.delete('q'); current.delete('sort'); } current.delete('page'); return current; }, { replace: true }); }, [debouncedQuery, setParams, urlValues.q]);
  useEffect(() => setDraftQuery(urlValues.q), [urlValues.q]);
  const queryArgs = useMemo(() => {
    const values = urlValues.q ? { ...urlValues, sort: 'relevance' } : urlValues;
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value));
  }, [urlValues]);
  const search = useSearchMediaQuery(queryArgs, { skip: mine }); const owned = useMyMediaQuery({ page: Number(urlValues.page), limit: 20 }, { skip: !mine }); const result = mine ? owned : search;
  const change = (name, value) => { if (name === 'q') { setDraftQuery(value); return; } setParams((current) => { if (value && value !== defaults[name]) current.set(name, value); else current.delete(name); if (name !== 'page') current.delete('page'); return current; }); };
  const clear = () => { setDraftQuery(''); setParams({}); };
  const items = result.data?.data?.media || []; const meta = result.data?.meta;
  return <section className="page library-page"><header className="page-header"><div><p className="eyebrow">{mine ? 'Personal archive' : 'Discover'}</p><h1>{mine ? 'My media' : 'The library'}</h1></div><p>{mine ? 'Every piece you have contributed, gathered in one place.' : 'Search the collection without disturbing the order chosen by the archive.'}</p></header>{!mine && <SearchControls values={{ ...urlValues, q: draftQuery }} onChange={change} onClear={clear} />}{result.isLoading ? <LoadingSkeleton count={6} label="Loading media" /> : result.isError ? <ErrorAlert message={getApiError(result.error, 'The library could not be loaded.')} onRetry={result.refetch} /> : items.length === 0 ? <EmptyState title={Object.values(urlValues).some(Boolean) && !mine ? 'No matching media' : mine ? 'Your shelf is empty' : 'The library is quiet'} description={mine ? 'Upload your first piece to begin.' : 'Try changing or clearing the current search.'} actionHref={mine ? '/media/upload' : undefined} actionLabel="Upload media" /> : <><div className="result-summary"><span>{meta?.total ?? items.length} {meta?.total === 1 ? 'item' : 'items'}</span><Link to="/media/upload">Add media</Link></div><div className="media-grid">{items.map((media) => <MediaCard key={media._id} media={media} />)}</div><Pagination meta={meta} onPage={(page) => change('page', String(page))} /></>}</section>;
}
