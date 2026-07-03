import { NextResponse } from "next/server";
import { getGitHubDashboard, normalizeUsername } from "@/lib/github";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = normalizeUsername(searchParams.get("username"));
  const result = await getGitHubDashboard(username);

  if (!result.ok) {
    return NextResponse.json(result, { status: getStatus(result.error.type) });
  }

  return NextResponse.json(result);
}

function getStatus(errorType: "not-found" | "rate-limit" | "api-error" | "network-error") {
  if (errorType === "not-found") {
    return 404;
  }

  if (errorType === "rate-limit") {
    return 429;
  }

  if (errorType === "network-error") {
    return 502;
  }

  return 500;
}
