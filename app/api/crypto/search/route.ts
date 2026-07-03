import { NextResponse } from "next/server";
import { searchCryptoAssets } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const suggestions = await searchCryptoAssets(query);

  return NextResponse.json({ suggestions });
}
