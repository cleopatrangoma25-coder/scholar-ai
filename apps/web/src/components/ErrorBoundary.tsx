import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
              <p className="text-gray-600 mb-4">
                The application encountered an error. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mb-4"
              >
                Refresh Page
              </button>
              
              {(this.state.error || this.state.errorInfo) && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 font-medium">Error Details</summary>
                  <div className="mt-2 space-y-2">
                    {this.state.error && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Error:</h4>
                        <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Component Stack:</h4>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
