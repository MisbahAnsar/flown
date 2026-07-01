import { z } from "zod";

export const TaskPlanSchema = z.object({
  instructionId: z.uuid(),
  intent: z.enum([
    "summarize_github_notifications",
    "summarize_github_repo",
  ]),
  tool: z.literal("github"),
  outputFormat: z.literal("summary"),
  createdAt: z.iso.datetime(),
  repoFullName: z.string().min(3).optional(),
});

export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export interface AgentContext {
  userId: string;
  instruction: string;
}

export interface InterpretOptions {
  selectedRepo?: string | null;
}
