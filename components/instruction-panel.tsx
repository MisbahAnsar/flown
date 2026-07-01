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
import { PipelineLiveDisplay } from "@/components/instruction/pipeline-live-display";
import {
  buildInstructionText,
  ChatInput,
} from "@/components/instruction/chat-input";
import {
  RunHistory,
  type InstructionRun,
} from "@/components/instruction/run-history";
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
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
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

  const {
    repos,
    isLoading: reposLoading,
    error: reposError,
  } = useGitHubRepos(isGitHubReady);

  const activeRun = runs.find((run) => run.id === activeRunId) ?? runs[0] ?? null;

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
    setActiveRunId(runId);
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
    if (!activeRun?.error?.retryLogging || !publicKey || isRetrying) {
      return;
    }

    setIsRetrying(true);
    setGlobalError(null);

    setRuns((current) =>
      updateRun(current, activeRun.id, {
        status: "running",
        steps: applyRetryActorSteps(activeRun.steps),
        error: undefined,
      }),
    );

    const result = await postRetryLogging({
      walletAddress: publicKey,
      retryLogging: activeRun.error.retryLogging,
    });

    setIsRetrying(false);

    if (!result.ok) {
      setRuns((current) =>
        updateRun(current, activeRun.id, {
          status: "error",
          error: result.error,
          steps: applyPipelineError(
            applyRetryActorSteps(activeRun.steps),
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
      updateRun(current, activeRun.id, {
        status: "success",
        summary: result.data.summary,
        stellarTxHash: result.data.stellarTxHash,
        error: undefined,
        steps: applyPipelineSuccess(applyRetryActorSteps(activeRun.steps)),
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
    activeRun?.status === "error" &&
    activeRun.error?.step === "actor" &&
    !!activeRun.error.retryLogging;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6">
          {showWelcome ? (
            <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
              {isChecking ? (
                <div className="mb-8 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800"
                    aria-hidden
                  />
                  <p className="text-sm text-zinc-600">Loading session...</p>
                </div>
              ) : (
                <>
                  <h1 className="font-heading text-3xl text-zinc-900 sm:text-4xl">
                    Workspace
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                    Connect GitHub from the chat bar, pick a repository, and run
                    an instruction through the agent pipeline.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col py-6">
              {runs.length > 1 && (
                <RunHistory
                  runs={runs}
                  activeRunId={activeRun?.id ?? null}
                  onSelect={setActiveRunId}
                />
              )}

              {globalError && (
                <div
                  className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
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

              {activeRun && (
                <section className="space-y-4">
                  <PipelineLiveDisplay
                    steps={activeRun.steps}
                    status={activeRun.status}
                    summary={activeRun.summary}
                    stellarTxHash={activeRun.stellarTxHash}
                    errorMessage={activeRun.error?.error}
                  />

                  {activeRun.status === "error" && showRetryLogging && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleRetryLogging}
                        disabled={isRetrying}
                        className="inline-flex rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
                      >
                        {isRetrying ? "Retrying..." : "Retry on-chain logging"}
                      </button>
                    </div>
                  )}

                  {activeRun.status === "success" &&
                    !dismissedFeedbackRunIds.has(activeRun.id) && (
                      <PostSuccessFeedback
                        runId={activeRun.id}
                        onDismiss={(runId) =>
                          setDismissedFeedbackRunIds((current) =>
                            new Set(current).add(runId),
                          )
                        }
                      />
                    )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-5 pt-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput
            value={instruction}
            onChange={setInstruction}
            isGitHubConnected={isGitHubReady}
            repos={repos}
            reposLoading={reposLoading}
            reposError={reposError}
            selectedRepo={selectedRepo}
            onSelectRepo={setSelectedRepo}
            canRun={isReady && !isChecking}
            isSubmitting={isSubmitting}
            onSubmit={() => void handleSubmit()}
          />

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
