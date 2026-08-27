import { Link } from 'react-router-dom';
import { MediaRenderer } from './MediaRenderer';

export function MediaCard({ media }) {
  return <article className="media-card"><Link className="media-card__preview" to={`/media/${media._id}`} aria-label={`Open ${media.title}`}><MediaRenderer mediaType={media.mediaType} src={media.secureUrl} title={media.title} compact /></Link><div className="media-card__body"><div className="media-card__meta"><span>{media.mediaType}</span><span>{media.viewCount} {media.viewCount === 1 ? 'view' : 'views'}</span></div><h2><Link to={`/media/${media._id}`}>{media.title}</Link></h2>{media.tags?.length > 0 && <ul className="tag-list" aria-label="Tags">{media.tags.slice(0, 3).map((tag) => <li key={tag}>{tag}</li>)}</ul>}<time dateTime={media.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(media.createdAt))}</time></div></article>;
}
