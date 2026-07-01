"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

interface RoundedMenuProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  placement?: "above" | "below";
  className?: string;
  /** Wraps trigger + menu; outside clicks within this root do not close. */
  rootRef?: RefObject<HTMLElement | null>;
}

export function RoundedMenu({
  open,
  onClose,
  children,
  align = "left",
  placement = "above",
  className = "",
  rootRef,
}: RoundedMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const boundary = rootRef?.current ?? ref.current;
      if (boundary && !boundary.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, rootRef]);

  if (!open) {
    return null;
  }

  const placementClass =
    placement === "below" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <div
      ref={ref}
      className={`absolute z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-xl shadow-zinc-200/60 ${placementClass} ${align === "right" ? "right-0" : "left-0"} ${className}`}
    >
      {children}
    </div>
  );
}

export function RoundedMenuItem({
  onClick,
  children,
  destructive = false,
}: {
  onClick: () => void;
  children: ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
        destructive ? "text-red-600" : "text-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

export function RoundedScrollList({
  children,
  maxRows = 4,
}: {
  children: ReactNode;
  maxRows?: number;
}) {
  return (
    <div
      className="overflow-y-auto overscroll-contain"
      style={{ maxHeight: `${maxRows * 2.75}rem` }}
    >
      {children}
    </div>
  );
}
