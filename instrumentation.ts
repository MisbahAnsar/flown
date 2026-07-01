import * as Sentry from "@sentry/nextjs";
import { getSentryServerOptions } from "@/lib/monitoring/sentry-options";

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init(getSentryServerOptions());
  }
}

export const onRequestError = Sentry.captureRequestError;
