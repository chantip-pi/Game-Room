import React from 'react';

class TimerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Timer Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-red-100">
          <span className="text-red-600 text-sm">Timer Error</span>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TimerErrorBoundary;
