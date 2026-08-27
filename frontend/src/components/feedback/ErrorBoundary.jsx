import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <section className="empty-state" role="alert"><div className="empty-state__ornament" aria-hidden="true">✦</div><h1>Something went wrong</h1><p>The interface encountered an unexpected problem.</p><button className="button" type="button" onClick={() => window.location.reload()}>Reload application</button></section> : this.props.children; }
}
