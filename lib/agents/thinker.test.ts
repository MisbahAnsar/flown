import { describe, expect, test } from "bun:test";
import { think } from "./thinker";
import type { FetchResult } from "./fetcher-types";
import type { TaskPlan } from "./types";

const taskPlan: TaskPlan = {
  instructionId: "33333333-3333-4333-8333-333333333333",
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
      repoName: "flowms/core",
      subjectTitle: "Add thinker agent",
      reason: "mention",
      type: "Issue",
      url: "https://api.github.com/repos/flowms/core/issues/12",
      updatedAt: "2026-06-30T12:00:00Z",
    },
  ],
};

describe("think", () => {
  test("uses injected generator for AI summaries", async () => {
    const result = await think(
      taskPlan,
      fetchedData,
      "Summarize my GitHub notifications",
      {
        generateText: async () => "Gemini summary: 1 mention in flowms/core.",
      },
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.usedAi).toBe(true);
    expect(result.summary).toContain("Gemini summary");
  });

  test("falls back to deterministic summary without Gemini config", async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await think(
      taskPlan,
      fetchedData,
      "Summarize my GitHub notifications",
    );

    if (previous) {
      process.env.GEMINI_API_KEY = previous;
    }

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.usedAi).toBe(false);
    expect(result.summary).toContain("Add thinker agent");
  });

  test("falls back to deterministic repo summary without Gemini config", async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const repoTaskPlan: TaskPlan = {
      ...taskPlan,
      intent: "summarize_github_repo",
      repoFullName: "flowms/core",
    };

    const repoFetched: FetchResult = {
      instructionId: repoTaskPlan.instructionId,
      source: "github",
      intent: "summarize_github_repo",
      data: {
        fullName: "flowms/core",
        description: "Personal agent workspace",
        htmlUrl: "https://github.com/flowms/core",
        readme: "# flowms\n\nBuild agents on Stellar.",
        language: "TypeScript",
        stargazersCount: 3,
        updatedAt: "2026-06-30T12:00:00Z",
        defaultBranch: "main",
      },
    };

    const result = await think(
      repoTaskPlan,
      repoFetched,
      "Summarize my latest repo from README",
    );

    if (previous) {
      process.env.GEMINI_API_KEY = previous;
    }

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.usedAi).toBe(false);
    expect(result.summary).toContain("flowms/core");
    expect(result.summary).toContain("Personal agent workspace");
  });
});
