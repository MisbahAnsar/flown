import { getUnreadNotifications } from "@/lib/github/client";
import type { GitHubClientDeps } from "@/lib/github/types";
import type { TaskPlan } from "./types";
import type { FetcherDeps, FetcherResult } from "./fetcher-types";

/**
 * Fetcher agent — READ-ONLY.
 *
 * This agent only reads external data required by the task plan.
 * It must never write to GitHub, a database, or Stellar.
 * All mutations belong in the Actor agent.
 */
export async function fetch(
  taskPlan: TaskPlan,
  accessToken: string,
  deps: FetcherDeps = {},
): Promise<FetcherResult> {
  const githubDeps: GitHubClientDeps = deps.github ?? {};

  switch (taskPlan.intent) {
    case "summarize_github_notifications": {
      const githubResult = await getUnreadNotifications(
        accessToken,
        githubDeps,
      );

      if (!githubResult.success) {
        return {
          success: false,
          error: {
            code: "github_error",
            message: githubResult.error.message,
            retryAfterSeconds: githubResult.error.retryAfterSeconds,
          },
        };
      }

      return {
        success: true,
        result: {
          instructionId: taskPlan.instructionId,
          source: "github",
          intent: taskPlan.intent,
          data: githubResult.notifications,
        },
      };
    }
    default: {
      const unsupportedIntent: never = taskPlan.intent;
      return {
        success: false,
        error: {
          code: "unsupported_intent",
          message: `Unsupported task intent: ${unsupportedIntent}`,
        },
      };
    }
  }
}

export type { FetcherDeps, FetcherError, FetcherResult, FetchResult } from "./fetcher-types";
