type AgentName = "pipeline" | "interpreter" | "fetcher" | "actor";

export function logPipeline(
  agent: AgentName,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[flowm:${agent}] ${message}${suffix}`);
}
