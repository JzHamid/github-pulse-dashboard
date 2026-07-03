import { NextResponse } from "next/server";
import { getCryptoPulse } from "@/lib/crypto";

export async function GET() {
  const result = await getCryptoPulse();

  if (!result.ok) {
    return NextResponse.json(result, { status: getStatus(result.error.type) });
  }

  return NextResponse.json(result);
}

function getStatus(errorType: "rate-limit" | "api-error" | "network-error" | "empty") {
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
