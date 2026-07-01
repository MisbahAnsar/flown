export interface GitHubNotification {
  repoName: string;
  subjectTitle: string;
  reason: string;
  type: string;
  url: string;
  updatedAt: string;
}

export type GitHubErrorCode =
  | "invalid_token"
  | "rate_limited"
  | "network_error"
  | "unknown";

export interface GitHubClientError {
  code: GitHubErrorCode;
  message: string;
  retryAfterSeconds?: number;
}

export type GetUnreadNotificationsResult =
  | { success: true; notifications: GitHubNotification[] }
  | { success: false; error: GitHubClientError };

interface GitHubApiNotification {
  unread: boolean;
  reason: string;
  updated_at: string;
  repository: {
    full_name: string;
  };
  subject: {
    title: string;
    type: string;
    url: string;
  };
}

export interface GitHubClientDeps {
  fetchFn?: typeof fetch;
}

export const GITHUB_NOTIFICATIONS_URL =
  "https://api.github.com/notifications";

export function parseGitHubNotifications(
  payload: unknown,
): GitHubNotification[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is GitHubApiNotification => {
      return (
        typeof item === "object" &&
        item !== null &&
        "unread" in item &&
        item.unread === true
      );
    })
    .map((item) => ({
      repoName: item.repository.full_name,
      subjectTitle: item.subject.title,
      reason: item.reason,
      type: item.subject.type,
      url: item.subject.url,
      updatedAt: item.updated_at,
    }));
}

export function mapGitHubResponseError(
  response: Response,
  bodyText: string,
): GitHubClientError {
  if (response.status === 401) {
    return {
      code: "invalid_token",
      message:
        "GitHub access token is invalid or expired. Please sign in with GitHub again.",
    };
  }

  const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
  const retryAfterHeader = response.headers.get("retry-after");
  const isRateLimited =
    response.status === 403 &&
    (rateLimitRemaining === "0" ||
      bodyText.toLowerCase().includes("rate limit"));

  if (response.status === 429 || isRateLimited) {
    const retryAfterSeconds = retryAfterHeader
      ? Number.parseInt(retryAfterHeader, 10)
      : undefined;

    return {
      code: "rate_limited",
      message: "GitHub API rate limit reached. Please try again later.",
      retryAfterSeconds: Number.isNaN(retryAfterSeconds)
        ? undefined
        : retryAfterSeconds,
    };
  }

  return {
    code: "unknown",
    message: `GitHub API request failed with status ${response.status}.`,
  };
}
