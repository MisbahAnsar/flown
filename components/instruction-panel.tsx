"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SUPPORTED_INSTRUCTION_EXAMPLE } from "@/lib/agents/interpreter";
import {
  postRetryLogging,
  postRunInstruction,
  stellarExpertTxUrl,
} from "@/lib/pipeline/client";
import type { PipelineErrorResponse } from "@/lib/pipeline/types";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  advanceRunningStep,
  applyPipelineError,
  applyPipelineSuccess,
  applyRetryActorSteps,
  startPipelineSteps,
} from "@/components/instruction/activity-feed";
import { ActivityFeed } from "@/components/instruction/activity-feed-ui";
import {
  RunHistory,
  type InstructionRun,
} from "@/components/instruction/run-history";
import { SummaryDisplay } from "@/components/instruction/summary-display";

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
  const { data: session, status: authStatus } = useSession();
  const { status: walletStatus, publicKey, isLoading: walletLoading } =
    useWallet();

  const [instruction, setInstruction] = useState("");
  const [runs, setRuns] = useState<InstructionRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [globalError, setGlobalError] = useState<PipelineErrorResponse | null>(
    null,
  );

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGitHubReady = authStatus === "authenticated" && !!session?.user;
  const isWalletReady = walletStatus === "connected" && !!publicKey;
  const isReady = isGitHubReady && isWalletReady;
  const isChecking = authStatus === "loading" || walletLoading;

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
    if (!isReady || !publicKey || instruction.trim().length === 0 || isSubmitting) {
      return;
    }

    const runId = createRunId();
    const instructionText = instruction.trim();
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

    const result = await postRunInstruction({
      instructionText,
      walletAddress: publicKey,
    });

    clearProgressTimer();
    setIsSubmitting(false);

    if (!result.ok) {
      const error = result.error;
      const failedPipelineStep =
        error.step === "interpreter" ||
        error.step === "fetcher" ||
        error.step === "actor"
          ? error.step
          : null;

      if (!failedPipelineStep) {
        setGlobalError(error);
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
  }

  const showRetryLogging =
    activeRun?.status === "error" &&
    activeRun.error?.step === "actor" &&
    !!activeRun.error.retryLogging;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center sm:mb-10 sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            What should flowm do?
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Give one instruction in plain English. Watch the agent pipeline work
            in real time.
          </p>
        </div>

        <RunHistory
          runs={runs}
          activeRunId={activeRun?.id ?? null}
          onSelect={setActiveRunId}
        />

        {!isReady && !isChecking && (
          <section
            className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
            aria-label="Onboarding requirements"
          >
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              Connect both accounts to send an instruction
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              GitHub provides notification data. Your Freighter wallet links your
              Stellar testnet identity for on-chain logging.
            </p>
            <ul className="mt-4 space-y-3">
              <RequirementItem
                done={isGitHubReady}
                title="Sign in with GitHub"
                description="Required before the Send button is enabled."
              />
              <RequirementItem
                done={isWalletReady}
                title="Connect Freighter wallet"
                description="Required before the Send button is enabled."
              />
            </ul>
          </section>
        )}

        {isChecking && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
              aria-hidden
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Checking your session...
            </p>
          </div>
        )}

        {globalError && (
          <div
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950/40 sm:px-5"
            role="alert"
          >
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {globalError.step === "rate_limit"
                ? "Rate limit reached"
                : globalError.step === "auth"
                  ? "Authentication required"
                  : "Request failed"}
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {globalError.error}
              {globalError.retryAfterSeconds
                ? ` Try again in ${globalError.retryAfterSeconds}s.`
                : ""}
            </p>
          </div>
        )}

        {activeRun && (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Activity feed
              </p>
              <div className="mt-3">
                <ActivityFeed steps={activeRun.steps} />
              </div>
            </div>

            {activeRun.status === "error" && activeRun.error && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950/40 sm:px-5"
                role="alert"
              >
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {activeRun.error.step} failed
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {activeRun.error.error}
                </p>
                {showRetryLogging && (
                  <button
                    type="button"
                    onClick={handleRetryLogging}
                    disabled={isRetrying}
                    className="mt-3 inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
                  >
                    {isRetrying ? "Retrying logging..." : "Retry logging"}
                  </button>
                )}
              </div>
            )}

            {activeRun.status === "success" && activeRun.summary && (
              <div className="space-y-3">
                <SummaryDisplay summary={activeRun.summary} />
                {activeRun.stellarTxHash && (
                  <a
                    href={stellarExpertTxUrl(activeRun.stellarTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-sm font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
                  >
                    View on-chain proof
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {!activeRun && isReady && !isChecking && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Send your first instruction to see the live activity feed.
          </p>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
        >
          <label htmlFor="instruction" className="sr-only">
            Instruction
          </label>
          <textarea
            id="instruction"
            name="instruction"
            rows={3}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            disabled={!isReady || isSubmitting}
            placeholder={SUPPORTED_INSTRUCTION_EXAMPLE}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800 sm:text-base"
          />

          {!isReady && !isChecking && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Send is disabled until GitHub sign-in and wallet connection are
              complete.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={!isReady || isSubmitting || instruction.trim().length === 0}
              className="inline-flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900"
                    aria-hidden
                  />
                  Sending
                </>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequirementItem({
  done,
  title,
  description,
}: {
  done: boolean;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
        aria-hidden
      >
        {done ? "✓" : "•"}
      </span>
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </li>
  );
}
