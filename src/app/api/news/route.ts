import { NextResponse } from "next/server";
import { discoverNews } from "@/lib/discovery";
import { getCached, setCached } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_KEY = "news:candidates";
const CACHE_TTL_MS = 15 * 60_000;

export async function GET() {
  try {
    const cached = getCached<unknown[]>(CACHE_KEY);
    if (cached) return NextResponse.json({ candidates: cached, cached: true });
    const candidates = await discoverNews();
    setCached(CACHE_KEY, candidates, CACHE_TTL_MS);
    return NextResponse.json({ candidates, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 },
    );
  }
}
