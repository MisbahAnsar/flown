"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  postRetryLogging,
  postRunInstruction,
} from "@/lib/pipeline/client";
import type { PipelineErrorResponse } from "@/lib/pipeline/types";
import { useAuditRefresh } from "@/components/audit/audit-refresh-context";
import {
  trackInstructionFailed,
  trackInstructionSubmitted,
  trackInstructionSucceeded,
} from "@/lib/monitoring/analytics";
import { useToast } from "@/components/ui/toast";
import { useWallet } from "@/components/wallet/wallet-provider";
import { PostSuccessFeedback } from "@/components/feedback/post-success-feedback";
import {
  advanceRunningStep,
  applyPipelineError,
  applyPipelineSuccess,
  applyRetryActorSteps,
  startPipelineSteps,
} from "@/components/instruction/activity-feed";
import {
  buildInstructionText,
  ChatInput,
} from "@/components/instruction/chat-input";
import { ConversationThread } from "@/components/instruction/conversation-thread";
import type { InstructionRun } from "@/components/instruction/run-history";
import { useGitHubRepos } from "@/lib/github/repos-client";

function createRunId(): string {
  return crypto.randomUUID();
}

function updateRun(
  runs: InstructionRun[],
  runId: string,
  patch: Partial<InstructionRun>,
): InstructionRun[] {
  return runs.map((run) => (run.id === runId ? { ...run, ...patch } : run));
}

export function InstructionPanel() {
  const toast = useToast();
  const { data: session, status: authStatus } = useSession();
  const { notifyPipelineSuccess } = useAuditRefresh();
  const { publicKey, isLoading: walletLoading } = useWallet();

  const [instruction, setInstruction] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [runs, setRuns] = useState<InstructionRun[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [globalError, setGlobalError] = useState<PipelineErrorResponse | null>(
    null,
  );
  const [dismissedFeedbackRunIds, setDismissedFeedbackRunIds] = useState<
    Set<string>
  >(() => new Set());

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGitHubReady = authStatus === "authenticated" && !!session?.user;
  const isWalletReady = !!publicKey;
  const isReady = isGitHubReady && isWalletReady;
  const isChecking = authStatus === "loading" || walletLoading;
  const showWelcome = runs.length === 0;
  const latestRun = runs[0] ?? null;

  const {
    repos,
    isLoading: reposLoading,
    error: reposError,
  } = useGitHubRepos(isGitHubReady);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearProgressTimer, [clearProgressTimer]);

  const startProgressTimer = useCallback(
    (runId: string) => {
      clearProgressTimer();
      progressTimerRef.current = setInterval(() => {
        setRuns((current) =>
          updateRun(current, runId, {
            steps: advanceRunningStep(
              current.find((run) => run.id === runId)?.steps ??
                startPipelineSteps(),
            ),
          }),
        );
      }, 1200);
    },
    [clearProgressTimer],
  );

  async function handleSubmit() {
    if (!isReady || !publicKey || isSubmitting) {
      return;
    }

    const instructionText = buildInstructionText(instruction, selectedRepo);
    if (!instructionText.trim()) {
      return;
    }

    const runId = createRunId();
    const newRun: InstructionRun = {
      id: runId,
      instructionText,
      createdAt: new Date().toISOString(),
      status: "running",
      steps: startPipelineSteps(),
    };

    setRuns((current) => [newRun, ...current]);
    setInstruction("");
    setGlobalError(null);
    setIsSubmitting(true);
    startProgressTimer(runId);
    trackInstructionSubmitted();

    const result = await postRunInstruction({
      instructionText,
      walletAddress: publicKey,
      selectedRepo,
    });

    clearProgressTimer();
    setIsSubmitting(false);

    if (!result.ok) {
      const error = result.error;
      const failedPipelineStep =
        error.step === "interpreter" ||
        error.step === "fetcher" ||
        error.step === "thinker" ||
        error.step === "actor"
          ? error.step
          : null;

      if (!failedPipelineStep) {
        setGlobalError(error);
        toast.error(error.error);
        trackInstructionFailed(error.step);
        setRuns((current) =>
          updateRun(current, runId, {
            status: "error",
            error,
            steps: newRun.steps.map((step) => ({
              ...step,
              status: "skipped",
            })),
          }),
        );
        return;
      }

      setRuns((current) => {
        const existing = current.find((run) => run.id === runId);
        return updateRun(current, runId, {
          status: "error",
          error,
          steps: applyPipelineError(
            existing?.steps ?? startPipelineSteps(),
            failedPipelineStep,
            error.error,
          ),
        });
      });
      toast.error(error.error);
      trackInstructionFailed(failedPipelineStep);
      return;
    }

    setRuns((current) => {
      const existing = current.find((run) => run.id === runId);
      return updateRun(current, runId, {
        status: "success",
        summary: result.data.summary,
        stellarTxHash: result.data.stellarTxHash,
        steps: applyPipelineSuccess(existing?.steps ?? startPipelineSteps()),
      });
    });

    notifyPipelineSuccess({
      instructionHashHex: result.data.instructionHashHex,
      stellarTxHash: result.data.stellarTxHash,
    });
    toast.success("Instruction logged on-chain.");
    trackInstructionSucceeded();
  }

  async function handleRetryLogging() {
    if (!latestRun?.error?.retryLogging || !publicKey || isRetrying) {
      return;
    }

    setIsRetrying(true);
    setGlobalError(null);

    setRuns((current) =>
      updateRun(current, latestRun.id, {
        status: "running",
        steps: applyRetryActorSteps(latestRun.steps),
        error: undefined,
      }),
    );

    const result = await postRetryLogging({
      walletAddress: publicKey,
      retryLogging: latestRun.error.retryLogging,
    });

    setIsRetrying(false);

    if (!result.ok) {
      setRuns((current) =>
        updateRun(current, latestRun.id, {
          status: "error",
          error: result.error,
          steps: applyPipelineError(
            applyRetryActorSteps(latestRun.steps),
            "actor",
            result.error.error,
          ),
        }),
      );
      toast.error(result.error.error);
      trackInstructionFailed(result.error.step);
      return;
    }

    setRuns((current) =>
      updateRun(current, latestRun.id, {
        status: "success",
        summary: result.data.summary,
        stellarTxHash: result.data.stellarTxHash,
        error: undefined,
        steps: applyPipelineSuccess(applyRetryActorSteps(latestRun.steps)),
      }),
    );

    notifyPipelineSuccess({
      instructionHashHex: result.data.instructionHashHex,
      stellarTxHash: result.data.stellarTxHash,
    });
    toast.success("On-chain logging succeeded.");
    trackInstructionSucceeded();
  }

  const showRetryLogging =
    latestRun?.status === "error" &&
    latestRun.error?.step === "actor" &&
    !!latestRun.error.retryLogging;

  const chatInputProps = {
    value: instruction,
    onChange: setInstruction,
    isGitHubConnected: isGitHubReady,
    repos,
    reposLoading,
    reposError,
    selectedRepo,
    onSelectRepo: setSelectedRepo,
    canRun: isReady && !isChecking,
    isSubmitting,
    onSubmit: () => void handleSubmit(),
  };

  if (showWelcome) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-2xl">
            {isChecking ? (
              <div className="mb-8 flex items-center justify-center gap-3">
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800"
                  aria-hidden
                />
                <p className="text-sm text-zinc-600">Loading session...</p>
              </div>
            ) : (
              <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl text-zinc-900 sm:text-4xl">
                  Workspace
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                  Connect GitHub from the chat bar, pick a repository, and run
                  an instruction through the agent pipeline.
                </p>
              </div>
            )}

            <ChatInput {...chatInputProps} variant="center" />

            {!isReady && !isChecking && isWalletReady && !isGitHubReady && (
              <p className="mt-3 text-center text-sm text-zinc-500">
                Connect GitHub in the chat bar to enable Run.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          {globalError && (
            <div
              className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
              role="alert"
            >
              <p className="text-sm font-medium text-red-800">
                {pipelineErrorTitle(globalError.step)}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {globalError.error}
                {globalError.retryAfterSeconds
                  ? ` Try again in ${globalError.retryAfterSeconds}s.`
                  : ""}
              </p>
            </div>
          )}

          <ConversationThread runs={runs} />

          {showRetryLogging && (
            <div className="flex justify-start pb-4">
              <button
                type="button"
                onClick={handleRetryLogging}
                disabled={isRetrying}
                className="inline-flex rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {isRetrying ? "Retrying..." : "Retry on-chain logging"}
              </button>
            </div>
          )}

          {latestRun?.status === "success" &&
            !dismissedFeedbackRunIds.has(latestRun.id) && (
              <div className="pb-4">
                <PostSuccessFeedback
                  runId={latestRun.id}
                  onDismiss={(runId) =>
                    setDismissedFeedbackRunIds((current) =>
                      new Set(current).add(runId),
                    )
                  }
                />
              </div>
            )}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-4 pt-2 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput {...chatInputProps} variant="bottom" />

          {!isReady && !isChecking && isWalletReady && !isGitHubReady && (
            <p className="mt-2 text-center text-sm text-zinc-500">
              Connect GitHub in the chat bar to enable Run.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function pipelineErrorTitle(
  step: PipelineErrorResponse["step"],
): string {
  switch (step) {
    case "interpreter":
      return "Instruction not understood";
    case "fetcher":
      return "Could not fetch GitHub data";
    case "thinker":
      return "Could not generate an AI summary";
    case "actor":
      return "On-chain logging failed";
    case "auth":
      return "GitHub connection required";
    case "rate_limit":
      return "Please wait before trying again";
    case "validation":
      return "Request could not be validated";
    default:
      return "Something went wrong";
  }
}
