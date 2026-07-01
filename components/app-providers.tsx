"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { WalletProvider } from "@/components/wallet/wallet-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WalletProvider>{children}</WalletProvider>
    </SessionProvider>
  );
}
