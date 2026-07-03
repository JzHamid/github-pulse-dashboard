import { NextResponse } from "next/server";
import { getWeatherPulse } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? searchParams.get("city");
  const result = await getWeatherPulse(location);

  if (!result.ok) {
    return NextResponse.json(result, { status: getStatus(result.error.type) });
  }

  return NextResponse.json(result);
}

function getStatus(
  errorType: "invalid-location" | "not-found" | "api-error" | "network-error" | "empty",
) {
  if (errorType === "invalid-location") {
    return 400;
  }

  if (errorType === "not-found") {
    return 404;
  }

  if (errorType === "network-error") {
    return 502;
  }

  if (errorType === "empty") {
    return 502;
  }

  return 500;
}
