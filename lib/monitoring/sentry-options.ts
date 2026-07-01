import type { BrowserOptions, NodeOptions } from "@sentry/nextjs";
import { getMonitoringEnvironment, isSentryEnabled } from "./config";
import { scrubSentryEvent } from "./scrub";

const baseOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: isSentryEnabled(),
  environment: getMonitoringEnvironment(),
  tracesSampleRate: 0.05,
  sendDefaultPii: false,
  beforeSend: scrubSentryEvent,
} satisfies Partial<BrowserOptions & NodeOptions>;

export function getSentryClientOptions(): BrowserOptions {
  return {
    ...baseOptions,
  };
}

export function getSentryServerOptions(): NodeOptions {
  return {
    ...baseOptions,
  };
}
