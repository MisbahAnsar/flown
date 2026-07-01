import { TaskPlanSchema, type InterpretOptions, type TaskPlan } from "./types";

export const SUPPORTED_INSTRUCTION_EXAMPLE =
  "Summarize my GitHub notifications";

export const SUPPORTED_REPO_EXAMPLE =
  "Summarize my latest repo from its README and description";

export type InterpretResult =
  | { success: true; plan: TaskPlan }
  | { success: false; error: string };

const GITHUB_REPO_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-z0-9_.-]+)\/([a-z0-9_.-]+)/i;

const REPO_FULL_NAME_PATTERN = /\b([a-z0-9_.-]+\/[a-z0-9_.-]+)\b/i;

const RESERVED_GITHUB_PATHS = new Set([
  "settings",
  "orgs",
  "organizations",
  "marketplace",
  "explore",
  "topics",
  "collections",
  "events",
  "sponsors",
  "login",
  "join",
  "features",
  "enterprise",
  "pricing",
  "about",
  "security",
  "customer-stories",
  "readme",
  "pulls",
  "issues",
  "notifications",
]);

export function extractRepoFromGitHubUrl(text: string): string | null {
  const match = text.match(GITHUB_REPO_URL_PATTERN);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, "").split(/[?#]/)[0];

  if (!owner || !repo || RESERVED_GITHUB_PATHS.has(owner.toLowerCase())) {
    return null;
  }

  return `${owner}/${repo}`;
}

function extractRepoFromText(text: string): string | null {
  const fromUrl = extractRepoFromGitHubUrl(text);
  if (fromUrl) {
    return fromUrl;
  }

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

function hasGitHubRepoReference(text: string): boolean {
  return (
    GITHUB_REPO_URL_PATTERN.test(text) ||
    REPO_FULL_NAME_PATTERN.test(text) ||
    /\b(repo(sitory)?|readme|read\s*me|description|@readme\.md)\b/i.test(text)
  );
}

function matchesRepoIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const action =
    /\b(summar(?:y|ize|ise)|detail|describe|explain|tell|overview|about|what is|give me|brief)\b/.test(
      normalized,
    );

  return action && hasGitHubRepoReference(text);
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

  if (mentionsLatestRepo(text)) {
    return null;
  }

  if (selectedRepo?.trim()) {
    return selectedRepo.trim();
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
  const urlRepo = extractRepoFromGitHubUrl(trimmed);
  const repoFullName = urlRepo ?? resolveRepoFullName(trimmed, selectedRepo);

  if (urlRepo) {
    return {
      success: true,
      plan: buildRepoPlan(urlRepo),
    };
  }

  if (matchesRepoIntent(trimmed)) {
    return {
      success: true,
      plan: buildRepoPlan(repoFullName),
    };
  }

  if (matchesNotificationIntent(trimmed)) {
    return {
      success: true,
      plan: buildNotificationsPlan(),
    };
  }

  if (
    selectedRepo &&
    /\b(summar|detail|describe|explain|tell|about|readme|description|brief)\b/i.test(
      trimmed,
    )
  ) {
    return {
      success: true,
      plan: buildRepoPlan(selectedRepo),
    };
  }

  if (
    /\b(summar|detail|describe|explain|tell|about|readme|description|repo|brief)\b/i.test(
      trimmed,
    )
  ) {
    return {
      success: true,
      plan: buildRepoPlan(repoFullName),
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
