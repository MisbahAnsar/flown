"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { submitFeedback } from "@/lib/feedback/client";
import type { FeedbackRating, FeedbackSource } from "@/lib/feedback/types";
import { FEEDBACK_COMMENT_MAX } from "@/lib/feedback/types";
import { trackFeedbackSubmitted } from "@/lib/monitoring/analytics";
import { useToast } from "@/components/ui/toast";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  source: FeedbackSource;
  initialRating?: FeedbackRating;
  title?: string;
}

export function FeedbackModal({
  open,
  onClose,
  source,
  initialRating,
  title = "Send feedback",
}: FeedbackModalProps) {
  const toast = useToast();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState<FeedbackRating | null>(
    initialRating ?? null,
  );
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(initialRating ?? null);
      setComment("");
    }
  }, [open, initialRating]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit() {
    if (!rating || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await submitFeedback({
      rating,
      comment: comment.trim() || undefined,
      source,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    trackFeedbackSubmitted({
      rating,
      source,
      comment: comment.trim() || undefined,
    });
    toast.success("Thanks — your feedback was sent.");
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[min(100%,24rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <form
        method="dialog"
        className="flex flex-col p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close feedback form"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Help us improve flowm. Your message is stored in server logs and a
          summary is sent to analytics — never your GitHub token or wallet keys.
        </p>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Was this useful?
          </legend>
          <div className="mt-2 flex gap-2">
            <RatingButton
              selected={rating === "up"}
              label="Yes, helpful"
              onClick={() => setRating("up")}
            >
              👍
            </RatingButton>
            <RatingButton
              selected={rating === "down"}
              label="Not really"
              onClick={() => setRating("down")}
            >
              👎
            </RatingButton>
          </div>
        </fieldset>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Anything else? (optional)
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={FEEDBACK_COMMENT_MAX}
            rows={3}
            placeholder="What worked well or felt confusing?"
            className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
          />
          <span className="mt-1 block text-right text-xs text-zinc-500 dark:text-zinc-400">
            {comment.length}/{FEEDBACK_COMMENT_MAX}
          </span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!rating || isSubmitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isSubmitting ? "Sending..." : "Send feedback"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function RatingButton({
  selected,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
      }`}
    >
      <span aria-hidden>{children}</span>
      <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
    </button>
  );
}
