import type { GitHubClientDeps, GitHubClientError } from "./types";
import { mapGitHubResponseError } from "./types";

export interface GitHubRepoDetails {
  fullName: string;
  description: string | null;
  htmlUrl: string;
  readme: string | null;
  language: string | null;
  stargazersCount: number;
  updatedAt: string;
  defaultBranch: string;
}

export type GetRepositoryDetailsResult =
  | { success: true; repo: GitHubRepoDetails }
  | { success: false; error: GitHubClientError };

const LATEST_REPO_URL =
  "https://api.github.com/user/repos?sort=updated&per_page=1&affiliation=owner,collaborator,organization_member";

function parseRepoPayload(
  payload: unknown,
): Omit<GitHubRepoDetails, "readme"> | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const record = payload as {
    full_name?: string;
    description?: string | null;
    html_url?: string;
    language?: string | null;
    stargazers_count?: number;
    updated_at?: string;
    default_branch?: string;
  };

  if (!record.full_name || !record.html_url) {
    return null;
  }

  return {
    fullName: record.full_name,
    description: record.description ?? null,
    htmlUrl: record.html_url,
    language: record.language ?? null,
    stargazersCount: Number(record.stargazers_count ?? 0),
    updatedAt: record.updated_at ?? new Date().toISOString(),
    defaultBranch: record.default_branch ?? "main",
  };
}

async function fetchReadme(
  accessToken: string,
  fullName: string,
  fetchFn: typeof fetch,
): Promise<string | null> {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    return null;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/readme`;

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.raw",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function getLatestUserRepository(
  accessToken: string,
  deps: GitHubClientDeps = {},
): Promise<GetRepositoryDetailsResult> {
  const fetchFn = deps.fetchFn ?? fetch;

  let response: Response;

  try {
    response = await fetchFn(LATEST_REPO_URL, {
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

  if (!Array.isArray(payload) || payload.length === 0) {
    return {
      success: false,
      error: {
        code: "unknown",
        message: "No repositories found on your GitHub account.",
      },
    };
  }

  const parsed = parseRepoPayload(payload[0]);
  if (!parsed) {
    return {
      success: false,
      error: {
        code: "unknown",
        message: "Could not parse your latest repository from GitHub.",
      },
    };
  }

  const readme = await fetchReadme(accessToken, parsed.fullName, fetchFn);

  return {
    success: true,
    repo: { ...parsed, readme },
  };
}

export async function getRepositoryDetails(
  accessToken: string,
  repoFullName: string,
  deps: GitHubClientDeps = {},
): Promise<GetRepositoryDetailsResult> {
  const fetchFn = deps.fetchFn ?? fetch;
  const [owner, repo] = repoFullName.split("/");

  if (!owner || !repo) {
    return {
      success: false,
      error: {
        code: "unknown",
        message: "Repository must be in owner/name format.",
      },
    };
  }

  const url = `https://api.github.com/repos/${owner}/${repo}`;

  let response: Response;

  try {
    response = await fetchFn(url, {
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

  let payload: unknown = null;

  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return {
        success: false,
        error: {
          code: "unknown",
          message: "GitHub returned an unreadable repository response.",
        },
      };
    }
  }

  const parsed = parseRepoPayload(payload);
  if (!parsed) {
    return {
      success: false,
      error: {
        code: "unknown",
        message: "Could not parse repository details from GitHub.",
      },
    };
  }

  const readme = await fetchReadme(accessToken, parsed.fullName, fetchFn);

  return {
    success: true,
    repo: { ...parsed, readme },
  };
}
