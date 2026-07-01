"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AuditRefreshContextValue {
  refreshToken: number;
  txHashByInstructionHash: Record<string, string>;
  notifyPipelineSuccess: (input: {
    instructionHashHex: string;
    stellarTxHash: string;
  }) => void;
  refreshAuditTrail: () => void;
}

const AuditRefreshContext = createContext<AuditRefreshContextValue | null>(
  null,
);

export function AuditRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [txHashByInstructionHash, setTxHashByInstructionHash] = useState<
    Record<string, string>
  >({});

  const refreshAuditTrail = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const notifyPipelineSuccess = useCallback(
    (input: { instructionHashHex: string; stellarTxHash: string }) => {
      setTxHashByInstructionHash((current) => ({
        ...current,
        [input.instructionHashHex]: input.stellarTxHash,
      }));
      setRefreshToken((value) => value + 1);
    },
    [],
  );

  const value = useMemo(
    () => ({
      refreshToken,
      txHashByInstructionHash,
      notifyPipelineSuccess,
      refreshAuditTrail,
    }),
    [
      refreshToken,
      txHashByInstructionHash,
      notifyPipelineSuccess,
      refreshAuditTrail,
    ],
  );

  return (
    <AuditRefreshContext.Provider value={value}>
      {children}
    </AuditRefreshContext.Provider>
  );
}

export function useAuditRefresh(): AuditRefreshContextValue {
  const context = useContext(AuditRefreshContext);
  if (!context) {
    throw new Error("useAuditRefresh must be used within AuditRefreshProvider");
  }
  return context;
}
