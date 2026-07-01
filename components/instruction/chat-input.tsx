"use client";

import { SUPPORTED_INSTRUCTION_EXAMPLE } from "@/lib/agents/interpreter";
import type { GitHubRepoOption } from "@/lib/github/repos-client";
import { GitHubConnectInline } from "@/components/instruction/github-connect-inline";
import { RepoSelector } from "@/components/instruction/repo-selector";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  isGitHubConnected: boolean;
  repos: GitHubRepoOption[];
  reposLoading?: boolean;
  reposError?: string | null;
  selectedRepo: string | null;
  onSelectRepo: (fullName: string) => void;
  canRun?: boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

export function buildInstructionText(
  customText: string,
  selectedRepo: string | null,
): string {
  const trimmed = customText.trim();

  if (trimmed) {
    return trimmed;
  }

  if (selectedRepo) {
    return `Summarize ${selectedRepo} from its README and description`;
  }

  return SUPPORTED_INSTRUCTION_EXAMPLE;
}

export function ChatInput({
  value,
  onChange,
  isGitHubConnected,
  repos,
  reposLoading = false,
  reposError = null,
  selectedRepo,
  onSelectRepo,
  canRun = true,
  isSubmitting = false,
  onSubmit,
}: ChatInputProps) {
  const inputLocked = !canRun || isSubmitting;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl bg-zinc-800 shadow-lg shadow-zinc-700/15 ring-1 ring-zinc-700/40"
    >
      <label htmlFor="chat-input" className="sr-only">
        Instruction
      </label>
      <textarea
        id="chat-input"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={inputLocked}
        placeholder="Summarize my GitHub notifications, or describe what you need..."
        className="w-full resize-none border-0 bg-transparent px-5 pb-2 pt-4 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-1">
        <div className="min-w-0">
          {isGitHubConnected ? (
            <RepoSelector
              repos={repos}
              selectedRepo={selectedRepo}
              onSelect={onSelectRepo}
              isLoading={reposLoading}
              error={reposError}
              disabled={isSubmitting}
            />
          ) : (
            <GitHubConnectInline
              callbackUrl="/app"
              disabled={isSubmitting}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={inputLocked}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
                aria-hidden
              />
              Running
            </>
          ) : (
            <>
              Run
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
