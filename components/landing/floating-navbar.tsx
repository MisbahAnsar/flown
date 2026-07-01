"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { scrollToSection } from "@/lib/scroll-to-section";

const NAV_LINKS = [
  { label: "Features", sectionId: "features" },
  { label: "About us", sectionId: "about" },
  { label: "Feedback", sectionId: "feedback" },
] as const;

export function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNavClick(sectionId: string) {
    scrollToSection(sectionId);
  }

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 ${
        scrolled ? "" : "px-4 sm:px-6"
      }`}
      style={{
        paddingTop: scrolled ? 0 : "1.25rem",
        transition: "padding-top 650ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <nav
        className={`pointer-events-auto grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 bg-white/95 backdrop-blur-md ${
          scrolled
            ? "border-b border-zinc-200 px-4 py-3 shadow-sm sm:px-6"
            : "mx-auto max-w-6xl rounded-2xl px-4 py-3 shadow-lg shadow-zinc-200/50 sm:px-5"
        }`}
        style={{
          transition:
            "border-radius 650ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 650ms cubic-bezier(0.22, 1, 0.36, 1), border-color 650ms cubic-bezier(0.22, 1, 0.36, 1)",
          borderRadius: scrolled ? "0px" : "1rem",
        }}
      >
        <Link
          href="/"
          className="font-heading text-xl tracking-tight text-zinc-800"
        >
          flowms
        </Link>

        <div className="hidden items-center justify-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.sectionId}
              type="button"
              onClick={() => handleNavClick(link.sectionId)}
              className="text-sm text-zinc-600 transition hover:text-zinc-800"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2 md:hidden">
            {NAV_LINKS.map((link) => (
              <button
                key={link.sectionId}
                type="button"
                onClick={() => handleNavClick(link.sectionId)}
                className="text-xs text-zinc-600 transition hover:text-zinc-800"
              >
                {link.label}
              </button>
            ))}
          </div>
          <ConnectWallet variant="navbar" />
        </div>
      </nav>
    </header>
  );
}
