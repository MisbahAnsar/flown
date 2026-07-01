import { z } from "zod";

export const RunInstructionRequestSchema = z.object({
  instructionText: z.string().trim().min(1).max(500),
  walletAddress: z.string().trim().min(1),
  selectedRepo: z.string().trim().min(3).optional().nullable(),
});

export type PipelineStep =
  | "auth"
  | "validation"
  | "rate_limit"
  | "interpreter"
  | "fetcher"
  | "thinker"
  | "actor";

export type PipelineErrorResponse = {
  step: PipelineStep;
  error: string;
  retryAfterSeconds?: number;
  retryLogging?: {
    instructionId: string;
    summary: string;
    prepared: {
      summary: string;
      instructionHashHex: string;
      timestamp: string;
    };
    taskPlan: {
      instructionId: string;
      intent: "summarize_github_notifications" | "summarize_github_repo";
      tool: "github";
      outputFormat: "summary";
      createdAt: string;
      repoFullName?: string;
    };
  };
};

export type PipelineSuccessResponse = {
  instructionId: string;
  instructionHashHex: string;
  summary: string;
  stellarTxHash: string;
};

export type PipelineContext = {
  instructionText: string;
  walletAddress: string;
  userId: string;
  githubAccessToken: string;
  selectedRepo?: string | null;
};
