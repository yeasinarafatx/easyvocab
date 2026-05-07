"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React component errors and displays user-friendly message
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🔴 Error caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Optional: Send error to monitoring service
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
          {/* Background gradient */}
          <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />

          {/* Error content */}
          <div className="relative z-10 w-full max-w-md px-6">
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 backdrop-blur-xl">
              <div className="text-4xl mb-4">⚠️</div>

              <h1 className="text-2xl font-extrabold text-red-100">কিছু সমস্যা হয়েছে</h1>

              <p className="mt-3 text-sm text-red-100/80">
                অ্যাপে একটি unexpected error ঘটেছে। আমরা এটি সমাধান করছি।
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6 cursor-pointer">
                  <summary className="text-xs font-mono text-red-200 hover:text-red-100">
                    📋 Error Details (Dev Mode)
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-black/50 p-3 text-xs text-red-100 max-h-40">
                    {this.state.error.toString()}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 transition"
                >
                  আবার চেষ্টা করুন
                </button>

                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/";
                    }
                  }}
                  className="flex-1 rounded-lg bg-slate-500/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-500/30 transition"
                >
                  Home এ যান
                </button>
              </div>

              <p className="mt-4 text-xs text-red-100/60">
                Problem একেবারে হলে support এ যোগাযোগ করুন।
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
