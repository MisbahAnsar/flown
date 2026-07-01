"use client";

import { useState } from "react";
import { AuditTrailPanel } from "@/components/audit/audit-trail-panel";
import { AppSidebar, type AppTab } from "@/components/app/app-sidebar";
import { InstructionPanel } from "@/components/instruction-panel";
import { trackAuditTrailViewed } from "@/lib/monitoring/analytics";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessionKey, setChatSessionKey] = useState(0);

  function selectTab(tab: AppTab) {
    if (tab === "chat" && activeTab === "chat") {
      setChatSessionKey((value) => value + 1);
    }

    setActiveTab(tab);
    if (tab === "audit") {
      trackAuditTrailViewed();
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <AppSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((value) => !value)}
        activeTab={activeTab}
        onTabChange={selectTab}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {activeTab === "chat" ? (
          <InstructionPanel key={chatSessionKey} />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <AuditTrailPanel />
          </div>
        )}
      </main>
    </div>
  );
}
