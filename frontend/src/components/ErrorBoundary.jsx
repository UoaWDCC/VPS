import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ componentStack: info.componentStack });
  }

  reset = () => {
    this.setState({ error: null, componentStack: null });
  };

  render() {
    const { error, componentStack } = this.state;

    if (!error) return this.props.children;

    if (!import.meta.env.DEV) {
      return (
        <div className="flex flex-col gap-4 items-center h-screen justify-center">
          <h1 className="text-xl">{"Something went wrong :\\"}</h1>
          <p className="text-sm opacity-70">
            An unexpected error occurred. Please refresh the page or try again
            later.
          </p>
          <button className="btn btn-primary" onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-base-100 text-base-content p-6">
        <div className="mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-error">
              Unhandled React Error
            </h1>
            <span className="ml-2 text-error opacity-70">dev mode</span>
          </div>

          {/* Error message */}
          <div className="bg-error/10 border border-error rounded-lg p-4">
            <p className="text-error font-semibold text-sm mb-1">
              {error.name}
            </p>
            <p className="text-base-content text-base">{error.message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="btn btn-sm btn-error" onClick={this.reset}>
              Try again
            </button>
            <button
              className="btn btn-sm btn-ghost text-error"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <button
              className="btn btn-sm btn-ghost text-error"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${error.name}: ${error.message}\n\nStack:\n${error.stack}\n\nComponent stack:${componentStack}`
                )
              }
            >
              Copy to clipboard
            </button>
          </div>

          {/* JS stack */}
          {error.stack && (
            <details open>
              <summary className="cursor-pointer text-sm text-error mb-2 select-none">
                JS stack trace
              </summary>
              <pre className="bg-base-200 border border-error/40 rounded p-3 text-xs text-base-content overflow-auto max-h-64 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Component stack */}
          {componentStack && (
            <details open>
              <summary className="cursor-pointer text-sm text-error mb-2 select-none">
                React component stack
              </summary>
              <pre className="bg-base-200 border border-error/40 rounded p-3 text-xs text-base-content overflow-auto max-h-64 whitespace-pre-wrap">
                {componentStack.trim()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
