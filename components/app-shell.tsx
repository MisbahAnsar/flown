"use client";

import { useState, type ReactNode } from "react";
import { AuditTrailPanel } from "@/components/audit/audit-trail-panel";
import { InstructionPanel } from "@/components/instruction-panel";

type AppTab = "chat" | "audit";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>("chat");

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 gap-2 overflow-x-auto px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <TabButton
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </TabButton>
          <TabButton
            active={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
          >
            Audit Trail
          </TabButton>
        </div>
      </div>

      {activeTab === "chat" ? <InstructionPanel /> : <AuditTrailPanel />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}
