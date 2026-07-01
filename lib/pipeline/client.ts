import type {
  PipelineErrorResponse,
  PipelineSuccessResponse,
} from "@/lib/pipeline/types";

export type PipelineApiResult =
  | { ok: true; data: PipelineSuccessResponse }
  | { ok: false; status: number; error: PipelineErrorResponse };

export async function postRunInstruction(input: {
  instructionText: string;
  walletAddress: string;
}): Promise<PipelineApiResult> {
  const response = await fetch("/api/run-instruction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as
    | PipelineSuccessResponse
    | PipelineErrorResponse;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data as PipelineErrorResponse,
    };
  }

  return { ok: true, data: data as PipelineSuccessResponse };
}

export async function postRetryLogging(input: {
  walletAddress: string;
  retryLogging: NonNullable<PipelineErrorResponse["retryLogging"]>;
}): Promise<PipelineApiResult> {
  const response = await fetch("/api/retry-logging", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as
    | PipelineSuccessResponse
    | PipelineErrorResponse;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data as PipelineErrorResponse,
    };
  }

  return { ok: true, data: data as PipelineSuccessResponse };
}

export function stellarExpertTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
