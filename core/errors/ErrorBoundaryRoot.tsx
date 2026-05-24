import { Component, ErrorInfo, ReactNode } from 'react';
import { telemetry } from '@core/telemetry/TelemetryLogger';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMessage: string; }

export class ErrorBoundaryRoot extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    telemetry.logError('root', error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="column surface centered" role="alert">
          <h2>Something went wrong</h2>
          <p className="caption">Your data is safe — this is a display error.</p>
          {this.state.errorMessage && (
            <code className="caption mono">{this.state.errorMessage}</code>
          )}
          <div className="cluster">
            <button
              type="button"
              className="primary"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            >
              Try again
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
