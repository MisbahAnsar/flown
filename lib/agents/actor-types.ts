import type { ActionLogContractClient } from "@/lib/stellar/types";

export interface ActorPreparedLog {
  summary: string;
  instructionHashHex: string;
  timestamp: bigint;
}

export type ActorSuccess = {
  success: true;
  summary: string;
  txHash: string;
};

export type ActorLoggingFailure = {
  success: false;
  code: "logging_failed";
  error: string;
  summary: string;
  prepared: ActorPreparedLog;
};

export type ActorUnsupportedIntent = {
  success: false;
  code: "unsupported_intent";
  error: string;
};

export type ActorResult =
  | ActorSuccess
  | ActorLoggingFailure
  | ActorUnsupportedIntent;

export interface ActorDeps {
  contractClient?: ActionLogContractClient;
}
