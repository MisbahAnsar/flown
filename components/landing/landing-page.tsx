"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FloatingNavbar } from "@/components/landing/floating-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { WalletConnectModal } from "@/components/wallet/wallet-connect-modal";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { scrollToSection } from "@/lib/scroll-to-section";
import { useWallet } from "@/components/wallet/wallet-provider";

const FEATURES = [
  {
    title: "Three-agent pipeline",
    description:
      "Interpreter, Fetcher, and Actor agents run your instruction step by step with a live activity feed.",
  },
  {
    title: "On-chain audit trail",
    description:
      "Every action is logged to a Soroban contract on Stellar testnet — verifiable by anyone.",
  },
  {
    title: "GitHub-native",
    description:
      "Connect GitHub in the workspace to read notifications or point agents at public repositories.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const { status } = useWallet();
  const { openFeedback } = useFeedback();
  const [showWalletModal, setShowWalletModal] = useState(false);

  function handleGetStarted() {
    if (status === "connected") {
      router.push("/app");
      return;
    }
    setShowWalletModal(true);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <FloatingNavbar />

      <main>
        <section className="px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:pb-24 lg:pt-40">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium tracking-wide text-zinc-500">
              Agents · GitHub · Stellar
            </p>
            <h1 className="font-heading mt-4 text-4xl leading-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Instructions you can verify on-chain
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">
              flowms turns plain-English tasks into a transparent agent pipeline
              and records every action on Stellar testnet.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleGetStarted}
                className="rounded-full bg-zinc-700 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-600"
              >
                Get started
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="rounded-full border border-zinc-200 bg-white px-8 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                See how it works
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60">
            <Image
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80"
              alt="Agent pipeline dashboard preview"
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </section>

        <section id="features" className="border-t border-zinc-200 bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl text-zinc-900 sm:text-4xl">
                Built for trust, not black boxes
              </h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                flowms is designed so you always know what ran, what data was
                read, and what landed on-chain.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-6"
                >
                  <h3 className="font-heading text-xl text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-t border-zinc-200 bg-[#fafafa] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl text-zinc-800 sm:text-4xl">
              About flowms
            </h2>
            <p className="mt-6 text-base leading-7 text-zinc-600">
              flowms is built for people who want AI agents to act on their behalf
              without losing visibility. Every instruction runs through a clear
              three-step pipeline, and every outcome is written to an on-chain audit
              log on Stellar testnet so you can prove what happened.
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              We started with GitHub notifications because they are a practical,
              high-signal workflow — but the architecture is designed to grow into
              more tools while keeping the same verifiable pattern.
            </p>
          </div>
        </section>

        <section id="feedback" className="border-t border-zinc-200 bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl text-zinc-800 sm:text-4xl">
              Feedback
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              flowms is early. Tell us what worked, what confused you, or what you
              want to see next — your notes go straight into our product loop.
            </p>
            <button
              type="button"
              onClick={() => openFeedback()}
              className="mt-8 rounded-full bg-zinc-700 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-600"
            >
              Send feedback
            </button>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-zinc-800 px-8 py-12 text-center text-white sm:px-12">
            <h2 className="font-heading text-3xl sm:text-4xl">
              Ready to run your first instruction?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-300">
              Connect your Freighter wallet, open the workspace, link GitHub, and
              send a task to the agent pipeline.
            </p>
            <button
              type="button"
              onClick={handleGetStarted}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              Open workspace
            </button>
          </div>
        </section>
      </main>

      <LandingFooter />

      <WalletConnectModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={() => {
          setShowWalletModal(false);
          router.push("/app");
        }}
      />
    </div>
  );
}
