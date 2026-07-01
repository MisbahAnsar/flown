"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-black dark:text-zinc-50">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold">flowms is temporarily unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              A critical error stopped the app from loading. Reload to try again.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
