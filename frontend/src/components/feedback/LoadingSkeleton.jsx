export function LoadingSkeleton({ count = 3, label = 'Loading content' }) {
  return <div className="skeleton-grid" role="status" aria-label={label}>{Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index} />)}<span className="sr-only">Loading…</span></div>;
}
