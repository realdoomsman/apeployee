import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[apeployee] render error:', error); }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 grid place-items-center bg-paper p-6">
          <div className="window max-w-md w-full overflow-hidden">
            <div className="titlebar">ERROR.EXE</div>
            <div className="p-5 bg-paper space-y-3">
              <div className="font-display uppercase text-sm">Something crashed</div>
              <p className="text-sm text-ink-soft">The office hit a snag. Reloading usually fixes it.</p>
              <pre className="sunken p-2 text-[11px] font-mono overflow-x-auto text-stampred">{String(this.state.error?.message || this.state.error)}</pre>
              <button className="btn-xp w-full" onClick={() => window.location.reload()}>Reload APE-OS</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
