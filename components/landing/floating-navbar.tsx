"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  function handleNavClick(sectionId: string) {
    scrollToSection(sectionId);
    setMobileMenuOpen(false);
  }

  const navShellClass = scrolled
    ? "border-b border-zinc-200 px-4 py-3 shadow-sm sm:px-6"
    : "mx-auto max-w-6xl rounded-2xl px-4 py-3 shadow-lg shadow-zinc-200/50 sm:px-5";

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
        className={`pointer-events-auto w-full bg-white/95 backdrop-blur-md ${navShellClass}`}
        style={{
          transition:
            "border-radius 650ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 650ms cubic-bezier(0.22, 1, 0.36, 1), border-color 650ms cubic-bezier(0.22, 1, 0.36, 1)",
          borderRadius: scrolled ? "0px" : "1rem",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="shrink-0 font-heading text-xl tracking-tight text-zinc-800"
          >
            flowms
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-800 md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
            <ConnectWallet variant="navbar" />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 border-t border-zinc-100 pt-2 md:hidden">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.sectionId}
                  type="button"
                  onClick={() => handleNavClick(link.sectionId)}
                  className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
