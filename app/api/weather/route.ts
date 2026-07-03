import { NextResponse } from "next/server";
import { getWeatherPulse } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const result = await getWeatherPulse(city);

  if (!result.ok) {
    return NextResponse.json(result, { status: getStatus(result.error.type) });
  }

  return NextResponse.json(result);
}

function getStatus(errorType: "invalid-city" | "api-error" | "network-error" | "empty") {
  if (errorType === "invalid-city") {
    return 400;
  }

  if (errorType === "network-error") {
    return 502;
  }

  if (errorType === "empty") {
    return 502;
  }

  return 500;
}
