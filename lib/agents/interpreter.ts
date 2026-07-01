import { TaskPlanSchema, type TaskPlan } from "./types";

export const SUPPORTED_INSTRUCTION_EXAMPLE =
  "Summarize my GitHub notifications";

export type InterpretResult =
  | { success: true; plan: TaskPlan }
  | { success: false; error: string };

function matchesSummarizeGitHubNotificationsIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const mentionsGitHub = /\bgithub\b/.test(normalized);
  const mentionsIntent =
    /\bnotifications?\b/.test(normalized) ||
    /\bsummar(?:y|ize|ise)\b/.test(normalized) ||
    /\bcheck\b/.test(normalized);

  return mentionsGitHub && mentionsIntent;
}

function buildTaskPlan(): TaskPlan {
  const plan = {
    instructionId: crypto.randomUUID(),
    intent: "summarize_github_notifications" as const,
    tool: "github" as const,
    outputFormat: "summary" as const,
    createdAt: new Date().toISOString(),
  };

  return TaskPlanSchema.parse(plan);
}

/**
 * Validates natural language input and produces a structured task plan.
 * Pure function: no I/O, no side effects.
 */
export function interpret(instructionText: string): InterpretResult {
  const trimmed = instructionText.trim();

  if (!trimmed) {
    return {
      success: false,
      error:
        "Instruction cannot be empty. Try an example like: " +
        `"${SUPPORTED_INSTRUCTION_EXAMPLE}".`,
    };
  }

  if (!matchesSummarizeGitHubNotificationsIntent(trimmed)) {
    return {
      success: false,
      error:
        "Only one instruction type is supported right now: summarizing GitHub notifications. " +
        `Try something like "${SUPPORTED_INSTRUCTION_EXAMPLE}".`,
    };
  }

  return {
    success: true,
    plan: buildTaskPlan(),
  };
}
