"use client";

import { useEffect, useState } from "react";
import { AuditTrailPanel } from "@/components/audit/audit-trail-panel";
import { AppSidebar, type AppTab } from "@/components/app/app-sidebar";
import { InstructionPanel } from "@/components/instruction-panel";
import { trackAuditTrailViewed } from "@/lib/monitoring/analytics";

const DESKTOP_SIDEBAR_QUERY = "(min-width: 768px)";

function useIsDesktopSidebar() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_SIDEBAR_QUERY);
    setIsDesktop(mediaQuery.matches);

    function onChange(event: MediaQueryListEvent) {
      setIsDesktop(event.matches);
    }

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

export function AppShell() {
  const isDesktop = useIsDesktopSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("chat");
  const [chatSessionKey, setChatSessionKey] = useState(0);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  function selectTab(tab: AppTab) {
    if (tab === "chat" && activeTab === "chat") {
      setChatSessionKey((value) => value + 1);
    }

    setActiveTab(tab);
    if (tab === "audit") {
      trackAuditTrailViewed();
    }

    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }

  function toggleSidebar() {
    setSidebarOpen((value) => !value);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="relative flex h-full min-h-0 w-full">
      {!isDesktop && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        />
      )}

      <AppSidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        activeTab={activeTab}
        onTabChange={selectTab}
        className={!isDesktop && sidebarOpen ? "fixed inset-y-0 left-0 z-30 shadow-xl md:relative md:shadow-none" : undefined}
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
