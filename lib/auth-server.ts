import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

function readEnvGitHubToken(): string | null {
  const token =
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_ACCESS_TOKEN?.trim();

  return token || null;
}

async function readOAuthGitHubToken(request?: Request): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return null;
  }

  if (request) {
    const token = await getToken({
      req: request as NextRequest,
      secret,
    });

    if (typeof token?.accessToken === "string" && token.accessToken.length > 0) {
      return token.accessToken;
    }

    return null;
  }

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const token = await getToken({
    req: {
      headers: {
        ...Object.fromEntries(headerStore.entries()),
        cookie: cookieHeader,
      },
    } as unknown as NextRequest,
    secret,
  });

  if (typeof token?.accessToken === "string" && token.accessToken.length > 0) {
    return token.accessToken;
  }

  return null;
}

/**
 * Server-only GitHub token for Fetcher/repos API calls.
 * Prefers the OAuth token from the signed-in user's session, then falls back to
 * GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) from the environment.
 */
export async function getGitHubAccessToken(
  request?: Request,
): Promise<string | null> {
  const oauthToken = await readOAuthGitHubToken(request);
  if (oauthToken) {
    return oauthToken;
  }

  return readEnvGitHubToken();
}
