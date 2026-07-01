"use client";

import { useEffect, useState } from "react";

export interface GitHubRepoOption {
  fullName: string;
  htmlUrl: string;
  private: boolean;
}

export function useGitHubRepos(enabled: boolean) {
  const [repos, setRepos] = useState<GitHubRepoOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setRepos([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/github/repos");
      const data = (await response.json()) as
        | { repos: GitHubRepoOption[] }
        | { error: string };

      if (cancelled) {
        return;
      }

      setIsLoading(false);

      if (!response.ok) {
        setError("error" in data ? data.error : "Could not load repositories.");
        setRepos([]);
        return;
      }

      setRepos("repos" in data ? data.repos : []);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { repos, isLoading, error };
}
