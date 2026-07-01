import { NextResponse } from "next/server";
import { FeedbackRequestSchema } from "@/lib/feedback/types";

/**
 * Persists feedback in Vercel Runtime Logs (structured JSON).
 * View in Vercel → Project → Logs, filter by `[flowms:feedback]`.
 * The client also emits a `feedback_submitted` Vercel Analytics event.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = FeedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid feedback." },
      { status: 400 },
    );
  }

  const { rating, comment, source } = parsed.data;

  console.info(
    "[flowms:feedback]",
    JSON.stringify({
      rating,
      source,
      commentLength: comment?.length ?? 0,
      comment: comment ?? null,
      at: new Date().toISOString(),
    }),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
