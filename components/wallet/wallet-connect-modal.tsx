"use client";

import { useEffect, useRef } from "react";
import { ConnectWallet } from "./connect-wallet";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function WalletConnectModal({
  open,
  onClose,
  onConnected,
}: WalletConnectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-[100] m-auto w-[min(100%,24rem)] rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-zinc-700/30"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-zinc-900">
              Connect your wallet
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              flowms uses Freighter on Stellar testnet to link your on-chain
              identity before you enter the workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex justify-center">
        {open ? (
          <ConnectWallet
            variant="landing"
            onConnected={onConnected}
          />
        ) : null}
        </div>
      </div>
    </dialog>
  );
}
