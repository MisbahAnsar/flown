import {
  GITHUB_NOTIFICATIONS_URL,
  mapGitHubResponseError,
  parseGitHubNotifications,
  type GetUnreadNotificationsResult,
  type GitHubClientDeps,
} from "./types";

export type {
  GetUnreadNotificationsResult,
  GitHubClientError,
  GitHubClientDeps,
  GitHubErrorCode,
  GitHubNotification,
} from "./types";

export {
  GITHUB_NOTIFICATIONS_URL,
  mapGitHubResponseError,
  parseGitHubNotifications,
} from "./types";

/**
 * Fetches unread GitHub notifications for the authenticated user.
 * Read-only: uses GET /notifications and filters to unread items.
 */
export async function getUnreadNotifications(
  accessToken: string,
  deps: GitHubClientDeps = {},
): Promise<GetUnreadNotificationsResult> {
  const fetchFn = deps.fetchFn ?? fetch;

  let response: Response;

  try {
    response = await fetchFn(GITHUB_NOTIFICATIONS_URL, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch {
    return {
      success: false,
      error: {
        code: "network_error",
        message:
          "Could not reach GitHub. Check your network connection and try again.",
      },
    };
  }

  const bodyText = await response.text();

  if (!response.ok) {
    return {
      success: false,
      error: mapGitHubResponseError(response, bodyText),
    };
  }

  let payload: unknown = [];

  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return {
        success: false,
        error: {
          code: "unknown",
          message: "GitHub returned an unreadable notifications response.",
        },
      };
    }
  }

  return {
    success: true,
    notifications: parseGitHubNotifications(payload),
  };
}
