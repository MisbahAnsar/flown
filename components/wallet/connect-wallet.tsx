"use client";

import { useEffect, useRef, useState } from "react";
import { FREIGHTER_INSTALL_URL } from "@/lib/stellar/constants";
import { truncateAddress } from "@/lib/stellar/address";
import { useWallet } from "./wallet-provider";

export function ConnectWallet() {
  const {
    status,
    publicKey,
    isTestnet,
    networkName,
    isLoading,
    error,
    errorCode,
    connect,
    disconnect,
    clearError,
  } = useWallet();

  const [showInstallHint, setShowInstallHint] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorCode === "not_installed") {
      setShowInstallHint(true);
      return;
    }
    setShowInstallHint(false);
  }, [errorCode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setShowInstallHint(false);
        clearError();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearError]);

  async function handleConnect() {
    clearError();
    setShowInstallHint(false);
    await connect();
  }

  if (status === "connected" && publicKey) {
    return (
      <div className="flex flex-col items-end gap-1.5 sm:gap-2">
        {isTestnet === false && (
          <p
            className="max-w-[14rem] text-right text-xs text-amber-600 dark:text-amber-400 sm:max-w-none"
            role="status"
          >
            <span className="sm:hidden">Wrong network</span>
            <span className="hidden sm:inline">
              Freighter is not on testnet
              {networkName ? ` (${networkName})` : ""}. Switch to testnet in
              Freighter.
            </span>
          </p>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:px-3 sm:text-sm"
            title={publicKey}
          >
            {truncateAddress(publicKey, 4, 4)}
          </span>
          <button
            type="button"
            onClick={disconnect}
            className="rounded-full border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:px-3 sm:text-sm"
          >
            <span className="sm:hidden" aria-label="Disconnect wallet">
              Exit
            </span>
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="relative flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isLoading}
        className="inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:min-w-0 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        {isLoading ? (
          <>
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900"
              aria-hidden
            />
            <span className="hidden sm:inline">Connecting...</span>
            <span className="sm:hidden">...</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </>
        )}
      </button>

      {error && errorCode !== "not_installed" && (
        <p
          className="max-w-[14rem] text-right text-xs text-red-600 dark:text-red-400 sm:max-w-xs"
          role="alert"
        >
          {error}
        </p>
      )}

      {showInstallHint && errorCode === "not_installed" && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="alert"
        >
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Freighter not found
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Install the Freighter browser extension to connect your Stellar
            wallet.
          </p>
          <a
            href={FREIGHTER_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
          >
            Get Freighter
          </a>
        </div>
      )}
    </div>
  );
}
