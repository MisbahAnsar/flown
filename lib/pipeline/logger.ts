import { sanitizeAnalyticsProperties } from "@/lib/monitoring/scrub";

type AgentName = "pipeline" | "interpreter" | "fetcher" | "thinker" | "actor";

export function logPipeline(
  agent: AgentName,
  message: string,
  meta?: Record<string, string | number | boolean>,
): void {
  const safeMeta = sanitizeAnalyticsProperties(meta);
  const suffix = safeMeta ? ` ${JSON.stringify(safeMeta)}` : "";
  console.log(`[flowms:${agent}] ${message}${suffix}`);
}
