"use client";

import Link from "next/link";
import { ConnectWallet } from "@/components/wallet/connect-wallet";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg"
        >
          flowm
        </Link>
        <ConnectWallet />
      </div>
    </header>
  );
}
