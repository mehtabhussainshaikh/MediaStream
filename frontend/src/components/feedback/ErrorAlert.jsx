export function ErrorAlert({ message, onRetry }) {
  if (!message) return null;
  return <div className="alert alert--error" role="alert"><span>{message}</span>{onRetry && <button className="button button--text" type="button" onClick={onRetry}>Try again</button>}</div>;
}
