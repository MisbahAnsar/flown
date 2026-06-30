import type { FetchResult, TaskPlan } from "./types";

export async function fetchData(
  plan: TaskPlan,
  accessToken: string,
): Promise<FetchResult> {
  throw new Error("Not implemented");
}
