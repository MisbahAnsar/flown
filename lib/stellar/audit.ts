import { Client as SorobanClient, NULL_ACCOUNT } from "@stellar/stellar-sdk/contract";
import type {
  ActionLogContractClient,
  OnChainActionLog,
  ReadContractResult,
  StellarClientError,
  StellarPublicConfig,
} from "./types";

type SorobanReadClient = SorobanClient & {
  get_action_count: () => Promise<{ result: bigint }>;
  get_actions: (args: {
    start: bigint;
    limit: number;
  }) => Promise<{
    result: Array<{
      agent_id: string;
      action_type: string;
      tool: string;
      instruction_hash: Buffer;
      timestamp: bigint;
      logged_at: bigint;
    }>;
  }>;
};

function toStellarError(error: unknown, fallback: string): StellarClientError {
  if (error instanceof Error) {
    return {
      code: "unknown",
      message: error.message || fallback,
    };
  }

  return {
    code: "unknown",
    message: fallback,
  };
}

function mapActionLog(entry: {
  agent_id: string;
  action_type: string;
  tool: string;
  instruction_hash: Buffer;
  timestamp: bigint;
  logged_at: bigint;
}): OnChainActionLog {
  return {
    agentId: entry.agent_id,
    actionType: entry.action_type,
    tool: entry.tool,
    instructionHash: entry.instruction_hash.toString("hex"),
    timestamp: entry.timestamp,
    loggedAt: entry.logged_at,
  };
}

async function createReadSdkClient(
  config: StellarPublicConfig,
): Promise<SorobanReadClient> {
  return (await SorobanClient.from({
    contractId: config.contractId,
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    publicKey: NULL_ACCOUNT,
  })) as SorobanReadClient;
}

/** Read-only Soroban client for audit trail queries (no signing required). */
export function createReadOnlyContractClient(
  config: StellarPublicConfig,
): Pick<ActionLogContractClient, "getActionCount" | "getActions"> {
  let clientPromise: Promise<SorobanReadClient> | null = null;

  const getClient = () => {
    if (!clientPromise) {
      clientPromise = createReadSdkClient(config);
    }
    return clientPromise;
  };

  return {
    async getActionCount(): Promise<ReadContractResult<bigint>> {
      try {
        const client = await getClient();
        const response = await client.get_action_count();
        return { success: true, data: response.result };
      } catch (error) {
        return {
          success: false,
          error: toStellarError(error, "Failed to read get_action_count"),
        };
      }
    },

    async getActions(
      start: bigint,
      limit: number,
    ): Promise<ReadContractResult<OnChainActionLog[]>> {
      try {
        const client = await getClient();
        const response = await client.get_actions({ start, limit });
        return {
          success: true,
          data: response.result.map(mapActionLog),
        };
      } catch (error) {
        return {
          success: false,
          error: toStellarError(error, "Failed to read get_actions"),
        };
      }
    },
  };
}

export function formatLedgerTimestamp(seconds: bigint): string {
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString();
}

export function stellarExpertContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

export function stellarExpertTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
