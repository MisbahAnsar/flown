import type { GitHubClientDeps, GitHubNotification } from "@/lib/github/types";

export interface FetcherDeps {
  github?: GitHubClientDeps;
}

export interface FetchResult {
  instructionId: string;
  source: "github";
  intent: "summarize_github_notifications";
  data: GitHubNotification[];
}

export type FetcherError = {
  code: "github_error" | "unsupported_intent";
  message: string;
  retryAfterSeconds?: number;
};

export type FetcherResult =
  | { success: true; result: FetchResult }
  | { success: false; error: FetcherError };
