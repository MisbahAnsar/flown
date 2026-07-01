import { StrKey } from "@stellar/stellar-sdk";
import { act } from "@/lib/agents/actor";
import { fetch } from "@/lib/agents/fetcher";
import { interpret } from "@/lib/agents/interpreter";
import { think } from "@/lib/agents/thinker";
import type { ActorDeps } from "@/lib/agents/actor-types";
import type { FetcherDeps } from "@/lib/agents/fetcher-types";
import type { ThinkerDeps } from "@/lib/agents/thinker-types";
import {
  createServerSignedContractClient,
  getStellarConfig,
} from "@/lib/stellar/client";
import { hashInstructionHex } from "@/lib/stellar/hash";
import type { ActionLogContractClient } from "@/lib/stellar/types";
import { logPipeline } from "./logger";
import type {
  PipelineContext,
  PipelineErrorResponse,
  PipelineSuccessResponse,
} from "./types";

export interface PipelineDeps {
  fetcher?: FetcherDeps;
  thinker?: ThinkerDeps;
  actor?: ActorDeps;
  contractClient?: ActionLogContractClient;
}

export type PipelineResult =
  | { ok: true; data: PipelineSuccessResponse }
  | { ok: false; status: number; error: PipelineErrorResponse };

export function isValidWalletAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

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

export async function runInstructionPipeline(
  context: PipelineContext,
  deps: PipelineDeps = {},
): Promise<PipelineResult> {
  const { instructionText, walletAddress, userId, githubAccessToken, selectedRepo } =
    context;

  logPipeline("pipeline", "run started", { userId });

  const interpreted = interpret(instructionText, { selectedRepo });
  if (!interpreted.success) {
    logPipeline("interpreter", "failed", { userId, error: interpreted.error });
    return {
      ok: false,
      status: 400,
      error: {
        step: "interpreter",
        error: interpreted.error,
      },
    };
  }

  const taskPlan = interpreted.plan;
  logPipeline("interpreter", "task plan created", {
    userId,
    instructionId: taskPlan.instructionId,
    intent: taskPlan.intent,
  });

  const fetched = await fetch(taskPlan, githubAccessToken, deps.fetcher);
  if (!fetched.success) {
    logPipeline("fetcher", "failed", {
      userId,
      instructionId: taskPlan.instructionId,
      error: fetched.error.message,
    });

    const status =
      fetched.error.message.includes("sign in with GitHub again")
        ? 401
        : fetched.error.message.toLowerCase().includes("rate limit")
          ? 429
          : fetched.error.message.toLowerCase().includes("network")
            ? 503
            : 502;

    return {
      ok: false,
      status,
      error: {
        step: "fetcher",
        error: fetched.error.message,
        retryAfterSeconds: fetched.error.retryAfterSeconds,
      },
    };
  }

  logPipeline(
    "fetcher",
    fetched.result.intent === "summarize_github_repo"
      ? "repository fetched"
      : "notifications fetched",
    {
      userId,
      instructionId: taskPlan.instructionId,
      ...(fetched.result.intent === "summarize_github_repo"
        ? { repo: fetched.result.data.fullName }
        : { count: fetched.result.data.length }),
    },
  );

  const thought = await think(
    taskPlan,
    fetched.result,
    instructionText,
    deps.thinker,
  );

  if (!thought.success) {
    logPipeline("thinker", "failed", {
      userId,
      instructionId: taskPlan.instructionId,
      error: thought.error.message,
    });

    return {
      ok: false,
      status: 502,
      error: {
        step: "thinker",
        error: thought.error.message,
      },
    };
  }

  logPipeline("thinker", "summary generated", {
    userId,
    instructionId: taskPlan.instructionId,
    usedAi: thought.usedAi,
  });

  const contractClient = await resolveContractClient(deps);
  const acted = await act(taskPlan, thought.summary, {
    ...deps.actor,
    contractClient: deps.actor?.contractClient ?? contractClient ?? undefined,
  });

  if (!acted.success) {
    if (acted.code === "logging_failed") {
      logPipeline("actor", "stellar logging failed", {
        userId,
        instructionId: taskPlan.instructionId,
        error: acted.error,
      });

      return {
        ok: false,
        status: 502,
        error: {
          step: "actor",
          error: acted.error,
          retryLogging: {
            instructionId: taskPlan.instructionId,
            summary: acted.summary,
            prepared: {
              summary: acted.prepared.summary,
              instructionHashHex: acted.prepared.instructionHashHex,
              timestamp: acted.prepared.timestamp.toString(),
            },
            taskPlan,
          },
        },
      };
    }

    logPipeline("actor", "failed", {
      userId,
      instructionId: taskPlan.instructionId,
      error: acted.error,
    });

    return {
      ok: false,
      status: 500,
      error: {
        step: "actor",
        error: acted.error,
      },
    };
  }

  logPipeline("actor", "stellar logging succeeded", {
    userId,
    instructionId: taskPlan.instructionId,
    txHash: acted.txHash,
  });

  logPipeline("pipeline", "run completed", {
    userId,
    instructionId: taskPlan.instructionId,
  });

  return {
    ok: true,
    data: {
      instructionId: taskPlan.instructionId,
      instructionHashHex: hashInstructionHex(
        taskPlan.instructionId,
        taskPlan.intent,
      ),
      summary: acted.summary,
      stellarTxHash: acted.txHash,
    },
  };
}
