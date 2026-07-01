import type { ActionResult, TaskPlan } from "./types";
import type { FetchResult } from "./fetcher-types";

export async function act(
  plan: TaskPlan,
  fetchResult: FetchResult,
): Promise<ActionResult> {
  throw new Error("Not implemented");
}
