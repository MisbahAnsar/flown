import { z } from "zod";

export const TaskPlanSchema = z.object({
  instructionId: z.uuid(),
  intent: z.literal("summarize_github_notifications"),
  tool: z.literal("github"),
  outputFormat: z.literal("summary"),
  createdAt: z.iso.datetime(),
});

export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export interface AgentContext {
  userId: string;
  instruction: string;
}
