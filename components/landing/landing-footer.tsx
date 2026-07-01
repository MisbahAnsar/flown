"use client";

import Link from "next/link";
import { useFeedback } from "@/components/feedback/feedback-provider";

export function LandingFooter() {
  const { openFeedback } = useFeedback();

  return (
    <footer className="border-t border-zinc-200 bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="font-heading text-lg text-zinc-900">flowms</p>
          <p className="mt-1 text-sm text-zinc-500">
            Verifiable agent actions on Stellar testnet.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-600">
          <Link href="/app" className="transition hover:text-zinc-900">
            Workspace
          </Link>
          <button
            type="button"
            onClick={() => openFeedback()}
            className="transition hover:text-zinc-900"
          >
            Send feedback
          </button>
          <a
            href="https://flowms.vercel.app"
            className="transition hover:text-zinc-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            flowms.vercel.app
          </a>
        </div>
      </div>
    </footer>
  );
}
