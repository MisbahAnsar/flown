"use client";

import { useFeedback } from "./feedback-provider";

export function FeedbackButton() {
  const { openFeedback } = useFeedback();

  return (
    <button
      type="button"
      onClick={() => openFeedback()}
      className="shrink-0 rounded-full border border-zinc-200 px-2 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:px-3 sm:text-xs"
    >
      <span className="hidden sm:inline">Send feedback</span>
      <span className="sm:hidden">Feedback</span>
    </button>
  );
}
