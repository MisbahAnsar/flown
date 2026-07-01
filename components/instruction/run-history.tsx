"use client";

import type { PipelineErrorResponse } from "@/lib/pipeline/types";
import type { FeedStep } from "./activity-feed";

export type RunRecordStatus = "running" | "success" | "error";

export interface InstructionRun {
  id: string;
  instructionText: string;
  createdAt: string;
  status: RunRecordStatus;
  steps: FeedStep[];
  summary?: string;
  stellarTxHash?: string;
  error?: PipelineErrorResponse;
}

export function RunHistory({
  runs,
  activeRunId,
  onSelect,
}: {
  runs: InstructionRun[];
  activeRunId: string | null;
  onSelect: (runId: string) => void;
}) {
  if (runs.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Instruction history"
    >
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Session history
        </h2>
      </div>
      <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
        {runs.map((run) => (
          <li key={run.id}>
            <button
              type="button"
              onClick={() => onSelect(run.id)}
              className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                activeRunId === run.id ? "bg-zinc-50 dark:bg-zinc-900/60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                  {run.instructionText}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(run.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <StatusBadge status={run.status} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusBadge({ status }: { status: RunRecordStatus }) {
  const styles = {
    running:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  } as const;

  const labels = {
    running: "Running",
    success: "Done",
    error: "Failed",
  } as const;

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
