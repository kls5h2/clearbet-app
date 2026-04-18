import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { BreakdownResult } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a content strategist for RawIntel, a sports betting decision-support tool. Your voice is sharp, calm, and direct — no hype, no picks, no recommendations. You turn game analysis into platform-specific content that educates and engages without telling anyone what to bet.`;

interface BreakdownRow {
  game_id: string;
  game_date: string;
  sport: string;
  home_team: string;
  away_team: string;
  breakdown_content: unknown;
}

interface RepurposeOutput {
  tweet_thread: string[];
  substack_excerpt: string;
  one_line_stat: string;
  learn_page_slug: string;
}

export async function POST(req: NextRequest) {
  let breakdownId: string;
  try {
    const body = await req.json();
    breakdownId = String(body?.breakdownId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!breakdownId) {
    return NextResponse.json({ error: "breakdownId is required" }, { status: 400 });
  }

  // Fetch most recent breakdown for this game_id
  const { data, error } = await supabase
    .from("breakdowns")
    .select("game_id, game_date, sport, home_team, away_team, breakdown_content")
    .eq("game_id", breakdownId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[repurpose] Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to fetch breakdown" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Breakdown not found" }, { status: 404 });
  }

  const row = data as BreakdownRow;
  // breakdown_content may be JSONB object or a string — handle both
  let content: BreakdownResult | null = null;
  if (row.breakdown_content && typeof row.breakdown_content === "object") {
    content = row.breakdown_content as BreakdownResult;
  } else if (typeof row.breakdown_content === "string") {
    try { content = JSON.parse(row.breakdown_content) as BreakdownResult; } catch { /* skip */ }
  }
  if (!content) {
    return NextResponse.json({ error: "Breakdown content is malformed" }, { status: 500 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[repurpose] ANTHROPIC_API_KEY not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const userMessage = buildUserMessage(row, content);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const first = message.content[0];
    if (first.type !== "text") throw new Error("Unexpected response type");

    // Strip any accidental code fences, then parse
    const json = first.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: RepurposeOutput;
    try {
      parsed = JSON.parse(json) as RepurposeOutput;
    } catch {
      console.error("[repurpose] invalid JSON from Claude:", json.slice(0, 300));
      return NextResponse.json({ error: "Claude returned invalid JSON" }, { status: 500 });
    }

    // Basic shape guard
    if (!Array.isArray(parsed.tweet_thread)) parsed.tweet_thread = [];
    if (typeof parsed.substack_excerpt !== "string") parsed.substack_excerpt = "";
    if (typeof parsed.one_line_stat !== "string") parsed.one_line_stat = "";
    if (typeof parsed.learn_page_slug !== "string") parsed.learn_page_slug = "";

    return NextResponse.json(parsed);
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[repurpose] FAILED:", e.message);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

function buildUserMessage(row: BreakdownRow, content: BreakdownResult): string {
  const drivers = content.keyDrivers
    .map((d) => `- ${d.factor} [${d.weight}, ${d.direction}]`)
    .join("\n");
  const fragility = content.fragilityCheck
    .map((f) => `- ${f.item} [${f.color}]`)
    .join("\n");
  const edge = content.edge.map((e) => `- ${e}`).join("\n");

  return `BREAKDOWN TO REPURPOSE:

Game: ${row.away_team} @ ${row.home_team}
Sport: ${row.sport}
Date: ${row.game_date}
Confidence: ${content.confidenceLabel} (level ${content.confidenceLevel})

--- GAME SHAPE ---
${content.gameShape}

--- KEY DRIVERS ---
${drivers}

--- BASE SCRIPT ---
${content.baseScript}

--- FRAGILITY CHECK ---
${fragility}

--- MARKET READ ---
${content.marketRead}

--- THE EDGE ---
${edge}

--- DECISION LENS (WHAT THIS MEANS) ---
${content.decisionLens}

--- GLOSSARY TERM FROM BREAKDOWN ---
${content.glossaryTerm}: ${content.glossaryDefinition}

---

Now generate repurposed content. Return valid JSON only, no markdown, no preamble, with this exact structure:

{
  "tweet_thread": [
    "tweet 1 — hook using the Game Shape (max 280 chars)",
    "tweet 2 — Key Driver 1 (max 280 chars)",
    "tweet 3 — Key Driver 2 (max 280 chars)",
    "tweet 4 — the Market Read in one sentence (max 280 chars)",
    "tweet 5 — closing line: This is not a pick. This is what the data says. Your decision is always yours. + rawintel.ai"
  ],
  "substack_excerpt": "3-4 sentences rewriting the Market Read for a beginner audience. No jargon without defining it. Ends with: Read the full breakdown at rawintel.ai",
  "one_line_stat": "The single most interesting data point from this breakdown in one punchy sentence. No pick implied.",
  "learn_page_slug": "the most relevant slug from this list: what-does-minus-110-mean, how-does-a-point-spread-work, what-is-a-moneyline-bet, what-does-over-under-mean, what-is-juice-or-vig, how-to-read-betting-odds, what-does-plus-150-mean, what-is-a-parlay-bet, what-does-line-movement-mean, what-is-sharp-money, what-is-closing-line-value, what-does-taken-off-the-board-mean, how-do-sportsbooks-make-money, what-is-a-two-way-market, what-is-implied-probability, how-to-know-if-spread-is-too-high, what-to-look-for-betting-a-total, what-does-public-on-one-side-mean, how-injuries-affect-betting-lines, what-is-line-shopping"
}`;
}
