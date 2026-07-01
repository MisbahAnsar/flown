"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuditRefreshProvider } from "@/components/audit/audit-refresh-context";
import { WalletProvider } from "@/components/wallet/wallet-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WalletProvider>
        <AuditRefreshProvider>{children}</AuditRefreshProvider>
      </WalletProvider>
    </SessionProvider>
  );
}
