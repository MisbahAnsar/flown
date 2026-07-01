"use client";

import { Analytics } from "@vercel/analytics/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { trackGitHubAuthenticated } from "@/lib/monitoring/analytics";
import { isAnalyticsEnabled } from "@/lib/monitoring/config";

const GITHUB_AUTH_TRACKED_KEY = "flowms_github_auth_tracked";

export function MonitoringShell() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      if (sessionStorage.getItem(GITHUB_AUTH_TRACKED_KEY) !== "1") {
        trackGitHubAuthenticated();
        sessionStorage.setItem(GITHUB_AUTH_TRACKED_KEY, "1");
      }
      return;
    }

    if (status === "unauthenticated") {
      sessionStorage.removeItem(GITHUB_AUTH_TRACKED_KEY);
    }
  }, [status]);

  if (!isAnalyticsEnabled()) {
    return null;
  }

  return <Analytics />;
}
