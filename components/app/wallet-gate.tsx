"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { WalletConnectModal } from "@/components/wallet/wallet-connect-modal";
import { useWallet } from "@/components/wallet/wallet-provider";

export function WalletGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, isLoading } = useWallet();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoading && status !== "connected") {
      setShowModal(true);
    }
    if (status === "connected") {
      setShowModal(false);
    }
  }, [status, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800"
          aria-hidden
        />
        <p className="text-sm text-zinc-600">Checking wallet connection...</p>
      </div>
    );
  }

  if (status !== "connected") {
    return (
      <>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="font-heading text-2xl text-zinc-900">
            Wallet required
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
            Connect Freighter on Stellar testnet to access the flowms workspace.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-6 rounded-full bg-zinc-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-600"
          >
            Connect wallet
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-3 text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
          >
            Back to home
          </button>
        </div>
        <WalletConnectModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            router.push("/");
          }}
          onConnected={() => setShowModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}
