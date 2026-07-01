import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

/** Server-only. Never pass this value to client components. */
export async function getGitHubAccessToken(): Promise<string | null> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
    } as unknown as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.accessToken || typeof token.accessToken !== "string") {
    return null;
  }

  return token.accessToken;
}
