import type { ErrorEvent } from "@sentry/nextjs";

const SENSITIVE_KEY_PATTERN =
  /(token|secret|password|authorization|cookie|private.?key|instruction.?text|summary|github|wallet|address|access_token|refresh_token|stellar_secret)/i;

const STELLAR_ADDRESS_PATTERN = /^G[A-Z2-7]{55}$/;

const REDACTED = "[redacted]";

export function sanitizeAnalyticsProperties(
  properties?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!properties) {
    return undefined;
  }

  const safe: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }

    if (typeof value === "string" && STELLAR_ADDRESS_PATTERN.test(value)) {
      continue;
    }

    safe[key] = value;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

type ScrubbableEvent = {
  request?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string> | string;
    data?: unknown;
  };
  extra?: Record<string, unknown>;
  breadcrumbs?: Array<{ data?: Record<string, unknown>; message?: string }>;
};

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent | null {
  const scrubbed = scrubEventShape(event as ScrubbableEvent);
  return scrubbed as ErrorEvent;
}

function scrubEventShape<T extends ScrubbableEvent>(event: T): T {
  if (event.request?.headers) {
    for (const key of Object.keys(event.request.headers)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        event.request.headers[key] = REDACTED;
      }
    }
  }

  if (event.request?.cookies) {
    if (typeof event.request.cookies === "string") {
      event.request.cookies = REDACTED;
    } else {
      for (const key of Object.keys(event.request.cookies)) {
        event.request.cookies[key] = REDACTED;
      }
    }
  }

  if (event.extra) {
    event.extra = scrubRecord(event.extra);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      data: crumb.data ? scrubRecord(crumb.data) : crumb.data,
    }));
  }

  return event;
}

function scrubRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      next[key] = REDACTED;
      continue;
    }

    if (typeof value === "string" && STELLAR_ADDRESS_PATTERN.test(value)) {
      next[key] = REDACTED;
      continue;
    }

    next[key] = value;
  }

  return next;
}
