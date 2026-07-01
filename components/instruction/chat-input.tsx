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
  variant?: "center" | "bottom";
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
  variant = "bottom",
}: ChatInputProps) {
  const inputLocked = !canRun || isSubmitting;
  const isCompact = variant === "bottom";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100"
    >
      <label htmlFor="chat-input" className="sr-only">
        Instruction
      </label>
      <textarea
        id="chat-input"
        rows={isCompact ? 1 : 3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={inputLocked}
        placeholder="Summarize my GitHub notifications, or describe what you need..."
        className={`w-full resize-none border-0 bg-transparent text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 ${
          isCompact ? "px-4 pb-1 pt-3" : "px-5 pb-2 pt-4"
        }`}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!inputLocked) {
              onSubmit();
            }
          }
        }}
      />

      <div
        className={`relative z-10 flex items-center justify-between gap-3 ${
          isCompact ? "px-3 pb-2.5 pt-0.5" : "px-4 pb-3 pt-1"
        }`}
      >
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
            <GitHubConnectInline callbackUrl="/app" disabled={isSubmitting} />
          )}
        </div>

        <button
          type="submit"
          disabled={inputLocked}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-white"
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
