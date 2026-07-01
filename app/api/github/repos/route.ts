import { NextResponse } from "next/server";
import { getGitHubAccessToken, getSession } from "@/lib/auth-server";
import { getUserRepositories } from "@/lib/github/repos";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connect GitHub to list repositories." },
      { status: 401 },
    );
  }

  const accessToken = await getGitHubAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: "GitHub access token is missing. Connect GitHub again." },
      { status: 401 },
    );
  }

  const result = await getUserRepositories(accessToken);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }

  return NextResponse.json({ repos: result.repos });
}
