import { z } from "zod";

export const TaskPlanSchema = z.object({
  intent: z.string(),
  source: z.literal("github"),
  action: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export interface AgentContext {
  userId: string;
  instruction: string;
}

export interface FetchResult {
  source: string;
  data: unknown;
}

export interface ActionResult {
  success: boolean;
  summary: string;
  txHash?: string;
}
