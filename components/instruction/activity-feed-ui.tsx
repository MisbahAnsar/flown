"use client";

import type { FeedStep } from "./activity-feed";

function StepIcon({ status }: { status: FeedStep["status"] }) {
  if (status === "running") {
    return (
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
        aria-hidden
      />
    );
  }

  if (status === "success") {
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        aria-hidden
      >
        ✓
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
        aria-hidden
      >
        !
      </span>
    );
  }

  if (status === "skipped") {
    return (
      <span
        className="h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-700"
        aria-hidden
      />
    );
  }

  return (
    <span
      className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600"
      aria-hidden
    />
  );
}

export function ActivityFeed({ steps }: { steps: FeedStep[] }) {
  return (
    <ol className="space-y-3" aria-label="Pipeline activity">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="mt-0.5 flex flex-col items-center">
            <StepIcon status={step.status} />
            {index < steps.length - 1 && (
              <span className="mt-2 h-full min-h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {step.label}
              </p>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {step.description}
              </span>
            </div>
            {step.error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {step.error}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
