import { z } from "zod";
import { TaskPlanSchema } from "@/lib/agents/types";

export const RetryLoggingRequestSchema = z.object({
  walletAddress: z.string().trim().min(1),
  retryLogging: z.object({
    instructionId: z.string(),
    summary: z.string(),
    prepared: z.object({
      summary: z.string(),
      instructionHashHex: z.string(),
      timestamp: z.string(),
    }),
    taskPlan: TaskPlanSchema,
  }),
});

export type RetryLoggingRequest = z.infer<typeof RetryLoggingRequestSchema>;
