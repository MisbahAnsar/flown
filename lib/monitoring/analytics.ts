import { track } from "@vercel/analytics";
import type { PipelineStep } from "@/lib/pipeline/types";
import { isAnalyticsEnabled } from "./config";
import { sanitizeAnalyticsProperties } from "./scrub";

export type FlowmAnalyticsEvent =
  | "wallet_connected"
  | "github_authenticated"
  | "instruction_submitted"
  | "instruction_succeeded"
  | "instruction_failed"
  | "audit_trail_viewed";

function emit(
  name: FlowmAnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  track(name, sanitizeAnalyticsProperties(properties));
}

export function trackWalletConnected(input?: { isTestnet?: boolean }): void {
  emit("wallet_connected", {
    is_testnet: input?.isTestnet ?? true,
  });
}

export function trackGitHubAuthenticated(): void {
  emit("github_authenticated");
}

export function trackInstructionSubmitted(): void {
  emit("instruction_submitted");
}

export function trackInstructionSucceeded(): void {
  emit("instruction_succeeded");
}

export function trackInstructionFailed(step: PipelineStep): void {
  emit("instruction_failed", { step });
}

export function trackAuditTrailViewed(): void {
  emit("audit_trail_viewed");
}
