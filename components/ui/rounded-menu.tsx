"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface RoundedMenuProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  placement?: "above" | "below";
  className?: string;
  variant?: "light" | "dark";
  portal?: boolean;
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
  variant = "light",
  portal = false,
  rootRef,
}: RoundedMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inTrigger = rootRef?.current?.contains(target) ?? false;
      const inMenu = ref.current?.contains(target) ?? false;

      if (portal) {
        if (!inTrigger && !inMenu) {
          onClose();
        }
        return;
      }

      const boundary = rootRef?.current ?? ref.current;
      if (boundary && !boundary.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, rootRef]);

  useEffect(() => {
    if (!open || !portal || !rootRef?.current) {
      setPortalStyle(null);
      return;
    }

    function updatePosition() {
      const anchor = rootRef?.current;
      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const gap = 8;

      setPortalStyle({
        top: placement === "below" ? rect.bottom + gap : rect.top - gap,
        left: align === "right" ? rect.right : rect.left,
        minWidth: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, portal, rootRef, placement, align]);

  if (!open) {
    return null;
  }

  const placementClass =
    placement === "below" ? "top-full mt-2" : "bottom-full mb-2";

  const variantClass =
    variant === "dark"
      ? "border-zinc-600/80 bg-zinc-800 text-zinc-100 shadow-xl shadow-black/40 ring-1 ring-zinc-700/50"
      : "border-zinc-200 bg-white shadow-xl shadow-zinc-200/60";

  const menu = (
    <div
      ref={ref}
      role="menu"
      className={`overflow-hidden rounded-2xl border py-1.5 ${variantClass} ${
        portal ? "fixed z-[400]" : `absolute z-[200] ${placementClass} ${align === "right" ? "right-0" : "left-0"}`
      } ${className}`}
      onWheel={(event) => event.stopPropagation()}
      style={
        portal && portalStyle
          ? {
              top: portalStyle.top,
              left: align === "right" ? undefined : portalStyle.left,
              right:
                align === "right"
                  ? window.innerWidth - (rootRef?.current?.getBoundingClientRect().right ?? 0)
                  : undefined,
              minWidth: Math.max(portalStyle.minWidth, 192),
              transform:
                placement === "above" ? "translateY(-100%)" : undefined,
            }
          : undefined
      }
    >
      {children}
    </div>
  );

  if (portal && typeof document !== "undefined") {
    return createPortal(menu, document.body);
  }

  return menu;
}

export function RoundedMenuItem({
  onClick,
  children,
  destructive = false,
  variant = "light",
}: {
  onClick: () => void;
  children: ReactNode;
  destructive?: boolean;
  variant?: "light" | "dark";
}) {
  const baseClass =
    variant === "dark"
      ? destructive
        ? "text-red-400 hover:bg-zinc-700"
        : "text-zinc-100 hover:bg-zinc-700"
      : destructive
        ? "text-red-600 hover:bg-zinc-50"
        : "text-zinc-800 hover:bg-zinc-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-2.5 text-left text-sm transition ${baseClass}`}
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
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}
