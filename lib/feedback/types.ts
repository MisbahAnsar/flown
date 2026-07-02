import { z } from "zod";

export const FeedbackRatingSchema = z.enum(["up", "down"]);

export const FeedbackSourceSchema = z.enum(["post_success", "modal"]);

export const FeedbackRequestSchema = z.object({
  rating: FeedbackRatingSchema,
  comment: z.string().trim().max(500).optional(),
  source: FeedbackSourceSchema,
  walletAddress: z.string().trim().min(1).max(128).optional().nullable(),
});

export type FeedbackRating = z.infer<typeof FeedbackRatingSchema>;
export type FeedbackSource = z.infer<typeof FeedbackSourceSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

export const FEEDBACK_COMMENT_MAX = 500;
export const FEEDBACK_ANALYTICS_COMMENT_MAX = 200;
