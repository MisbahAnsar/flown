"use client";

import Link from "next/link";
import { Suspense } from "react";
import { GitHubAuth } from "@/components/auth/github-auth";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { ConnectWallet } from "@/components/wallet/connect-wallet";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg"
        >
          flowm
        </Link>
        <div className="flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-2">
          <FeedbackButton />
          <Suspense
            fallback={
              <div className="h-9 w-[4.5rem] animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800 sm:h-10 sm:w-28" />
            }
          >
            <GitHubAuth />
          </Suspense>
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
