import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ConfirmDialog } from '../../components/dialog/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { MediaRenderer } from '../../components/media/MediaRenderer';
import { getApiError } from '../../services/api';
import { EditMediaForm } from './EditMediaForm';
import { useDeleteMediaMutation, useMediaByIdQuery, useRecordViewMutation } from './mediaApi';

export function MediaDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const location = useLocation(); const user = useSelector((state) => state.auth.user); const detail = useMediaByIdQuery(id); const [recordView] = useRecordViewMutation(); const viewed = useRef(false); const [editing, setEditing] = useState(false); const [confirming, setConfirming] = useState(false); const [remove, removeState] = useDeleteMediaMutation();
  const media = detail.data?.data?.media;
  useEffect(() => { if (!media || viewed.current) return; viewed.current = true; recordView(media._id); }, [media, recordView]);
  if (detail.isLoading) return <section className="page"><LoadingSkeleton count={1} label="Loading media details" /></section>;
  if (detail.error?.status === 404) return <EmptyState title="Media not found" description="This piece may have been removed or the link is incorrect." actionHref="/media" actionLabel="Back to library" />;
  if (detail.isError) return <section className="page"><ErrorAlert message={getApiError(detail.error, 'Media details could not be loaded.')} onRetry={detail.refetch} /></section>;
  const owner = user && (user.role === 'admin' || String(media.ownerId?._id || media.ownerId) === String(user._id));
  const deleteItem = async () => { try { await remove(media._id).unwrap(); navigate('/media/mine', { replace: true, state: { deleted: true } }); } catch { /* dialog stays open */ } };
  return <article className="page detail-page">{location.state?.uploaded && <p className="status-message" role="status">Upload complete. Your media is ready.</p>}<Link className="back-link" to="/media">← Back to media</Link><header className="detail-header"><div><p className="eyebrow">{media.mediaType} · {media.viewCount} {media.viewCount === 1 ? 'view' : 'views'}</p><h1>{media.title}</h1></div>{owner && !editing && <div className="owner-actions"><DownloadButton url={media.secureUrl} filename={media.originalName || media.title} /><button className="button button--secondary" type="button" onClick={() => setEditing(true)}>Edit metadata</button><button className="button button--danger" type="button" onClick={() => setConfirming(true)}>Delete</button></div>}</header><div className="detail-layout"><section className="detail-preview" aria-label="Media preview"><MediaRenderer mediaType={media.mediaType} src={media.secureUrl} title={media.title} /></section><aside className="metadata-panel"><p className="eyebrow">Archive notes</p>{editing ? <EditMediaForm media={media} onDone={() => setEditing(false)} /> : <><p className="description">{media.description || 'No description has been added.'}</p>{media.tags?.length > 0 && <ul className="tag-list" aria-label="Tags">{media.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}<dl><div><dt>Original file</dt><dd>{media.originalName}</dd></div><div><dt>Format</dt><dd>{media.format?.toUpperCase()}</dd></div><div><dt>Size</dt><dd>{formatBytes(media.sizeBytes)}</dd></div><div><dt>Added</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(media.createdAt))}</dd></div>{media.dimensions?.width && <div><dt>Dimensions</dt><dd>{media.dimensions.width} × {media.dimensions.height}</dd></div>}{media.duration != null && <div><dt>Duration</dt><dd>{formatDuration(media.duration)}</dd></div>}</dl></>}</aside></div>{confirming && <ConfirmDialog title={`Delete “${media.title}”?`} confirmLabel="Delete permanently" busy={removeState.isLoading} onClose={() => setConfirming(false)} onConfirm={deleteItem}><p>This removes the media and its metadata. This action cannot be undone.</p><ErrorAlert message={removeState.error && getApiError(removeState.error, 'The media could not be deleted.')} /></ConfirmDialog>}</article>;
}
function DownloadButton({ url, filename }) { return <a className="button button--secondary" href={url} download={filename} target="_blank" rel="noreferrer" aria-label={`Download ${filename}`}>↓ Download</a>; }
function formatBytes(bytes) { if (!Number.isFinite(bytes)) return 'Unknown'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`; }
function formatDuration(seconds) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, '0')}`; }
