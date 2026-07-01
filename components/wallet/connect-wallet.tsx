"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { FREIGHTER_INSTALL_URL } from "@/lib/stellar/constants";
import { truncateAddress } from "@/lib/stellar/address";
import { trackWalletConnected } from "@/lib/monitoring/analytics";
import { useWallet } from "./wallet-provider";

export function ConnectWallet() {
  const toast = useToast();
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
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (errorCode === "not_installed") {
      setShowInstallHint(true);
      return;
    }
    setShowInstallHint(false);
  }, [errorCode]);

  useEffect(() => {
    if (!error || errorCode === "not_installed") {
      lastErrorRef.current = null;
      return;
    }

    if (lastErrorRef.current !== error) {
      lastErrorRef.current = error;
      toast.error(error);
    }
  }, [error, errorCode, toast]);

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
    lastErrorRef.current = null;

    const result = await connect();
    if (result.ok) {
      toast.success("Wallet connected on Stellar testnet.");
      trackWalletConnected({ isTestnet: result.isTestnet });
    }
  }

  function handleDisconnect() {
    disconnect();
    toast.info("Wallet disconnected.");
  }

  if (status === "connected" && publicKey) {
    return (
      <div className="flex max-w-[11rem] flex-col items-end gap-1 sm:max-w-none sm:gap-1.5">
        {isTestnet === false && (
          <p
            className="text-right text-[11px] leading-tight text-amber-600 dark:text-amber-400 sm:text-xs"
            role="status"
          >
            <span className="sm:hidden">Switch Freighter to testnet</span>
            <span className="hidden sm:inline">
              Freighter is not on testnet
              {networkName ? ` (${networkName})` : ""}. Switch to testnet in
              Freighter to continue.
            </span>
          </p>
        )}
        <div className="flex max-w-full items-center gap-1 sm:gap-1.5">
          <span
            className="max-w-[5.5rem] truncate rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-[11px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-sm"
            title={publicKey}
          >
            {truncateAddress(publicKey, 4, 4)}
          </span>
          <button
            type="button"
            onClick={handleDisconnect}
            className="shrink-0 rounded-full border border-zinc-200 px-2 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:px-3 sm:text-sm"
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
    <div ref={panelRef} className="relative flex flex-col items-end">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isLoading}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-2 text-[11px] font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
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
            <span className="sm:hidden">Wallet</span>
          </>
        )}
      </button>

      {error && errorCode !== "not_installed" && (
        <p
          className="mt-1 max-w-[9rem] text-right text-[11px] leading-tight text-red-600 dark:text-red-400 sm:max-w-xs sm:text-xs"
          role="alert"
        >
          {error}
        </p>
      )}

      {showInstallHint && errorCode === "not_installed" && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="alert"
        >
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Freighter not found
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Install the Freighter browser extension, then switch it to Stellar
            testnet.
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
