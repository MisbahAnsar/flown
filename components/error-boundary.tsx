"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[flowm] Unexpected UI error:", error, info.componentStack);
    captureMonitoringException(error, { surface: "error_boundary" });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              flowm hit an unexpected error. Reload the page to continue. Your
              wallet and GitHub session are unaffected.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
