import type { GitHubNotification } from "@/lib/github/types";

export const MAX_SUMMARY_NOTIFICATIONS = 20;

export function summarizeGitHubNotifications(
  notifications: GitHubNotification[],
): string {
  if (notifications.length === 0) {
    return "You have no unread GitHub notifications.";
  }

  const totalUnread = notifications.length;
  const limited = notifications.slice(0, MAX_SUMMARY_NOTIFICATIONS);
  const grouped = new Map<string, GitHubNotification[]>();

  for (const notification of limited) {
    const existing = grouped.get(notification.repoName) ?? [];
    existing.push(notification);
    grouped.set(notification.repoName, existing);
  }

  const sections = Array.from(grouped.entries()).map(([repoName, items]) => {
    const lines = items.map(
      (item) =>
        `- ${item.subjectTitle} (${item.reason}) — ${item.url}`,
    );
    return `### ${repoName}\n${lines.join("\n")}`;
  });

  const header =
    totalUnread === 1
      ? "You have 1 unread GitHub notification:"
      : `You have ${totalUnread} unread GitHub notifications:`;

  const footer =
    totalUnread > MAX_SUMMARY_NOTIFICATIONS
      ? `\n\nShowing the first ${MAX_SUMMARY_NOTIFICATIONS} notifications.`
      : "";

  return `${header}\n\n${sections.join("\n\n")}${footer}`;
}
