"use client";

import type { PipelineStep } from "@/lib/pipeline/types";

export type FeedStepId = "interpreter" | "fetcher" | "thinker" | "actor" | "done";

export type StepStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface FeedStep {
  id: FeedStepId;
  label: string;
  description: string;
  status: StepStatus;
  error?: string;
}

export const FEED_STEPS: Array<{
  id: FeedStepId;
  label: string;
  description: string;
}> = [
  {
    id: "interpreter",
    label: "Interpreter",
    description: "Understanding your instruction",
  },
  {
    id: "fetcher",
    label: "Fetcher",
    description: "Reading unread GitHub notifications",
  },
  {
    id: "thinker",
    label: "Thinker",
    description: "Summarizing with Gemini AI",
  },
  {
    id: "actor",
    label: "Actor",
    description: "Writing the audit log to Stellar",
  },
  {
    id: "done",
    label: "Done",
    description: "All steps finished",
  },
];

export function createInitialSteps(): FeedStep[] {
  return FEED_STEPS.map((step) => ({
    ...step,
    status: "pending",
  }));
}

export function getRunningStepIndex(steps: FeedStep[]): number {
  return steps.findIndex((step) => step.status === "running");
}

export function advanceRunningStep(steps: FeedStep[]): FeedStep[] {
  const currentIndex = getRunningStepIndex(steps);
  if (currentIndex === -1) {
    return steps;
  }

  return steps.map((step, index) => {
    if (index < currentIndex) {
      return { ...step, status: "success" };
    }
    if (index === currentIndex) {
      return { ...step, status: "success" };
    }
    if (index === currentIndex + 1 && step.status === "pending") {
      return { ...step, status: "running" };
    }
    return step;
  });
}

export function startPipelineSteps(): FeedStep[] {
  return createInitialSteps().map((step, index) => ({
    ...step,
    status: index === 0 ? "running" : "pending",
  }));
}

const STEP_ORDER: FeedStepId[] = [
  "interpreter",
  "fetcher",
  "thinker",
  "actor",
  "done",
];

function stepIndexForPipelineStep(step: PipelineStep): number {
  switch (step) {
    case "interpreter":
      return 0;
    case "fetcher":
      return 1;
    case "thinker":
      return 2;
    case "actor":
      return 3;
    default:
      return -1;
  }
}

export function applyPipelineError(
  steps: FeedStep[],
  failedStep: PipelineStep,
  error: string,
): FeedStep[] {
  const failIndex = stepIndexForPipelineStep(failedStep);
  if (failIndex === -1) {
    return steps;
  }

  return steps.map((step, index) => {
    if (index < failIndex) {
      return { ...step, status: "success" };
    }
    if (index === failIndex) {
      return { ...step, status: "error", error };
    }
    return { ...step, status: "skipped" };
  });
}

export function applyPipelineSuccess(steps: FeedStep[]): FeedStep[] {
  return steps.map((step) => ({ ...step, status: "success" }));
}

export function applyRetryActorSteps(steps: FeedStep[]): FeedStep[] {
  return steps.map((step) => {
    if (step.id === "interpreter" || step.id === "fetcher" || step.id === "thinker") {
      return { ...step, status: "success" };
    }
    if (step.id === "actor") {
      return { ...step, status: "running", error: undefined };
    }
    return { ...step, status: "pending", error: undefined };
  });
}

export function stepIdsBeforeDone(): FeedStepId[] {
  return STEP_ORDER.slice(0, -1);
}
