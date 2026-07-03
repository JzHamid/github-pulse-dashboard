import { NextResponse } from "next/server";
import { searchWeatherLocations } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const suggestions = await searchWeatherLocations(query);

  return NextResponse.json({ suggestions });
}
