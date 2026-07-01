"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

export function InstructionPanel() {
  const { data: session, status: authStatus } = useSession();
  const { status: walletStatus, publicKey, isLoading: walletLoading } =
    useWallet();
  const [instruction, setInstruction] = useState("");

  const isGitHubReady = authStatus === "authenticated" && !!session?.user;
  const isWalletReady = walletStatus === "connected" && !!publicKey;
  const isReady = isGitHubReady && isWalletReady;
  const isChecking = authStatus === "loading" || walletLoading;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center sm:mb-10 sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            What should flowm do?
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Give one instruction in plain English. The agent pipeline will
            interpret it, fetch data, act, and log every step on Stellar.
          </p>
        </div>

        {!isReady && !isChecking && (
          <section
            className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
            aria-label="Onboarding requirements"
          >
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              Connect both accounts to get started
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              flowm needs GitHub for data access and a Stellar wallet for
              on-chain action logging. Complete both steps in the header before
              running an instruction.
            </p>
            <ul className="mt-4 space-y-3">
              <RequirementItem
                done={isGitHubReady}
                title="Sign in with GitHub"
                description="Grants read access to your notifications so the Fetcher agent can pull data."
              />
              <RequirementItem
                done={isWalletReady}
                title="Connect Freighter wallet"
                description="Links your Stellar testnet account so actions are logged to the Soroban contract."
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

        <div className="relative">
          <label htmlFor="instruction" className="sr-only">
            Instruction
          </label>
          <textarea
            id="instruction"
            name="instruction"
            rows={4}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            disabled={!isReady}
            placeholder={
              isReady
                ? 'e.g. "Summarize my unread GitHub notifications from this week"'
                : "Complete GitHub sign-in and wallet connection to continue"
            }
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500 sm:text-base"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isReady
                ? "Pipeline execution will be wired in a later step."
                : "Both GitHub and wallet must be connected."}
            </p>
            <button
              type="button"
              disabled={!isReady || instruction.trim().length === 0}
              className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:w-auto"
            >
              Run instruction
            </button>
          </div>
        </div>
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
