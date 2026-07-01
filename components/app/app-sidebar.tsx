"use client";

import { signOut, useSession } from "next-auth/react";
import {
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import {
  RoundedMenu,
  RoundedMenuItem,
} from "@/components/ui/rounded-menu";
import { useToast } from "@/components/ui/toast";
import { useWallet } from "@/components/wallet/wallet-provider";

export type AppTab = "chat" | "audit";

interface AppSidebarProps {
  open: boolean;
  onToggle: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const iconClass = "h-5 w-5 shrink-0";

export function AppSidebar({
  open,
  onToggle,
  activeTab,
  onTabChange,
}: AppSidebarProps) {
  const toast = useToast();
  const { data: session } = useSession();
  const { status: walletStatus, disconnect: disconnectWallet } = useWallet();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isGitHubConnected = !!session?.user;
  const isWalletConnected = walletStatus === "connected";

  function handleDisconnectGitHub() {
    setSettingsOpen(false);
    toast.info("GitHub disconnected.");
    void signOut({ callbackUrl: "/app" });
  }

  function handleDisconnectWallet() {
    disconnectWallet();
    setSettingsOpen(false);
    toast.info("Wallet disconnected.");
  }

  const navItems: { id: AppTab; label: string; icon: ReactNode }[] = [
    { id: "chat", label: "Workspace", icon: <ClipboardList className={iconClass} aria-hidden /> },
    { id: "audit", label: "Audit trail", icon: <ScrollText className={iconClass} aria-hidden /> },
  ];

  return (
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col self-stretch border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out ${
        open ? "w-56" : "w-14"
      }`}
    >
      <div className={`flex shrink-0 ${open ? "justify-end px-3 py-3" : "justify-center py-3"}`}>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-800"
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
        >
          {open ? (
            <PanelLeftClose className={iconClass} aria-hidden />
          ) : (
            <PanelLeftOpen className={iconClass} aria-hidden />
          )}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 px-2 pb-2" aria-label="Workspace navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activeTab === item.id
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {!open && <div className="flex-1" aria-hidden />}

      <div
        ref={settingsRef}
        className={`mt-auto shrink-0 border-t border-zinc-200 ${open ? "p-2" : "flex justify-center p-2"}`}
      >
        <button
          type="button"
          onClick={() => setSettingsOpen((value) => !value)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-800 ${
            open ? "" : "w-auto justify-center p-2.5"
          }`}
          aria-expanded={settingsOpen}
          aria-haspopup="menu"
          title="Settings"
        >
          <Settings className={iconClass} aria-hidden />
          {open && <span>Settings</span>}
        </button>

        <RoundedMenu
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          align={open ? "left" : "right"}
          placement="above"
          rootRef={settingsRef}
        >
          {isGitHubConnected ? (
            <RoundedMenuItem onClick={handleDisconnectGitHub} destructive>
              Disconnect GitHub
            </RoundedMenuItem>
          ) : (
            <p className="px-4 py-2.5 text-sm text-zinc-400">GitHub not connected</p>
          )}
          {isWalletConnected ? (
            <RoundedMenuItem onClick={handleDisconnectWallet} destructive>
              Disconnect wallet
            </RoundedMenuItem>
          ) : (
            <p className="px-4 py-2.5 text-sm text-zinc-400">Wallet not connected</p>
          )}
        </RoundedMenu>
      </div>
    </aside>
  );
}
