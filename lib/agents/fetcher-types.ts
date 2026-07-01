import type { GitHubClientDeps, GitHubNotification } from "@/lib/github/types";
import type { GitHubRepoDetails } from "@/lib/github/repo-details";

export interface FetcherDeps {
  github?: GitHubClientDeps;
}

export type NotificationFetchResult = {
  instructionId: string;
  source: "github";
  intent: "summarize_github_notifications";
  data: GitHubNotification[];
};

export type RepoFetchResult = {
  instructionId: string;
  source: "github";
  intent: "summarize_github_repo";
  data: GitHubRepoDetails;
};

export type FetchResult = NotificationFetchResult | RepoFetchResult;

export type FetcherError = {
  code: "github_error" | "unsupported_intent";
  message: string;
  retryAfterSeconds?: number;
};

export type FetcherResult =
  | { success: true; result: FetchResult }
  | { success: false; error: FetcherError };
