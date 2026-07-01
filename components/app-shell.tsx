"use client";

import { useState } from "react";
import { AuditTrailPanel } from "@/components/audit/audit-trail-panel";
import { AppSidebar, type AppTab } from "@/components/app/app-sidebar";
import { InstructionPanel } from "@/components/instruction-panel";
import { trackAuditTrailViewed } from "@/lib/monitoring/analytics";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function selectTab(tab: AppTab) {
    setActiveTab(tab);
    if (tab === "audit") {
      trackAuditTrailViewed();
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <AppSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((value) => !value)}
        activeTab={activeTab}
        onTabChange={selectTab}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white pt-[22vh]">
        {activeTab === "chat" ? <InstructionPanel /> : <AuditTrailPanel />}
      </div>
    </div>
  );
}
