import React from 'react';

class GameRoomErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    if (error) {
      return { hasError: true, error: error.message, errorInfo: error };
    }
    return { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error.message,
      errorInfo: error
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
              <h2 className="text-lg font-bold mb-2">Game Room Error</h2>
              <p className="mb-2">{this.state.error}</p>
              <details className="text-left text-sm text-gray-600">
                <summary className="font-semibold cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {this.state.errorInfo && JSON.stringify(this.state.errorInfo, null, 2)}
                </pre>
              </details>
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameRoomErrorBoundary;
