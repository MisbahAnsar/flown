import { NextResponse } from "next/server";
import { sendFeedbackEmail, isEmailJsConfigured } from "@/lib/feedback/emailjs";
import { FeedbackRequestSchema } from "@/lib/feedback/types";

/**
 * Sends feedback via EmailJS and logs a structured copy in runtime logs.
 *
 * EmailJS setup:
 * 1. Create a template with variables: {{name}} {{email}} {{message}}
 *    plus optional {{rating}} {{rating_label}} {{comment}} {{source}}
 *    {{submitted_at}} {{wallet_address}} {{title}}
 *    See .env.local.example for a ready-to-paste template body.
 * 2. Enable "Allow EmailJS API for non-browser applications" in EmailJS Account → Security
 * 3. Set EMAILJS_* env vars (see .env.local.example)
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
  const payload = {
    rating,
    source,
    walletAddress: parsed.data.walletAddress ?? null,
    commentLength: comment?.length ?? 0,
    comment: comment ?? null,
    at: new Date().toISOString(),
  };

  if (isEmailJsConfigured()) {
    const sent = await sendFeedbackEmail({
      rating,
      comment: comment ?? null,
      source,
      walletAddress: parsed.data.walletAddress ?? null,
    });

    if (!sent.ok) {
      console.error("[flowms:feedback] EmailJS failed", sent.error);
      return NextResponse.json(
        { error: "Could not send feedback email. Please try again later." },
        { status: 502 },
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[flowms:feedback] EmailJS is not configured in production");
    return NextResponse.json(
      { error: "Feedback delivery is not configured." },
      { status: 503 },
    );
  } else {
    console.warn(
      "[flowms:feedback] EmailJS not configured — logging locally only",
    );
  }

  console.info("[flowms:feedback]", JSON.stringify(payload));

  return NextResponse.json({ ok: true }, { status: 201 });
}
