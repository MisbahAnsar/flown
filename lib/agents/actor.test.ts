import { describe, expect, test } from "bun:test";
import { act, retryLogAction } from "./actor";
import type { FetchResult } from "./fetcher-types";
import type { TaskPlan } from "./types";
import type { ActionLogContractClient } from "@/lib/stellar/types";

const taskPlan: TaskPlan = {
  instructionId: "22222222-2222-4222-8222-222222222222",
  intent: "summarize_github_notifications",
  tool: "github",
  outputFormat: "summary",
  createdAt: "2026-06-30T12:00:00.000Z",
};

const fetchedData: FetchResult = {
  instructionId: taskPlan.instructionId,
  source: "github",
  intent: "summarize_github_notifications",
  data: [
    {
      repoName: "flowm/core",
      subjectTitle: "Add actor agent",
      reason: "mention",
      type: "Issue",
      url: "https://api.github.com/repos/flowm/core/issues/9",
      updatedAt: "2026-06-30T12:00:00Z",
    },
    {
      repoName: "flowm/core",
      subjectTitle: "Wire pipeline API",
      reason: "subscribed",
      type: "PullRequest",
      url: "https://api.github.com/repos/flowm/core/pulls/10",
      updatedAt: "2026-06-30T11:00:00Z",
    },
  ],
};

function createMockContractClient(
  logAction: ActionLogContractClient["logAction"],
): ActionLogContractClient {
  return {
    logAction,
    getActionCount: async () => ({ success: true, data: BigInt(0) }),
    getActions: async () => ({ success: true, data: [] }),
  };
}

describe("act", () => {
  test("returns summary and tx hash when Soroban logging succeeds", async () => {
    const result = await act(taskPlan, fetchedData, {
      contractClient: createMockContractClient(async () => ({
        success: true,
        txHash: "stellar-tx-hash-123",
        actionId: BigInt(4),
      })),
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.summary).toContain("2 unread GitHub notifications");
    expect(result.summary).toContain("flowm/core");
    expect(result.summary).toContain("Add actor agent");
    expect(result.txHash).toBe("stellar-tx-hash-123");
  });

  test("returns logging_failed with preserved summary when Soroban logging fails", async () => {
    const result = await act(taskPlan, fetchedData, {
      contractClient: createMockContractClient(async () => ({
        success: false,
        error: {
          code: "submit_failed",
          message: "Simulation failed on testnet",
        },
      })),
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.code).toBe("logging_failed");
    expect(result.error).toContain("Simulation failed");
    expect(result.summary).toContain("2 unread GitHub notifications");
    expect(result.prepared.instructionHashHex).toHaveLength(64);
  });
});

describe("retryLogAction", () => {
  test("retries logging without re-fetching GitHub data", async () => {
    let attempts = 0;

    const failingThenSuccessfulClient = createMockContractClient(async () => {
      attempts += 1;
      if (attempts === 1) {
        return {
          success: false,
          error: {
            code: "submit_failed",
            message: "Temporary Soroban RPC failure",
          },
        };
      }

      return {
        success: true,
        txHash: "stellar-tx-hash-retry-456",
        actionId: BigInt(5),
      };
    });

    const firstAttempt = await act(taskPlan, fetchedData, {
      contractClient: failingThenSuccessfulClient,
    });

    expect(firstAttempt.success).toBe(false);
    if (firstAttempt.success || firstAttempt.code !== "logging_failed") {
      return;
    }

    const retryAttempt = await retryLogAction(
      taskPlan,
      firstAttempt.prepared,
      {
        contractClient: failingThenSuccessfulClient,
      },
    );

    expect(attempts).toBe(2);
    expect(retryAttempt.success).toBe(true);
    if (!retryAttempt.success) {
      return;
    }

    expect(retryAttempt.summary).toBe(firstAttempt.summary);
    expect(retryAttempt.txHash).toBe("stellar-tx-hash-retry-456");
  });
});
