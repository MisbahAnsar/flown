"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { submitFeedback } from "@/lib/feedback/client";
import type { FeedbackRating } from "@/lib/feedback/types";
import { FEEDBACK_COMMENT_MAX } from "@/lib/feedback/types";
import { trackFeedbackSubmitted } from "@/lib/monitoring/analytics";
import { useToast } from "@/components/ui/toast";

interface PostSuccessFeedbackProps {
  runId: string;
  onDismiss: (runId: string) => void;
}

export function PostSuccessFeedback({
  runId,
  onDismiss,
}: PostSuccessFeedbackProps) {
  const toast = useToast();
  const { publicKey } = useWallet();
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingRating, setPendingRating] = useState<FeedbackRating | null>(
    null,
  );

  async function sendFeedback(
    rating: FeedbackRating,
    note?: string,
  ): Promise<boolean> {
    setIsSubmitting(true);
    const result = await submitFeedback({
      rating,
      comment: note?.trim() || undefined,
      source: "post_success",
      walletAddress: publicKey,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return false;
    }

    trackFeedbackSubmitted({
      rating,
      source: "post_success",
      comment: note?.trim() || undefined,
    });
    setSubmitted(true);
    toast.success("Thanks for the feedback.");
    return true;
  }

  async function handleRatingClick(rating: FeedbackRating) {
    if (showComment) {
      setPendingRating(rating);
      return;
    }

    await sendFeedback(rating);
  }

  async function handleCommentSubmit() {
    if (!pendingRating && !showComment) {
      return;
    }

    const rating = pendingRating ?? "up";
    await sendFeedback(rating, comment);
  }

  if (submitted) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
        Thanks — we received your feedback.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Was this useful?
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleRatingClick("up")}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            aria-label="Yes, this was useful"
          >
            👍 Yes
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleRatingClick("down")}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            aria-label="No, this was not useful"
          >
            👎 No
          </button>
          <button
            type="button"
            onClick={() => onDismiss(runId)}
            className="rounded-full px-2 py-1.5 text-xs text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Dismiss
          </button>
        </div>
      </div>

      {!showComment ? (
        <button
          type="button"
          onClick={() => {
            setShowComment(true);
            setPendingRating("up");
          }}
          className="mt-2 text-xs font-medium text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
        >
          Add a short note
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingRating("up")}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                pendingRating === "up"
                  ? "border-emerald-400 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => setPendingRating("down")}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                pendingRating === "down"
                  ? "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              👎
            </button>
          </div>
          <label className="block text-sm text-zinc-700 dark:text-zinc-300">
            Optional note
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={FEEDBACK_COMMENT_MAX}
              rows={2}
              placeholder="Tell us more (optional)"
              className="mt-1.5 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            type="button"
            disabled={isSubmitting || !pendingRating}
            onClick={() => void handleCommentSubmit()}
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isSubmitting ? "Sending..." : "Send feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
