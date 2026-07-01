"use client";

interface SummarySection {
  repoName: string;
  items: Array<{ title: string; reason: string; url: string }>;
}

function parseSummary(summary: string): {
  intro: string;
  sections: SummarySection[];
  footer?: string;
} {
  const parts = summary.split(/\n### /);
  const intro = parts[0]?.trim() ?? summary;

  if (parts.length === 1) {
    return { intro, sections: [] };
  }

  const sections: SummarySection[] = [];
  let footer: string | undefined;

  for (const part of parts.slice(1)) {
    const [repoLine, ...rest] = part.split("\n");
    const repoName = repoLine?.trim() ?? "Unknown repo";
    const body = rest.join("\n").trim();

    if (!body) {
      sections.push({ repoName, items: [] });
      continue;
    }

    const lines = body.split("\n");
    const items: SummarySection["items"] = [];

    for (const line of lines) {
      if (line.startsWith("Showing the first ")) {
        footer = line;
        continue;
      }

      const match = line.match(
        /^- (.+?) \((.+?)\) — (https?:\/\/.+)$/,
      );
      if (match) {
        items.push({
          title: match[1],
          reason: match[2],
          url: match[3],
        });
      }
    }

    sections.push({ repoName, items });
  }

  if (!footer && intro.includes("Showing the first ")) {
    const introLines = intro.split("\n\n");
    footer = introLines.at(-1);
  }

  return { intro, sections, footer };
}

export function SummaryDisplay({ summary }: { summary: string }) {
  const parsed = parseSummary(summary);

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {parsed.intro.split("\n\n")[0]}
      </p>

      {parsed.sections.length > 0 ? (
        <div className="space-y-4">
          {parsed.sections.map((section) => (
            <section key={section.repoName}>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {section.repoName}
              </h3>
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <li
                    key={`${section.repoName}-${item.url}`}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.reason}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
                    >
                      Open on GitHub
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>
      )}

      {parsed.footer && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{parsed.footer}</p>
      )}
    </div>
  );
}
