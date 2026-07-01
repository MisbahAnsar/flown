"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stellarExpertTxUrl } from "@/lib/pipeline/client";
import type { FeedStep } from "./activity-feed";
import type { InstructionRun } from "./run-history";

const AGENT_LABELS = ["Interpreter", "Fetcher", "Thinker", "Actor"] as const;

function getRunningAgentLabel(steps: FeedStep[]): string {
  const runningIndex = steps.findIndex((step) => step.status === "running");
  if (runningIndex >= 0 && runningIndex < AGENT_LABELS.length) {
    return AGENT_LABELS[runningIndex] ?? "Interpreter";
  }

  const actorRunning = steps.some(
    (step) => step.id === "actor" && step.status === "running",
  );
  if (actorRunning) {
    return "Almost done";
  }

  const lastSuccess = [...steps]
    .reverse()
    .find(
      (step) =>
        AGENT_LABELS.includes(step.label as (typeof AGENT_LABELS)[number]) &&
        step.status === "success",
    );

  if (lastSuccess) {
    const index = AGENT_LABELS.indexOf(
      lastSuccess.label as (typeof AGENT_LABELS)[number],
    );
    const next = AGENT_LABELS[index + 1];
    return next ?? "Almost done";
  }

  return "Interpreter";
}

function useFadingLabel(label: string) {
  const [visible, setVisible] = useState(label);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (label === visible) {
      return;
    }

    setOpacity(0);
    const timeout = window.setTimeout(() => {
      setVisible(label);
      setOpacity(1);
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [label, visible]);

  return { visible, opacity };
}

function AgentStatusText({ steps }: { steps: FeedStep[] }) {
  const label = useMemo(() => getRunningAgentLabel(steps), [steps]);
  const { visible, opacity } = useFadingLabel(label);

  return (
    <p
      className="text-sm text-zinc-400 transition-opacity duration-300"
      style={{ opacity }}
    >
      {visible}...
    </p>
  );
}

function useStreamText(text: string | undefined, enabled: boolean) {
  const [streamed, setStreamed] = useState("");

  useEffect(() => {
    if (!enabled || !text) {
      setStreamed("");
      return;
    }

    setStreamed("");
    let index = 0;
    const chunkSize = 4;
    const interval = window.setInterval(() => {
      index += chunkSize;
      setStreamed(text.slice(0, Math.min(index, text.length)));
      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 14);

    return () => window.clearInterval(interval);
  }, [text, enabled]);

  return streamed;
}

function AssistantMessage({
  run,
}: {
  run: InstructionRun;
}) {
  const isStreaming = run.status === "success" && !!run.summary;
  const streamed = useStreamText(run.summary, isStreaming);

  if (run.status === "running") {
    return <AgentStatusText steps={run.steps} />;
  }

  if (run.status === "error") {
    return (
      <p className="text-sm leading-6 text-red-600">
        {run.error?.error ?? "Something went wrong."}
      </p>
    );
  }

  if (!run.summary) {
    return <p className="text-sm text-zinc-400">Preparing response...</p>;
  }

  return (
    <div className="space-y-2">
      <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">
        {streamed}
        {streamed.length < run.summary.length && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-middle" />
        )}
      </div>
      {run.stellarTxHash && streamed.length >= run.summary.length && (
        <a
          href={stellarExpertTxUrl(run.stellarTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
        >
          View on Stellar
        </a>
      )}
    </div>
  );
}

function ConversationTurn({ run }: { run: InstructionRun }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-800">
          {run.instructionText}
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[88%] min-w-0">
          <AssistantMessage run={run} />
        </div>
      </div>
    </div>
  );
}

interface ConversationThreadProps {
  runs: InstructionRun[];
}

export function ConversationThread({ runs }: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const chronological = useMemo(() => [...runs].reverse(), [runs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [runs]);

  return (
    <div className="space-y-10 py-6">
      {chronological.map((run) => (
        <ConversationTurn key={run.id} run={run} />
      ))}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
