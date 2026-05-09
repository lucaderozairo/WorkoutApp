import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  domain: 'workout' | 'social' | 'messages' | 'health' | 'analytics';
  children: ReactNode;
  fallback?: ReactNode;
}

interface State { hasError: boolean; }

export class DomainErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.domain}] boundary caught:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="column surface" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Something went wrong in {this.props.domain}.</p>
          <button className="primary" onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
