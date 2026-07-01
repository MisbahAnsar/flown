import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isValidWalletAddress } from "@/lib/pipeline/run-instruction";
import { retryLoggingPipeline } from "@/lib/pipeline/retry-logging-pipeline";
import { RetryLoggingRequestSchema } from "@/lib/pipeline/retry-logging";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        step: "auth",
        error: "Sign in with GitHub to retry logging.",
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        step: "validation",
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = RetryLoggingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        step: "validation",
        error: parsed.error.issues[0]?.message ?? "Invalid request body.",
      },
      { status: 400 },
    );
  }

  if (!isValidWalletAddress(parsed.data.walletAddress)) {
    return NextResponse.json(
      {
        step: "validation",
        error: "walletAddress must be a valid Stellar public key.",
      },
      { status: 400 },
    );
  }

  const result = await retryLoggingPipeline(parsed.data, session.user.id);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
