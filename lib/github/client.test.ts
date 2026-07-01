import { describe, expect, test } from "bun:test";
import {
  getUnreadNotifications,
  parseGitHubNotifications,
} from "./client";
import { GITHUB_NOTIFICATIONS_URL } from "./types";

function createMockFetch(
  handler: (url: string) => Promise<Response>,
): typeof fetch {
  return ((url: string) => handler(url)) as typeof fetch;
}

const sampleApiPayload = [
  {
    id: "1",
    unread: true,
    reason: "mention",
    updated_at: "2026-06-30T12:00:00Z",
    repository: { full_name: "stellar/freighter" },
    subject: {
      title: "Fix wallet popup",
      type: "PullRequest",
      url: "https://api.github.com/repos/stellar/freighter/issues/1",
    },
  },
  {
    id: "2",
    unread: false,
    reason: "subscribed",
    updated_at: "2026-06-29T12:00:00Z",
    repository: { full_name: "stellar/js-stellar-sdk" },
    subject: {
      title: "Release v13",
      type: "Release",
      url: "https://api.github.com/repos/stellar/js-stellar-sdk/releases/1",
    },
  },
];

describe("getUnreadNotifications", () => {
  test("returns parsed unread notifications on success", async () => {
    const fetchFn = createMockFetch(async (url) => {
      expect(url).toBe(GITHUB_NOTIFICATIONS_URL);
      return new Response(JSON.stringify(sampleApiPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await getUnreadNotifications("ghp_test", { fetchFn });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toEqual({
      repoName: "stellar/freighter",
      subjectTitle: "Fix wallet popup",
      reason: "mention",
      type: "PullRequest",
      url: "https://api.github.com/repos/stellar/freighter/issues/1",
      updatedAt: "2026-06-30T12:00:00Z",
    });
  });

  test("returns an empty list when GitHub has no unread notifications", async () => {
    const fetchFn = createMockFetch(async () => {
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const result = await getUnreadNotifications("ghp_test", { fetchFn });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.notifications).toEqual([]);
  });

  test("returns invalid_token on 401 responses", async () => {
    const fetchFn = createMockFetch(async () => {
      return new Response("Bad credentials", { status: 401 });
    });

    const result = await getUnreadNotifications("ghp_expired", { fetchFn });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.code).toBe("invalid_token");
    expect(result.error.message).toContain("sign in with GitHub again");
  });

  test("returns rate_limited on 403 rate-limit responses", async () => {
    const fetchFn = createMockFetch(async () => {
      return new Response("API rate limit exceeded", {
        status: 403,
        headers: {
          "x-ratelimit-remaining": "0",
          "retry-after": "60",
        },
      });
    });

    const result = await getUnreadNotifications("ghp_test", { fetchFn });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.code).toBe("rate_limited");
    expect(result.error.retryAfterSeconds).toBe(60);
  });

  test("returns network_error when fetch throws", async () => {
    const fetchFn = createMockFetch(async () => {
      throw new Error("network down");
    });

    const result = await getUnreadNotifications("ghp_test", { fetchFn });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.code).toBe("network_error");
  });
});

describe("parseGitHubNotifications", () => {
  test("filters out read notifications", () => {
    const parsed = parseGitHubNotifications(sampleApiPayload);
    expect(parsed).toHaveLength(1);
  });
});
