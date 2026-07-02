"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { FREIGHTER_INSTALL_URL } from "@/lib/stellar/constants";
import { truncateAddress } from "@/lib/stellar/address";
import { trackWalletConnected } from "@/lib/monitoring/analytics";
import {
  RoundedMenu,
  RoundedMenuItem,
} from "@/components/ui/rounded-menu";
import { useWallet } from "./wallet-provider";

type ConnectWalletVariant = "default" | "landing" | "navbar";

interface ConnectWalletProps {
  variant?: ConnectWalletVariant;
  onConnected?: () => void;
}

export function ConnectWallet({
  variant = "default",
  onConnected,
}: ConnectWalletProps) {
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
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastErrorRef = useRef<string | null>(null);
  const connectedNotifiedRef = useRef(false);

  useEffect(() => {
    if (errorCode === "not_installed") {
      setShowInstallHint(true);
      return;
    }
    setShowInstallHint(false);
  }, [errorCode]);

  useEffect(() => {
    if (status !== "connected") {
      connectedNotifiedRef.current = false;
    }
  }, [status]);

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
        setMenuOpen(false);
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
      if (onConnected && !connectedNotifiedRef.current) {
        connectedNotifiedRef.current = true;
        onConnected();
      }
    }
  }

  async function handleCopyAddress() {
    if (!publicKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicKey);
      toast.success("Address copied.");
      setMenuOpen(false);
    } catch {
      toast.error("Could not copy address.");
    }
  }

  function handleDisconnect() {
    disconnect();
    setMenuOpen(false);
    toast.info("Wallet disconnected.");
  }

  const connectButtonClass =
    variant === "landing"
      ? "inline-flex items-center justify-center gap-2 rounded-full bg-zinc-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-600 disabled:opacity-60"
      : variant === "navbar"
        ? "inline-flex items-center justify-center gap-2 rounded-full bg-zinc-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-600 disabled:opacity-60 sm:px-4 sm:text-sm"
        : "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zinc-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-600 disabled:opacity-60 sm:px-4 sm:py-2.5";

  if (status === "connected" && publicKey) {
    return (
      <div ref={panelRef} className="relative">
        {isTestnet === false && (
          <p className="mb-1 text-right text-[11px] text-amber-700" role="status">
            Switch Freighter to testnet
            {networkName ? ` (${networkName})` : ""}
          </p>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-800 transition hover:bg-zinc-100"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          {truncateAddress(publicKey, 4, 4)}
        </button>

        <RoundedMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          align="right"
          placement="below"
          rootRef={panelRef}
        >
          <RoundedMenuItem onClick={handleCopyAddress}>
            Copy address
          </RoundedMenuItem>
          <RoundedMenuItem onClick={handleDisconnect} destructive>
            Disconnect
          </RoundedMenuItem>
        </RoundedMenu>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="relative flex flex-col items-end">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isLoading}
        className={connectButtonClass}
      >
        {isLoading ? (
          <>
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden
            />
            Connecting...
          </>
        ) : variant === "navbar" ? (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect wallet</span>
          </>
        ) : (
          "Connect wallet"
        )}
      </button>

      {error && errorCode !== "not_installed" && (
        <p className="mt-1 max-w-xs text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {showInstallHint && errorCode === "not_installed" && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg"
          role="alert"
        >
          <p className="text-sm font-medium text-zinc-900">Freighter not found</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Install Freighter and switch it to Stellar testnet.
          </p>
          <a
            href={FREIGHTER_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-zinc-900 underline underline-offset-2"
          >
            Get Freighter
          </a>
        </div>
      )}
    </div>
  );
}
