import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a plain-English sports betting translator for RawIntel. When given a betting line, explain in 2-4 sentences exactly what it means, what the market is implying, and what a bettor needs to understand about it. Use no jargon without explaining it. No picks, no recommendations. Voice: sharp, calm, direct. End every response with: 'Your decision is always yours.'`;

const CLOSING = "Your decision is always yours.";

export async function POST(req: NextRequest) {
  let input: string;
  try {
    const body = await req.json();
    input = String(body?.input ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!input) return NextResponse.json({ error: "input is required" }, { status: 400 });
  if (input.length > 200) return NextResponse.json({ error: "Keep it under 200 characters." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[line-translator] ANTHROPIC_API_KEY not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    });

    const first = message.content[0];
    if (first.type !== "text") throw new Error("Unexpected response type");
    let text = first.text.trim();
    // Defensive: enforce closing line
    if (!text.includes(CLOSING)) text = text.trimEnd() + " " + CLOSING;

    return NextResponse.json({ translation: text });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[line-translator] FAILED:", e.message);
    return NextResponse.json({ error: "Failed to translate" }, { status: 500 });
  }
}
