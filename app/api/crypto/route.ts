import { NextResponse } from "next/server";
import { getCryptoPulse } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coins = searchParams.get("coins");
  const result = await getCryptoPulse(coins);

  if (!result.ok) {
    return NextResponse.json(result, { status: getStatus(result.error.type) });
  }

  return NextResponse.json(result);
}

function getStatus(
  errorType: "invalid-input" | "rate-limit" | "api-error" | "network-error" | "empty",
) {
  if (errorType === "invalid-input") {
    return 400;
  }

  if (errorType === "rate-limit") {
    return 429;
  }

  if (errorType === "network-error") {
    return 502;
  }

  if (errorType === "empty") {
    return 502;
  }

  return 500;
}
