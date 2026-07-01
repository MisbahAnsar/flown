import { describe, expect, test, beforeEach } from "bun:test";
import type { ActionLogContractClient } from "@/lib/stellar/types";
import { resetRateLimitForTests } from "@/lib/pipeline/rate-limit";
import { runInstructionPipeline } from "@/lib/pipeline/run-instruction";

const context = {
  instructionText: "Summarize my GitHub notifications",
  walletAddress: "GC6PYSBZWG5IYY3JBKWJRUK2R5R2QKKXFMJSQ47RPH5Y6HL3BCGSK6DS",
  userId: "user-123",
  githubAccessToken: "ghp_test_token",
};

const sampleNotification = {
  id: "1",
  unread: true,
  reason: "mention",
  updated_at: "2026-06-30T12:00:00Z",
  repository: { full_name: "flowms/core" },
  subject: {
    title: "Pipeline wiring",
    type: "Issue",
    url: "https://api.github.com/repos/flowms/core/issues/11",
  },
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

describe("runInstructionPipeline", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  test("runs interpret → fetch → act successfully with mocked dependencies", async () => {
    const result = await runInstructionPipeline(context, {
      fetcher: {
        github: {
          fetchFn: async () =>
            new Response(JSON.stringify([sampleNotification]), { status: 200 }),
        },
      },
      contractClient: createMockContractClient(async () => ({
        success: true,
        txHash: "pipeline-tx-hash-789",
        actionId: BigInt(1),
      })),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.instructionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.data.summary).toContain("Pipeline wiring");
    expect(result.data.stellarTxHash).toBe("pipeline-tx-hash-789");
  });

  test("returns interpreter step error for unsupported instructions", async () => {
    const result = await runInstructionPipeline(
      {
        ...context,
        instructionText: "Email my team on Slack",
      },
      {
        fetcher: {
          github: {
            fetchFn: async () => new Response("[]", { status: 200 }),
          },
        },
        contractClient: createMockContractClient(async () => ({
          success: true,
          txHash: "unused",
          actionId: BigInt(0),
        })),
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.status).toBe(400);
    expect(result.error.step).toBe("interpreter");
    expect(result.error.error).toContain("Could not understand");
  });

  test("returns fetcher step error for expired GitHub tokens", async () => {
    const result = await runInstructionPipeline(context, {
      fetcher: {
        github: {
          fetchFn: async () =>
            new Response("Bad credentials", { status: 401 }),
        },
      },
      contractClient: createMockContractClient(async () => ({
        success: true,
        txHash: "unused",
        actionId: BigInt(0),
      })),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.status).toBe(401);
    expect(result.error.step).toBe("fetcher");
    expect(result.error.error).toContain("sign in with GitHub again");
  });

  test("returns actor step error with retryLogging when Stellar logging fails", async () => {
    const result = await runInstructionPipeline(context, {
      fetcher: {
        github: {
          fetchFn: async () =>
            new Response(JSON.stringify([sampleNotification]), { status: 200 }),
        },
      },
      contractClient: createMockContractClient(async () => ({
        success: false,
        error: {
          code: "submit_failed",
          message: "Soroban RPC unavailable",
        },
      })),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.status).toBe(502);
    expect(result.error.step).toBe("actor");
    expect(result.error.error).toContain("Soroban RPC unavailable");
    expect(result.error.retryLogging?.summary).toContain("Pipeline wiring");
    expect(result.error.retryLogging?.prepared.instructionHashHex).toHaveLength(64);
    expect(result.error.retryLogging?.taskPlan.intent).toBe(
      "summarize_github_notifications",
    );
  });

  test("runs repo summary pipeline for README instructions", async () => {
    const result = await runInstructionPipeline(
      {
        ...context,
        instructionText:
          "summarize my latest repo and give me details from README and description",
      },
      {
        fetcher: {
          github: {
            fetchFn: async (url) => {
              if (String(url).includes("user/repos")) {
                return new Response(
                  JSON.stringify([
                    {
                      full_name: "flowms/core",
                      description: "Agent workspace",
                      html_url: "https://github.com/flowms/core",
                      language: "TypeScript",
                      stargazers_count: 4,
                      updated_at: "2026-06-30T12:00:00Z",
                      default_branch: "main",
                    },
                  ]),
                  { status: 200 },
                );
              }
              if (String(url).includes("/readme")) {
                return new Response("# flowms\n\nOn-chain agent logs.", {
                  status: 200,
                });
              }
              return new Response("[]", { status: 200 });
            },
          },
        },
        contractClient: createMockContractClient(async () => ({
          success: true,
          txHash: "repo-pipeline-tx",
          actionId: BigInt(2),
        })),
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.summary).toContain("flowms/core");
    expect(result.data.stellarTxHash).toBe("repo-pipeline-tx");
  });
});
