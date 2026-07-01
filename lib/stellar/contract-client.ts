import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { Client as SorobanClient } from "@stellar/stellar-sdk/contract";
import type {
  ActionLogContractClient,
  ActionLogContractClientFactory,
  LogActionParams,
  LogActionResult,
  OnChainActionLog,
  ReadContractResult,
  StellarClientError,
  StellarConfig,
} from "./types";

type SorobanActionLogClient = SorobanClient & {
  log_action: (args: {
    agent_id: string;
    action_type: string;
    tool: string;
    instruction_hash: Buffer;
    timestamp: bigint;
  }) => Promise<{
    signAndSend: () => Promise<{
      sendTransactionResponse?: { hash?: string };
      result?: bigint;
    }>;
  }>;
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

async function createSdkClient(
  config: StellarConfig,
): Promise<SorobanActionLogClient> {
  const keypair = Keypair.fromSecret(config.secretKey);

  return (await SorobanClient.from({
    contractId: config.contractId,
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    publicKey: keypair.publicKey(),
    signTransaction: async (xdr) => {
      const transaction = TransactionBuilder.fromXDR(
        xdr,
        config.networkPassphrase,
      );
      transaction.sign(keypair);
      return { signedTxXdr: transaction.toXDR() };
    },
  })) as SorobanActionLogClient;
}

export function createServerSignedContractClient(
  config: StellarConfig,
): ActionLogContractClient {
  let clientPromise: Promise<SorobanActionLogClient> | null = null;

  const getClient = () => {
    if (!clientPromise) {
      clientPromise = createSdkClient(config);
    }
    return clientPromise;
  };

  return {
    async logAction(params: LogActionParams): Promise<LogActionResult> {
      try {
        const client = await getClient();
        const tx = await client.log_action({
          agent_id: params.agentId,
          action_type: params.actionType,
          tool: params.tool,
          instruction_hash: params.instructionHash,
          timestamp: params.timestamp,
        });

        const sent = await tx.signAndSend();
        const txHash = sent.sendTransactionResponse?.hash;

        if (!txHash) {
          return {
            success: false,
            error: {
              code: "submit_failed",
              message: "Soroban transaction submitted without a transaction hash.",
            },
          };
        }

        return {
          success: true,
          txHash,
          actionId: sent.result ?? BigInt(0),
        };
      } catch (error) {
        return {
          success: false,
          error: {
            code: "submit_failed",
            message: toStellarError(error, "Failed to submit log_action").message,
          },
        };
      }
    },

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

export function createContractClientFactory(
  config: StellarConfig | null,
): ActionLogContractClientFactory {
  return {
    async create() {
      if (!config) {
        throw new Error(
          "Stellar config is incomplete. Set STELLAR_NETWORK_PASSPHRASE, STELLAR_RPC_URL, STELLAR_CONTRACT_ID, and STELLAR_SECRET_KEY.",
        );
      }

      return createServerSignedContractClient(config);
    },
  };
}
