/**
 * Normalizes assistant output to plain conversational prose.
 */
export function sanitizeSummary(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s—\s/g, ", ")
    .replace(/—/g, ", ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
