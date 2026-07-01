import type { GitHubNotification } from "@/lib/github/types";
import { generateGeminiText, getGeminiConfig } from "@/lib/gemini/client";
import type { FetchResult } from "./fetcher-types";
import { summarizeGitHubNotifications } from "./summarize";
import type { TaskPlan } from "./types";
import type { ThinkerDeps, ThinkerResult } from "./thinker-types";

const MAX_NOTIFICATIONS_FOR_PROMPT = 25;

function buildNotificationsPromptPayload(
  notifications: GitHubNotification[],
): string {
  const limited = notifications.slice(0, MAX_NOTIFICATIONS_FOR_PROMPT);

  return JSON.stringify(
    limited.map((item) => ({
      repo: item.repoName,
      title: item.subjectTitle,
      type: item.type,
      reason: item.reason,
      updatedAt: item.updatedAt,
    })),
    null,
    2,
  );
}

function buildSummarizePrompt(
  instructionText: string,
  notifications: GitHubNotification[],
): string {
  const total = notifications.length;

  return [
    "You are the Thinker agent in flowms, a personal agent workspace.",
    "Summarize the user's unread GitHub notifications clearly and concisely.",
    "Group related items by repository when helpful.",
    "Highlight what likely needs action versus FYI items.",
    "Do not invent notifications. Use only the data provided.",
    "Use short markdown sections and bullet points.",
    "",
    `User instruction: ${instructionText}`,
    `Total unread notifications: ${total}`,
    "",
    "Notification data (JSON):",
    buildNotificationsPromptPayload(notifications),
  ].join("\n");
}

async function generateSummary(
  prompt: string,
  deps: ThinkerDeps,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (deps.generateText) {
    try {
      const text = (await deps.generateText(prompt)).trim();
      if (!text) {
        return { ok: false, error: "Thinker returned an empty summary." };
      }
      return { ok: true, text };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Thinker failed to generate a summary.",
      };
    }
  }

  const gemini = await generateGeminiText(prompt);
  if (!gemini.success) {
    return { ok: false, error: gemini.error };
  }

  return { ok: true, text: gemini.text.trim() };
}

/**
 * Thinker agent — processes fetched data into a user-facing summary.
 * Uses Gemini when GEMINI_API_KEY is configured; falls back to a deterministic
 * formatter when it is not (local dev/tests).
 */
export async function think(
  taskPlan: TaskPlan,
  fetchedData: FetchResult,
  instructionText: string,
  deps: ThinkerDeps = {},
): Promise<ThinkerResult> {
  switch (taskPlan.intent) {
    case "summarize_github_notifications": {
      const notifications = fetchedData.data;

      if (!deps.generateText && !getGeminiConfig()) {
        return {
          success: true,
          summary: summarizeGitHubNotifications(notifications),
          usedAi: false,
        };
      }

      const prompt = buildSummarizePrompt(instructionText, notifications);
      const generated = await generateSummary(prompt, deps);

      if (!generated.ok) {
        return {
          success: false,
          error: {
            code: "thinker_failed",
            message: generated.error,
          },
        };
      }

      return {
        success: true,
        summary: generated.text,
        usedAi: true,
      };
    }
    default: {
      const unsupportedIntent: never = taskPlan.intent;
      return {
        success: false,
        error: {
          code: "unsupported_intent",
          message: `Unsupported task intent: ${unsupportedIntent}`,
        },
      };
    }
  }
}

export type { ThinkerDeps, ThinkerResult } from "./thinker-types";
