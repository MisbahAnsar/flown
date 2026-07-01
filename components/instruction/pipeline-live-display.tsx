"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stellarExpertTxUrl } from "@/lib/pipeline/client";
import type { FeedStep } from "./activity-feed";

const AGENT_LABELS = ["Interpreter", "Fetcher", "Thinker", "Actor"] as const;

interface PipelineLiveDisplayProps {
  steps: FeedStep[];
  status: "running" | "success" | "error";
  summary?: string;
  stellarTxHash?: string;
  errorMessage?: string;
}

function getRunningAgentIndex(steps: FeedStep[]): number {
  const runningIndex = steps.findIndex((step) => step.status === "running");
  if (runningIndex >= 0 && runningIndex < AGENT_LABELS.length) {
    return runningIndex;
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
    return Math.min(index + 1, AGENT_LABELS.length - 1);
  }

  return 0;
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
    }, 16);

    return () => window.clearInterval(interval);
  }, [text, enabled]);

  return streamed;
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
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [label, visible]);

  return { visible, opacity };
}

export function PipelineLiveDisplay({
  steps,
  status,
  summary,
  stellarTxHash,
  errorMessage,
}: PipelineLiveDisplayProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const agentIndex = getRunningAgentIndex(steps);
  const isStreaming = status === "success" && !!summary;
  const streamedSummary = useStreamText(summary, isStreaming);

  const agentLabel = useMemo(() => {
    if (status === "success") {
      return "Done";
    }
    if (status === "error") {
      return "Failed";
    }
    const actorRunning = steps.some(
      (step) => step.id === "actor" && step.status === "running",
    );
    if (actorRunning) {
      return "Almost done…";
    }
    return AGENT_LABELS[agentIndex] ?? "Interpreter";
  }, [agentIndex, status, steps]);

  const { visible: fadingLabel, opacity } = useFadingLabel(agentLabel);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isComplete = status === "success" && streamedSummary.length > 0;
  const ringClass =
    status === "running"
      ? "border-zinc-300 shadow-[0_0_0_8px_rgba(161,161,170,0.12)]"
      : status === "success"
        ? "border-emerald-400/80 shadow-[0_0_0_8px_rgba(52,211,153,0.1)]"
        : "border-red-300 shadow-[0_0_0_8px_rgba(252,165,165,0.12)]";

  if (isComplete) {
    return (
      <div className="flex flex-col items-center py-2">
        <div ref={menuRef} className="relative w-full max-w-2xl">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`group relative w-full rounded-[2rem] border-2 bg-white p-6 text-left transition hover:border-emerald-400/90 ${ringClass}`}
            aria-expanded={menuOpen}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Response
            </p>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {streamedSummary}
              {streamedSummary.length < (summary?.length ?? 0) && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-500 align-middle" />
              )}
            </div>
            <p className="mt-4 text-xs text-zinc-400 group-hover:text-zinc-600">
              Tap for actions
            </p>
          </button>

          {menuOpen && (
            <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl">
              {stellarTxHash && (
                <a
                  href={stellarExpertTxUrl(stellarTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50"
                  onClick={() => setMenuOpen(false)}
                >
                  View on Stellar
                </a>
              )}
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-50"
                onClick={() => {
                  if (summary) {
                    void navigator.clipboard.writeText(summary);
                  }
                  setMenuOpen(false);
                }}
              >
                Copy response
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full border-2 transition-all duration-700 ${ringClass} ${
            status === "running" ? "animate-pulse" : ""
          }`}
          aria-hidden
        />
        <div className="absolute inset-4 rounded-full bg-zinc-50" aria-hidden />
        <p
          className="relative z-10 px-4 text-center text-sm font-medium text-zinc-700 transition-opacity duration-300"
          style={{ opacity }}
        >
          {fadingLabel}
        </p>
      </div>

      {status === "running" && (
        <p className="mt-5 text-sm text-zinc-500">Running the agent pipeline…</p>
      )}

      {status === "error" && errorMessage && (
        <p className="mt-5 max-w-lg text-center text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {status === "success" && summary && streamedSummary.length === 0 && (
        <p className="mt-5 text-sm text-zinc-500">Preparing your response…</p>
      )}
    </div>
  );
}
