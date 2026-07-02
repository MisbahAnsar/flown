export type GeminiGenerateResult =
  | { success: true; text: string }
  | { success: false; error: string };

const DEFAULT_MODEL = "gemini-2.0-flash";

export function getGeminiConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
  };
}

export async function generateGeminiText(
  prompt: string,
): Promise<GeminiGenerateResult> {
  const config = getGeminiConfig();
  if (!config) {
    return {
      success: false,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
        },
      }),
    });
  } catch {
    return {
      success: false,
      error: "Could not reach Gemini. Check your network connection.",
    };
  }

  const bodyText = await response.text();
  let payload: unknown = null;

  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return {
        success: false,
        error: "Gemini returned an unreadable response.",
      };
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { message?: string } }).error?.message ===
        "string"
        ? (payload as { error: { message: string } }).error.message
        : `Gemini request failed (${response.status}).`;

    return { success: false, error: message };
  }

  const text = extractGeminiText(payload);
  if (!text) {
    return {
      success: false,
      error: "Gemini returned an empty summary.",
    };
  }

  return { success: true, text };
}

function extractGeminiText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const first = candidates[0];
  if (typeof first !== "object" || first === null) {
    return null;
  }

  const parts = (first as { content?: { parts?: unknown[] } }).content?.parts;
  if (!Array.isArray(parts)) {
    return null;
  }

  const text = parts
    .map((part) =>
      typeof part === "object" &&
      part !== null &&
      "text" in part &&
      typeof (part as { text?: string }).text === "string"
        ? (part as { text: string }).text
        : "",
    )
    .join("")
    .trim();

  return text || null;
}
