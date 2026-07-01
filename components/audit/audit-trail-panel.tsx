"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAuditTrail } from "@/lib/stellar/audit-client";
import type { AuditTrailAction, AuditTrailResponse } from "@/lib/stellar/audit-trail";
import {
  stellarExpertContractUrl,
  stellarExpertTxUrl,
} from "@/lib/pipeline/client";
import { captureMonitoringException } from "@/lib/monitoring/sentry";
import { useToast } from "@/components/ui/toast";
import { useAuditRefresh } from "./audit-refresh-context";

const PAGE_SIZE = 10;

function AuditSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-2 h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

function ProofLink({
  action,
  contractId,
  txHash,
}: {
  action: AuditTrailAction;
  contractId: string;
  txHash?: string;
}) {
  const href = txHash
    ? stellarExpertTxUrl(txHash)
    : stellarExpertContractUrl(contractId);
  const label = txHash ? "View transaction" : "View contract";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
      title={action.instructionHash}
    >
      {label}
    </a>
  );
}

function AuditCard({
  action,
  contractId,
  txHash,
}: {
  action: AuditTrailAction;
  contractId: string;
  txHash?: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Action #{action.id}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {action.agentId} / {action.actionType}
          </p>
        </div>
        <ProofLink action={action} contractId={contractId} txHash={txHash} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Tool</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {action.tool}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Logged at</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {action.timestampLabel}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function AuditTrailPanel() {
  const toast = useToast();
  const { refreshToken, txHashByInstructionHash, refreshAuditTrail } =
    useAuditRefresh();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AuditTrailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const manualRefreshRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);

  const loadPage = useCallback(
    async (pageIndex: number) => {
      setIsLoading(true);
      setError(null);

      const result = await fetchAuditTrail(pageIndex * PAGE_SIZE, PAGE_SIZE);

      setIsLoading(false);

      if (!result.ok) {
        setError(result.error);
        setData(null);
        if (lastErrorRef.current !== result.error) {
          lastErrorRef.current = result.error;
          toast.error(`Could not load audit trail — ${result.error}`);
          captureMonitoringException(new Error(result.error), {
            surface: "audit_trail_fetch",
          });
        }
        manualRefreshRef.current = false;
        return;
      }

      lastErrorRef.current = null;
      setData(result.data);

      if (manualRefreshRef.current) {
        manualRefreshRef.current = false;
        toast.info("Audit trail updated.");
      }
    },
    [toast],
  );

  function handleManualRefresh() {
    manualRefreshRef.current = true;
    refreshAuditTrail();
  }

  useEffect(() => {
    void loadPage(page);
  }, [loadPage, page, refreshToken]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canGoPrevious = page > 0;
  const canGoNext = data ? page + 1 < totalPages : false;

  return (
    <div className="flex min-w-0 flex-1 flex-col px-3 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Audit Trail
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
              The full on-chain history from the Soroban contract. Every logged
              action is public and verifiable on Stellar testnet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {data?.contractId && (
          <p className="mb-4 break-all text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Contract{" "}
            <a
              href={stellarExpertContractUrl(data.contractId)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline underline-offset-2"
            >
              {data.contractId}
            </a>
          </p>
        )}

        {isLoading && <AuditSkeleton />}

        {!isLoading && error && (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 dark:border-red-900 dark:bg-red-950/40 sm:px-6"
            role="alert"
          >
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Stellar RPC unavailable
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-300">
              {error} Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => void loadPage(page)}
              className="mt-3 inline-flex rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && data && data.totalCount === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center dark:border-zinc-700 dark:bg-zinc-950 sm:px-6">
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              No actions logged yet
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Send an instruction from the Chat tab. flowms will log the action
              here automatically.
            </p>
          </div>
        )}

        {!isLoading && !error && data && data.totalCount > 0 && (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                  <tr>
                    {["ID", "Agent", "Action", "Tool", "Timestamp", "Proof"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.actions.map((action) => (
                    <tr key={action.id}>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                        #{action.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                        {action.agentId}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                        {action.actionType}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                        {action.tool}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                        {action.timestampLabel}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ProofLink
                          action={action}
                          contractId={data.contractId}
                          txHash={
                            txHashByInstructionHash[action.instructionHash]
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {data.actions.map((action) => (
                <AuditCard
                  key={action.id}
                  action={action}
                  contractId={data.contractId}
                  txHash={txHashByInstructionHash[action.instructionHash]}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Showing {data.start + 1}-
                {Math.min(data.start + data.actions.length, data.totalCount)} of{" "}
                {data.totalCount}
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={!canGoPrevious}
                  className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50 sm:flex-none dark:border-zinc-700 dark:text-zinc-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!canGoNext}
                  className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50 sm:flex-none dark:border-zinc-700 dark:text-zinc-100"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
