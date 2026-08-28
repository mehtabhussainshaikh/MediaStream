import { useState } from 'react';

export function MediaRenderer({ mediaType, src, title, compact = false }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <div className="media-fallback" role="img" aria-label={`${title} preview unavailable`}><span aria-hidden="true">{iconFor(mediaType)}</span><strong>Preview unavailable</strong>{src && <a href={src} target="_blank" rel="noreferrer">Open original</a>}</div>;
  const props = { src, onError: () => setFailed(true) };
  if (mediaType === 'image') return <img className="media-renderer" {...props} alt={title} loading="lazy" />;
  if (mediaType === 'video') return compact ? <video className="media-renderer" {...props} muted preload="metadata" aria-label={title} /> : <video className="media-renderer" {...props} controls preload="metadata" aria-label={title} />;
  if (mediaType === 'audio') return <div className="audio-renderer"><span aria-hidden="true">♫</span><audio {...props} controls preload="metadata" aria-label={title} /></div>;
  if (mediaType === 'pdf') return <iframe className={compact ? 'pdf-thumbnail' : 'pdf-renderer'} src={`${src}#page=1&view=FitH${compact ? '&toolbar=0&navpanes=0&scrollbar=0' : ''}`} title={`${title} PDF preview`} loading="lazy" tabIndex={compact ? '-1' : undefined} />;
  return <div className="media-fallback">Unsupported media type</div>;
}

function iconFor(type) { return ({ image: '▧', video: '▷', audio: '♫', pdf: '¶' })[type] || '◇'; }
