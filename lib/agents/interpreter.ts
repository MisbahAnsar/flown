import { TaskPlanSchema, type InterpretOptions, type TaskPlan } from "./types";

export const SUPPORTED_INSTRUCTION_EXAMPLE =
  "Summarize my GitHub notifications";

export const SUPPORTED_REPO_EXAMPLE =
  "Summarize my latest repo from its README and description";

export type InterpretResult =
  | { success: true; plan: TaskPlan }
  | { success: false; error: string };

const REPO_FULL_NAME_PATTERN = /\b([a-z0-9_.-]+\/[a-z0-9_.-]+)\b/i;

function extractRepoFromText(text: string): string | null {
  const match = text.match(REPO_FULL_NAME_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  const candidate = match[1].toLowerCase();
  if (candidate.includes("github.com")) {
    return null;
  }

  return match[1];
}

function mentionsLatestRepo(text: string): boolean {
  return (
    /\b(latest|recent|newest|last)\b.*\brepo(sitory)?\b/i.test(text) ||
    /\brepo(sitory)?\b.*\b(latest|recent|newest|last)\b/i.test(text) ||
    /\bmy repo\b/i.test(text)
  );
}

function matchesRepoIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const action =
    /\b(summar(?:y|ize|ise)|detail|describe|explain|tell|overview|about|what is|give me)\b/.test(
      normalized,
    );
  const repoContext =
    /\b(repo(sitory)?|readme|read\s*me|description|@readme\.md)\b/.test(
      normalized,
    );

  return action && repoContext;
}

function matchesNotificationIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const mentionsGitHub = /\bgithub\b/.test(normalized);
  const mentionsNotifications = /\bnotifications?\b/.test(normalized);
  const mentionsSummarize =
    /\bsummar(?:y|ize|ise)\b/.test(normalized) ||
    /\bcheck\b/.test(normalized);

  if (mentionsNotifications) {
    return true;
  }

  return mentionsGitHub && mentionsSummarize && !matchesRepoIntent(text);
}

function resolveRepoFullName(
  text: string,
  selectedRepo?: string | null,
): string | null {
  const explicit = extractRepoFromText(text);
  if (explicit) {
    return explicit;
  }

  if (selectedRepo?.trim()) {
    return selectedRepo.trim();
  }

  if (mentionsLatestRepo(text)) {
    return null;
  }

  return null;
}

function buildNotificationsPlan(): TaskPlan {
  return TaskPlanSchema.parse({
    instructionId: crypto.randomUUID(),
    intent: "summarize_github_notifications",
    tool: "github",
    outputFormat: "summary",
    createdAt: new Date().toISOString(),
  });
}

function buildRepoPlan(repoFullName?: string | null): TaskPlan {
  return TaskPlanSchema.parse({
    instructionId: crypto.randomUUID(),
    intent: "summarize_github_repo",
    tool: "github",
    outputFormat: "summary",
    createdAt: new Date().toISOString(),
    ...(repoFullName ? { repoFullName } : {}),
  });
}

/**
 * Validates natural language input and produces a structured task plan.
 * Pure function: no I/O, no side effects.
 */
export function interpret(
  instructionText: string,
  options: InterpretOptions = {},
): InterpretResult {
  const trimmed = instructionText.trim();

  if (!trimmed) {
    return {
      success: false,
      error:
        "Instruction cannot be empty. Try an example like: " +
        `"${SUPPORTED_INSTRUCTION_EXAMPLE}".`,
    };
  }

  const selectedRepo = options.selectedRepo?.trim() || null;
  const repoFullName = resolveRepoFullName(trimmed, selectedRepo);

  if (matchesRepoIntent(trimmed)) {
    return {
      success: true,
      plan: buildRepoPlan(repoFullName ?? selectedRepo),
    };
  }

  if (matchesNotificationIntent(trimmed)) {
    return {
      success: true,
      plan: buildNotificationsPlan(),
    };
  }

  if (selectedRepo && /\b(summar|detail|describe|explain|tell|about|readme|description)\b/i.test(trimmed)) {
    return {
      success: true,
      plan: buildRepoPlan(selectedRepo),
    };
  }

  if (/\b(summar|detail|describe|explain|tell|about|readme|description|repo)\b/i.test(trimmed)) {
    return {
      success: true,
      plan: buildRepoPlan(repoFullName ?? selectedRepo),
    };
  }

  if (/\bgithub\b/i.test(trimmed) || /\bnotification/i.test(trimmed)) {
    return {
      success: true,
      plan: buildNotificationsPlan(),
    };
  }

  if (selectedRepo) {
    return {
      success: true,
      plan: buildRepoPlan(selectedRepo),
    };
  }

  return {
    success: false,
    error:
      "Could not understand that instruction. Try summarizing GitHub notifications or a repository README, e.g. " +
      `"${SUPPORTED_REPO_EXAMPLE}".`,
  };
}
