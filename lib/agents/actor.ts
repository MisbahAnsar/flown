import type { ActionResult, FetchResult, TaskPlan } from "./types";

export async function act(
  plan: TaskPlan,
  fetchResult: FetchResult,
): Promise<ActionResult> {
  throw new Error("Not implemented");
}
