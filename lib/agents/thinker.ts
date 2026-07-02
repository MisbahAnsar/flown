import type { GitHubRepoDetails } from "@/lib/github/repo-details";
import { generateGeminiText, getGeminiConfig } from "@/lib/gemini/client";
import { sanitizeSummary } from "./format-summary";
import type { FetchResult } from "./fetcher-types";
import { summarizeGitHubNotifications, summarizeGitHubRepo } from "./summarize";
import type { TaskPlan } from "./types";
import type { ThinkerDeps, ThinkerResult } from "./thinker-types";

const PLAIN_TEXT_RULES = [
  "Write in plain conversational prose only.",
  "Do not use markdown headings (#, ##, ###).",
  "Do not use bold (**), italics, or bullet lists unless absolutely necessary.",
  "Do not use em-dashes. Use commas or short sentences instead.",
  "Keep paragraphs short and easy to read.",
  "Keep the full answer under 100 words. Be concise and always finish your last sentence.",
].join(" ");

const MAX_NOTIFICATIONS_FOR_PROMPT = 25;
const MAX_README_CHARS = 6000;

function buildNotificationsPromptPayload(
  fetched: Extract<FetchResult, { intent: "summarize_github_notifications" }>,
): string {
  const limited = fetched.data.slice(0, MAX_NOTIFICATIONS_FOR_PROMPT);

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

function buildRepoPromptPayload(
  repo: GitHubRepoDetails,
): string {
  return JSON.stringify(
    {
      fullName: repo.fullName,
      description: repo.description,
      language: repo.language,
      stargazersCount: repo.stargazersCount,
      updatedAt: repo.updatedAt,
      htmlUrl: repo.htmlUrl,
      readme:
        repo.readme && repo.readme.length > MAX_README_CHARS
          ? `${repo.readme.slice(0, MAX_README_CHARS)}\n\n[README truncated]`
          : repo.readme,
    },
    null,
    2,
  );
}

function buildPrompt(
  instructionText: string,
  fetched: FetchResult,
): string {
  if (fetched.intent === "summarize_github_repo") {
    return [
      "You are the Thinker agent in flowms, a personal agent workspace.",
      "Summarize the GitHub repository for the user using ONLY the description and README in the JSON below.",
      `The repository you must discuss is exactly: ${fetched.data.fullName}.`,
      "Do not mention or infer details from any other repository.",
      "Explain what the project does, who it is for, and notable details from the README.",
      "Do not invent features or content that is not in the data.",
      PLAIN_TEXT_RULES,
      "",
      `User instruction: ${instructionText}`,
      "",
      "Repository data (JSON):",
      buildRepoPromptPayload(fetched.data),
    ].join("\n");
  }

  return [
    "You are the Thinker agent in flowms, a personal agent workspace.",
    "Summarize the user's unread GitHub notifications clearly and concisely.",
    "Group related items by repository when helpful.",
    "Highlight what likely needs action versus FYI items.",
    "Do not invent notifications. Use only the data provided.",
    PLAIN_TEXT_RULES,
    "",
    `User instruction: ${instructionText}`,
    `Total unread notifications: ${fetched.data.length}`,
    "",
    "Notification data (JSON):",
    buildNotificationsPromptPayload(fetched),
  ].join("\n");
}

function fallbackSummary(fetched: FetchResult): string {
  if (fetched.intent === "summarize_github_repo") {
    return sanitizeSummary(summarizeGitHubRepo(fetched.data));
  }

  return sanitizeSummary(summarizeGitHubNotifications(fetched.data));
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
    case "summarize_github_notifications":
    case "summarize_github_repo": {
      if (!deps.generateText && !getGeminiConfig()) {
        return {
          success: true,
          summary: fallbackSummary(fetchedData),
          usedAi: false,
        };
      }

      const prompt = buildPrompt(instructionText, fetchedData);
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
        summary: sanitizeSummary(generated.text),
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
