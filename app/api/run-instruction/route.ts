import { NextResponse } from "next/server";
import { getGitHubAccessToken, getSession } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/pipeline/rate-limit";
import {
  isValidWalletAddress,
  runInstructionPipeline,
} from "@/lib/pipeline/run-instruction";
import { RunInstructionRequestSchema } from "@/lib/pipeline/types";

/*
 * Manual integration test (local dev):
 *
 * 1. Set GITHUB_ID, GITHUB_SECRET, NEXTAUTH_SECRET, STELLAR_SECRET_KEY in .env.local
 * 2. bun dev
 * 3. Sign in with GitHub and connect Freighter in the header
 * 4. POST /api/run-instruction with cookies + JSON body:
 *    {
 *      "instructionText": "Summarize my GitHub notifications",
 *      "walletAddress": "<your-freighter-public-key>"
 *    }
 * 5. Expect 200 { instructionId, summary, stellarTxHash }
 *
 * Automated integration tests with mocked GitHub + Stellar:
 *   bun test lib/pipeline/run-instruction.test.ts
 */

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        step: "auth",
        error: "Sign in with GitHub to run an instruction.",
      },
      { status: 401 },
    );
  }

  const githubAccessToken = await getGitHubAccessToken();
  if (!githubAccessToken) {
    return NextResponse.json(
      {
        step: "auth",
        error:
          "GitHub access token is missing or expired. Sign in with GitHub again.",
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

  const parsed = RunInstructionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        step: "validation",
        error: parsed.error.issues[0]?.message ?? "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const { instructionText, walletAddress } = parsed.data;

  if (!isValidWalletAddress(walletAddress)) {
    return NextResponse.json(
      {
        step: "validation",
        error: "walletAddress must be a valid Stellar public key.",
      },
      { status: 400 },
    );
  }

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        step: "rate_limit",
        error: "Please wait before running another instruction.",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const result = await runInstructionPipeline({
    instructionText,
    walletAddress,
    userId: session.user.id,
    githubAccessToken,
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
