import { hashInstruction, hashInstructionHex } from "@/lib/stellar/hash";
import type { TaskPlan } from "./types";
import type { FetchResult } from "./fetcher-types";
import { summarizeGitHubNotifications } from "./summarize";
import type {
  ActorDeps,
  ActorLoggingFailure,
  ActorPreparedLog,
  ActorResult,
  ActorSuccess,
} from "./actor-types";

const ACTOR_ID = "actor";
const ACTION_TYPE = "summarize";
const TOOL = "github";

function buildPreparedLog(
  taskPlan: TaskPlan,
  summary: string,
): ActorPreparedLog {
  return {
    summary,
    instructionHashHex: hashInstructionHex(
      taskPlan.instructionId,
      taskPlan.intent,
    ),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  };
}

async function submitLogAction(
  taskPlan: TaskPlan,
  prepared: ActorPreparedLog,
  deps: ActorDeps,
): Promise<ActorSuccess | ActorLoggingFailure> {
  if (!deps.contractClient) {
    return {
      success: false,
      code: "logging_failed",
      error: "Stellar contract client is not configured.",
      summary: prepared.summary,
      prepared,
    };
  }

  const logResult = await deps.contractClient.logAction({
    agentId: ACTOR_ID,
    actionType: ACTION_TYPE,
    tool: TOOL,
    instructionHash: hashInstruction(
      taskPlan.instructionId,
      taskPlan.intent,
    ),
    timestamp: prepared.timestamp,
  });

  if (!logResult.success) {
    return {
      success: false,
      code: "logging_failed",
      error: logResult.error.message,
      summary: prepared.summary,
      prepared,
    };
  }

  return {
    success: true,
    summary: prepared.summary,
    txHash: logResult.txHash,
  };
}

/**
 * Actor agent — WRITE / LOG ONLY.
 *
 * This is the only agent allowed to submit Soroban transactions or persist
 * on-chain audit logs. It must never read from GitHub; that belongs to Fetcher.
 */
export async function act(
  taskPlan: TaskPlan,
  fetchedData: FetchResult,
  deps: ActorDeps = {},
): Promise<ActorResult> {
  switch (taskPlan.intent) {
    case "summarize_github_notifications": {
      const summary = summarizeGitHubNotifications(fetchedData.data);
      const prepared = buildPreparedLog(taskPlan, summary);
      return submitLogAction(taskPlan, prepared, deps);
    }
    default: {
      const unsupportedIntent: never = taskPlan.intent;
      return {
        success: false,
        code: "unsupported_intent",
        error: `Unsupported task intent: ${unsupportedIntent}`,
      };
    }
  }
}

/**
 * Retries only the Soroban logging step using a previously prepared summary.
 * Use this when GitHub data was already fetched and summarized.
 */
export async function retryLogAction(
  taskPlan: TaskPlan,
  prepared: ActorPreparedLog,
  deps: ActorDeps = {},
): Promise<ActorSuccess | ActorLoggingFailure> {
  return submitLogAction(taskPlan, prepared, deps);
}

export type {
  ActorDeps,
  ActorLoggingFailure,
  ActorPreparedLog,
  ActorResult,
  ActorSuccess,
} from "./actor-types";
