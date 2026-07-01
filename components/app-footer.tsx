"use client";

import { FeedbackButton } from "@/components/feedback/feedback-button";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white/80 px-3 py-4 dark:border-zinc-800 dark:bg-black/80 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col items-center justify-between gap-3 text-xs text-zinc-500 sm:flex-row dark:text-zinc-400">
        <p>
          flowms logs agent actions on Stellar testnet. Built for transparent,
          verifiable automation.
        </p>
        <FeedbackButton />
      </div>
    </footer>
  );
}
