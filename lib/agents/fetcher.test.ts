import { describe, expect, test } from "bun:test";
import { fetch } from "./fetcher";
import type { TaskPlan } from "./types";

const taskPlan: TaskPlan = {
  instructionId: "11111111-1111-4111-8111-111111111111",
  intent: "summarize_github_notifications",
  tool: "github",
  outputFormat: "summary",
  createdAt: "2026-06-30T12:00:00.000Z",
};

const sampleApiPayload = [
  {
    id: "1",
    unread: true,
    reason: "mention",
    updated_at: "2026-06-30T12:00:00Z",
    repository: { full_name: "flowms/core" },
    subject: {
      title: "Add fetcher agent",
      type: "Issue",
      url: "https://api.github.com/repos/flowms/core/issues/7",
    },
  },
];

describe("fetch", () => {
  test("fetches unread GitHub notifications for summarize_github_notifications", async () => {
    const result = await fetch(taskPlan, "ghp_test", {
      github: {
        fetchFn: async () =>
          new Response(JSON.stringify(sampleApiPayload), { status: 200 }),
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.result.instructionId).toBe(taskPlan.instructionId);
    expect(result.result.source).toBe("github");
    expect(result.result.intent).toBe("summarize_github_notifications");
    expect(result.result.data).toHaveLength(1);
    expect(result.result.data[0]?.repoName).toBe("flowms/core");
  });

  test("returns empty data when GitHub has no unread notifications", async () => {
    const result = await fetch(taskPlan, "ghp_test", {
      github: {
        fetchFn: async () => new Response(JSON.stringify([]), { status: 200 }),
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.result.data).toEqual([]);
  });

  test("surfaces expired token errors from the GitHub client", async () => {
    const result = await fetch(taskPlan, "ghp_expired", {
      github: {
        fetchFn: async () => new Response("Bad credentials", { status: 401 }),
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.code).toBe("github_error");
    expect(result.error.message).toContain("sign in with GitHub again");
  });

  test("surfaces rate-limit errors from the GitHub client", async () => {
    const result = await fetch(taskPlan, "ghp_test", {
      github: {
        fetchFn: async () =>
          new Response("rate limit", {
            status: 403,
            headers: { "x-ratelimit-remaining": "0", "retry-after": "120" },
          }),
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.code).toBe("github_error");
    expect(result.error.message).toContain("rate limit");
    expect(result.error.retryAfterSeconds).toBe(120);
  });
});
