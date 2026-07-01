import type { GitHubClientDeps, GitHubClientError } from "./types";
import { mapGitHubResponseError } from "./types";

export interface GitHubRepoSummary {
  fullName: string;
  htmlUrl: string;
  private: boolean;
}

export type GetUserRepositoriesResult =
  | { success: true; repos: GitHubRepoSummary[] }
  | { success: false; error: GitHubClientError };

const GITHUB_REPOS_URL =
  "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member";

export async function getUserRepositories(
  accessToken: string,
  deps: GitHubClientDeps = {},
): Promise<GetUserRepositoriesResult> {
  const fetchFn = deps.fetchFn ?? fetch;

  let response: Response;

  try {
    response = await fetchFn(GITHUB_REPOS_URL, {
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
          message: "GitHub returned an unreadable repositories response.",
        },
      };
    }
  }

  if (!Array.isArray(payload)) {
    return { success: true, repos: [] };
  }

  const repos: GitHubRepoSummary[] = payload
    .filter(
      (item): item is { full_name: string; html_url: string; private: boolean } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { full_name?: string }).full_name === "string" &&
        typeof (item as { html_url?: string }).html_url === "string",
    )
    .map((item) => ({
      fullName: item.full_name,
      htmlUrl: item.html_url,
      private: Boolean(item.private),
    }));

  return { success: true, repos };
}
