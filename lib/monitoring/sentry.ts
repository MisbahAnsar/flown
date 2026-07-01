import * as Sentry from "@sentry/nextjs";
import type { PipelineErrorResponse, PipelineStep } from "@/lib/pipeline/types";
import { isSentryEnabled } from "./config";

const ANALYTICS_ONLY_STEPS = new Set<PipelineStep>([
  "interpreter",
  "validation",
  "auth",
  "rate_limit",
]);

export function capturePipelineFailure(
  error: PipelineErrorResponse,
  meta?: { route?: string; status?: number },
): void {
  if (!isSentryEnabled() || ANALYTICS_ONLY_STEPS.has(error.step)) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("pipeline_step", error.step);
    scope.setTag("route", meta?.route ?? "unknown");

    if (meta?.status !== undefined) {
      scope.setExtra("http_status", meta.status);
    }

    scope.setExtra("error_message", error.error);
    Sentry.captureMessage(`Pipeline failed: ${error.step}`, "error");
  });
}

export function captureMonitoringException(
  error: unknown,
  meta?: Record<string, string>,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(meta ?? {})) {
      scope.setTag(key, value);
    }
    Sentry.captureException(error);
  });
}
