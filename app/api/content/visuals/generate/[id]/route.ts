import { NextRequest, NextResponse } from "next/server";
import { checkAuth, fetchVisualData } from "../../_lib";
import { generatePngsForBreakdown } from "../../_generate";

// Chromium + 4 screenshots need headroom beyond the default serverless timeout.
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await fetchVisualData(id);
  if (!data) {
    return NextResponse.json({ error: "Breakdown not found" }, { status: 404 });
  }

  let urls: string[];
  try {
    urls = await generatePngsForBreakdown(id, data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[visuals/generate/${id}] Puppeteer error:`, msg);
    return NextResponse.json({ error: "Screenshot generation failed", detail: msg }, { status: 500 });
  }

  return NextResponse.json({
    id,
    matchup: data.matchup,
    sport: data.sport,
    slides: {
      cover: urls[0],
      keyDrivers: urls[1],
      fragility: urls[2],
      cta: urls[3],
    },
  });
}
