import * as Sentry from "@sentry/nextjs";
import { getSentryClientOptions } from "@/lib/monitoring/sentry-options";

Sentry.init(getSentryClientOptions());
