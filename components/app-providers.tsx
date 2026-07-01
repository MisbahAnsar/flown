"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuditRefreshProvider } from "@/components/audit/audit-refresh-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { MonitoringShell } from "@/components/monitoring/monitoring-shell";
import { ToastProvider } from "@/components/ui/toast";
import { WalletProvider } from "@/components/wallet/wallet-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <WalletProvider>
          <AuditRefreshProvider>
            <ErrorBoundary>
              <MonitoringShell />
              {children}
            </ErrorBoundary>
          </AuditRefreshProvider>
        </WalletProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
