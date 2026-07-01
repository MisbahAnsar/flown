"use client";

import { useRef, useState } from "react";
import type { GitHubRepoOption } from "@/lib/github/repos-client";
import {
  RoundedMenu,
  RoundedScrollList,
} from "@/components/ui/rounded-menu";

interface RepoSelectorProps {
  repos: GitHubRepoOption[];
  selectedRepo: string | null;
  onSelect: (fullName: string) => void;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function RepoSelector({
  repos,
  selectedRepo,
  onSelect,
  isLoading = false,
  error = null,
  disabled = false,
}: RepoSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const label = selectedRepo ?? "Select repository";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled || isLoading}
        className="inline-flex max-w-[11rem] items-center gap-2 rounded-full border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-600/80 disabled:opacity-50 sm:max-w-[14rem]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{isLoading ? "Loading repos..." : label}</span>
        <span className="shrink-0 text-xs text-zinc-400" aria-hidden>
          ▾
        </span>
      </button>

      <RoundedMenu
        open={open}
        onClose={() => setOpen(false)}
        align="left"
        rootRef={rootRef}
      >
        {error && (
          <p className="px-4 py-2 text-xs text-red-600">{error}</p>
        )}
        {!error && repos.length === 0 && !isLoading && (
          <p className="px-4 py-2 text-xs text-zinc-500">No repositories found.</p>
        )}
        <RoundedScrollList maxRows={4}>
          {repos.map((repo) => (
            <button
              key={repo.fullName}
              type="button"
              role="option"
              aria-selected={selectedRepo === repo.fullName}
              onClick={() => {
                onSelect(repo.fullName);
                setOpen(false);
              }}
              className={`block w-full truncate px-4 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
                selectedRepo === repo.fullName
                  ? "bg-zinc-50 font-medium text-zinc-900"
                  : "text-zinc-700"
              }`}
            >
              {repo.fullName}
            </button>
          ))}
        </RoundedScrollList>
      </RoundedMenu>
    </div>
  );
}
