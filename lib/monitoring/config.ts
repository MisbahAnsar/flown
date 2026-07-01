/** Vercel Analytics: on in production; opt in locally with NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true */
export function isAnalyticsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "false") {
    return false;
  }

  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "true"
  );
}

export function isSentryEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function getMonitoringEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}
