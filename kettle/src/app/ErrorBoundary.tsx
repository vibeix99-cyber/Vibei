import { Component, type ReactNode } from 'react';

interface Props {
  /** Name shown in logs. */
  area: string;
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

/** Isolates areas so one crash never takes down the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(`[${this.props.area}] crashed`, error);
  }
  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div role="alert" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-2)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Oops — the kettle tipped over.</p>
            <button type="button" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
