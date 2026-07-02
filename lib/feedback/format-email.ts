export interface FeedbackEmailInput {
  rating: "up" | "down";
  comment: string | null;
  source: string;
  walletAddress?: string | null;
}

function formatSourceLabel(source: string): string {
  if (source === "post_success") {
    return "After instruction run";
  }
  if (source === "modal") {
    return "Feedback form";
  }
  return source;
}

/** Only the user's comment — EmailJS template handles the rest. */
export function buildFeedbackMessage(comment: string | null): string {
  return comment?.trim() || "(no comment)";
}

export function buildFeedbackTemplateParams(input: FeedbackEmailInput) {
  return {
    name: "flowms user",
    email: "noreply@flowms.app",
    message: buildFeedbackMessage(input.comment),
    rating_label: input.rating === "up" ? "Helpful" : "Not helpful",
    source: formatSourceLabel(input.source),
    wallet_address: input.walletAddress?.trim() || "Not provided",
    submitted_at: new Date().toISOString(),
  };
}
