export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Media pages"><button className="button button--secondary" type="button" disabled={!meta.hasPreviousPage} onClick={() => onPage(meta.page - 1)}>Previous</button><span aria-live="polite">Page {meta.page} of {meta.totalPages}</span><button className="button button--secondary" type="button" disabled={!meta.hasNextPage} onClick={() => onPage(meta.page + 1)}>Next</button></nav>;
}
