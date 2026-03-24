import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-500 mb-5 max-w-sm">
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm rounded-xl hover:bg-zinc-800 transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}