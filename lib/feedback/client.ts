import type { FeedbackRequest } from "./types";

export async function submitFeedback(
  input: FeedbackRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    return {
      ok: false,
      error: data.error ?? "Could not send feedback. Please try again.",
    };
  }

  return { ok: true };
}
