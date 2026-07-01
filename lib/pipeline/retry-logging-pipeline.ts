import { retryLogAction } from "@/lib/agents/actor";
import {
  createServerSignedContractClient,
  getStellarConfig,
} from "@/lib/stellar/client";
import type { ActionLogContractClient } from "@/lib/stellar/types";
import { logPipeline } from "./logger";
import type { PipelineDeps, PipelineResult } from "./run-instruction";
import type { RetryLoggingRequest } from "./retry-logging";

async function resolveContractClient(
  deps: PipelineDeps,
): Promise<ActionLogContractClient | null> {
  if (deps.contractClient) {
    return deps.contractClient;
  }

  const config = getStellarConfig();
  if (!config) {
    return null;
  }

  return createServerSignedContractClient(config);
}

export async function retryLoggingPipeline(
  request: RetryLoggingRequest,
  userId: string,
  deps: PipelineDeps = {},
): Promise<PipelineResult> {
  const { retryLogging } = request;

  logPipeline("pipeline", "retry logging started", {
    userId,
    instructionId: retryLogging.instructionId,
  });

  const contractClient = await resolveContractClient(deps);
  const result = await retryLogAction(
    retryLogging.taskPlan,
    {
      summary: retryLogging.prepared.summary,
      instructionHashHex: retryLogging.prepared.instructionHashHex,
      timestamp: BigInt(retryLogging.prepared.timestamp),
    },
    {
      ...deps.actor,
      contractClient: deps.actor?.contractClient ?? contractClient ?? undefined,
    },
  );

  if (!result.success) {
    logPipeline("actor", "retry logging failed", {
      userId,
      instructionId: retryLogging.instructionId,
      error: result.error,
    });

    return {
      ok: false,
      status: 502,
      error: {
        step: "actor",
        error: result.error,
        retryLogging: {
          instructionId: retryLogging.instructionId,
          summary: result.summary,
          prepared: {
            summary: retryLogging.prepared.summary,
            instructionHashHex: retryLogging.prepared.instructionHashHex,
            timestamp: retryLogging.prepared.timestamp,
          },
          taskPlan: retryLogging.taskPlan,
        },
      },
    };
  }

  logPipeline("actor", "retry logging succeeded", {
    userId,
    instructionId: retryLogging.instructionId,
    txHash: result.txHash,
  });

  return {
    ok: true,
    data: {
      instructionId: retryLogging.instructionId,
      summary: result.summary,
      stellarTxHash: result.txHash,
    },
  };
}
