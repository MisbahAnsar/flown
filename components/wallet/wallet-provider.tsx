"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAddress,
  getNetwork,
  isAllowed,
  isConnected,
  requestAccess,
} from "@stellar/freighter-api";
import { TESTNET_PASSPHRASE } from "@/lib/stellar/constants";

const STORAGE_DISCONNECTED = "flowm_wallet_manual_disconnect";

export type WalletStatus = "idle" | "connected" | "disconnected";

export type WalletErrorCode =
  | "not_installed"
  | "rejected"
  | "locked"
  | "unknown";

interface WalletContextValue {
  status: WalletStatus;
  publicKey: string | null;
  networkName: string | null;
  isTestnet: boolean | null;
  isLoading: boolean;
  error: string | null;
  errorCode: WalletErrorCode | null;
  connect: () => Promise<{ ok: true; isTestnet: boolean } | { ok: false }>;
  disconnect: () => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function mapFreighterError(error: { message?: string; code?: string }): {
  code: WalletErrorCode;
  message: string;
} {
  const message = error.message ?? "Something went wrong with Freighter.";
  const lower = message.toLowerCase();

  if (lower.includes("denied") || lower.includes("reject")) {
    return { code: "rejected", message: "Connection was rejected." };
  }

  if (lower.includes("locked") || lower.includes("unlock")) {
    return { code: "locked", message: "Unlock Freighter to continue." };
  }

  return { code: "unknown", message };
}

async function readWalletSession(): Promise<{
  publicKey: string;
  networkName: string;
  isTestnet: boolean;
} | null> {
  const installed = await isConnected();
  if (!installed.isConnected || installed.error) {
    return null;
  }

  const allowed = await isAllowed();
  if (!allowed.isAllowed || allowed.error) {
    return null;
  }

  const [addressResult, networkResult] = await Promise.all([
    getAddress(),
    getNetwork(),
  ]);

  if (addressResult.error || !addressResult.address) {
    if (addressResult.error) {
      throw addressResult.error;
    }
    return null;
  }

  if (networkResult.error) {
    throw networkResult.error;
  }

  return {
    publicKey: addressResult.address,
    networkName: networkResult.network,
    isTestnet: networkResult.networkPassphrase === TESTNET_PASSPHRASE,
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<WalletErrorCode | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setNetworkName(null);
    setIsTestnet(null);
    setStatus("disconnected");
    clearError();
    localStorage.setItem(STORAGE_DISCONNECTED, "true");
  }, [clearError]);

  const connect = useCallback(async (): Promise<
    { ok: true; isTestnet: boolean } | { ok: false }
  > => {
    setIsLoading(true);
    clearError();

    try {
      const installed = await isConnected();
      if (!installed.isConnected) {
        setErrorCode("not_installed");
        setError("Freighter is not installed.");
        setStatus("disconnected");
        return { ok: false };
      }

      const access = await requestAccess();
      if (access.error || !access.address) {
        const mapped = access.error
          ? mapFreighterError(access.error)
          : { code: "unknown" as const, message: "Could not read wallet address." };
        setErrorCode(mapped.code);
        setError(mapped.message);
        setStatus("disconnected");
        return { ok: false };
      }

      const network = await getNetwork();
      if (network.error) {
        const mapped = mapFreighterError(network.error);
        setErrorCode(mapped.code);
        setError(mapped.message);
        setStatus("disconnected");
        return { ok: false };
      }

      const onTestnet = network.networkPassphrase === TESTNET_PASSPHRASE;

      setPublicKey(access.address);
      setNetworkName(network.network);
      setIsTestnet(onTestnet);
      setStatus("connected");
      localStorage.removeItem(STORAGE_DISCONNECTED);
      return { ok: true, isTestnet: onTestnet };
    } catch (err) {
      const mapped = mapFreighterError(
        err instanceof Error ? { message: err.message } : {},
      );
      setErrorCode(mapped.code);
      setError(mapped.message);
      setStatus("disconnected");
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      setIsLoading(true);
      clearError();

      try {
        if (localStorage.getItem(STORAGE_DISCONNECTED) === "true") {
          setStatus("disconnected");
          return;
        }

        const session = await readWalletSession();
        if (cancelled) {
          return;
        }

        if (!session) {
          setStatus("disconnected");
          return;
        }

        setPublicKey(session.publicKey);
        setNetworkName(session.networkName);
        setIsTestnet(session.isTestnet);
        setStatus("connected");
      } catch (err) {
        if (cancelled) {
          return;
        }
        const mapped = mapFreighterError(
          err instanceof Error ? { message: err.message } : {},
        );
        setErrorCode(mapped.code);
        setError(mapped.message);
        setStatus("disconnected");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearError]);

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      publicKey,
      networkName,
      isTestnet,
      isLoading,
      error,
      errorCode,
      connect,
      disconnect,
      clearError,
    }),
    [
      status,
      publicKey,
      networkName,
      isTestnet,
      isLoading,
      error,
      errorCode,
      connect,
      disconnect,
      clearError,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
