export interface StellarConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
  secretKey: string;
}

export interface StellarPublicConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
}

export interface OnChainActionLog {
  agentId: string;
  actionType: string;
  tool: string;
  instructionHash: string;
  timestamp: bigint;
  loggedAt: bigint;
}

export interface LogActionParams {
  agentId: string;
  actionType: string;
  tool: string;
  instructionHash: Buffer;
  timestamp: bigint;
}

export type StellarErrorCode =
  | "config"
  | "simulation_failed"
  | "submit_failed"
  | "network_error"
  | "unknown";

export interface StellarClientError {
  code: StellarErrorCode;
  message: string;
}

export type LogActionResult =
  | { success: true; txHash: string; actionId: bigint }
  | { success: false; error: StellarClientError };

export type ReadContractResult<T> =
  | { success: true; data: T }
  | { success: false; error: StellarClientError };

export interface ActionLogContractClient {
  logAction(params: LogActionParams): Promise<LogActionResult>;
  getActionCount(): Promise<ReadContractResult<bigint>>;
  getActions(
    start: bigint,
    limit: number,
  ): Promise<ReadContractResult<OnChainActionLog[]>>;
}

export interface ActionLogContractClientFactory {
  create(): Promise<ActionLogContractClient>;
}
