"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "flowm_onboarding_dismissed";

export function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <section
      className="border-b border-sky-200 bg-sky-50 px-3 py-4 dark:border-sky-900 dark:bg-sky-950/40 sm:px-6"
      aria-label="Getting started"
    >
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
            New to flowm? Start in three steps
          </p>
          <ol className="mt-2 space-y-1.5 text-sm leading-6 text-sky-900 dark:text-sky-200">
            <li>
              <span className="font-medium">1. Connect GitHub</span> — sign in
              from the header so flowm can read your notifications.
            </li>
            <li>
              <span className="font-medium">2. Connect wallet</span> — link
              Freighter on Stellar testnet for your on-chain identity.
            </li>
            <li>
              <span className="font-medium">3. Type an instruction</span> — try
              &ldquo;Summarize my GitHub notifications&rdquo; and watch the
              agents run.
            </li>
          </ol>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 self-start rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100 dark:hover:bg-sky-900"
        >
          Got it
        </button>
      </div>
    </section>
  );
}
