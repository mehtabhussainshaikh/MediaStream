import { Link } from 'react-router-dom';

export function EmptyState({ title, description, actionHref, actionLabel }) {
  return <section className="empty-state"><div className="empty-state__ornament" aria-hidden="true">✦</div><h1>{title}</h1>{description && <p>{description}</p>}{actionHref && <Link className="button" to={actionHref}>{actionLabel}</Link>}</section>;
}
