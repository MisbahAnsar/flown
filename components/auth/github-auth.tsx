"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

const AUTH_ERRORS: Record<string, string> = {
  OAuthSignin: "Could not start GitHub connection. Check your OAuth app settings.",
  OAuthCallback: "GitHub connection was interrupted. Please try again.",
  OAuthAccountNotLinked:
    "This GitHub account is already linked to another user.",
  AccessDenied: "GitHub access was denied. Approve the request to continue.",
  Configuration:
    "GitHub connection is misconfigured. Check NEXTAUTH_URL and OAuth credentials.",
  Default: "GitHub connection failed. Please try again.",
};

interface GitHubConnectProps {
  callbackUrl?: string;
}

export function GitHubConnect({ callbackUrl = "/app" }: GitHubConnectProps) {
  const toast = useToast();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownUrlErrorRef = useRef<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (!authError) {
      return;
    }

    const message = AUTH_ERRORS[authError] ?? AUTH_ERRORS.Default;
    setError(message);

    if (shownUrlErrorRef.current !== authError) {
      shownUrlErrorRef.current = authError;
      toast.error(message);
    }
  }, [searchParams, toast]);

  async function handleConnect() {
    setError(null);
    setIsConnecting(true);
    try {
      await signIn("github", { callbackUrl });
    } catch {
      const message = AUTH_ERRORS.Default;
      setError(message);
      toast.error(message);
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    toast.info("GitHub disconnected.");
    void signOut({ callbackUrl });
  }

  if (status === "loading") {
    return (
      <div
        className="inline-flex h-9 min-w-[7rem] items-center justify-center rounded-full border border-zinc-200 px-3"
        aria-busy="true"
        aria-label="Checking GitHub connection"
      >
        <span
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
          aria-hidden
        />
      </div>
    );
  }

  if (session?.user) {
    const label = session.user.username ?? session.user.name ?? "GitHub";

    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full border border-zinc-200"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span
          className="hidden max-w-[8rem] truncate text-sm font-medium text-zinc-800 sm:inline"
          title={label}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={handleDisconnect}
          className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60"
      >
        {isConnecting ? (
          <>
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
              aria-hidden
            />
            Connecting...
          </>
        ) : (
          <>
            <GitHubIcon />
            Connect GitHub
          </>
        )}
      </button>
      {error && (
        <p className="max-w-xs text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/** @deprecated Use GitHubConnect */
export const GitHubAuth = GitHubConnect;
