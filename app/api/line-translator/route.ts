import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are RawIntel's Line Translator. A user has submitted a betting line.

Respond ONLY with a JSON object (no markdown, no backticks, no explanatory text) in exactly this format:
{
  "line": "the exact line as submitted or extracted from image",
  "translation": "2-3 sentence plain-English explanation. May include <strong> HTML tags around key numbers only. Explain what the bettor wins/loses and what the numbers mean. Clear enough for a complete beginner.",
  "impliedProbability": 52,
  "context": "1-2 sentences on what the market is saying with this line. What does it imply about the expected outcome? Is this line typical or unusual?",
  "watch": [
    "First specific thing to monitor that could affect this line",
    "Second specific thing to monitor"
  ]
}

Rules:
- impliedProbability must be an integer 0–100 representing the implied win probability
- For spread bets at standard -110 juice, impliedProbability ≈ 52
- For moneylines: positive odds (+130) → probability = round(100 / (odds + 100) * 100); negative odds (-150) → probability = round(odds_abs / (odds_abs + 100) * 100)
- watch items must be specific and actionable, 1 sentence each
- Never suggest what to bet. Never say "bet on" or "I recommend"
- Use <strong> tags only for key numbers in the translation field, not in context or watch`;

type ImageMime = "image/png" | "image/jpeg" | "image/webp";
const ALLOWED_MIMES = new Set<ImageMime>(["image/png", "image/jpeg", "image/webp"]);
const MAX_B64_BYTES = 5 * 1024 * 1024;

interface ImagePayload {
  data: string;
  mediaType: ImageMime;
}

export async function POST(req: NextRequest) {
  let input = "";
  let image: ImagePayload | null = null;

  try {
    const body = await req.json();
    input = String(body?.input ?? "").trim();
    if (body?.image && typeof body.image === "object") {
      const data = String(body.image.data ?? "");
      const mediaType = String(body.image.mediaType ?? "") as ImageMime;
      if (!ALLOWED_MIMES.has(mediaType)) {
        return NextResponse.json({ error: "Unsupported image type. Use PNG, JPEG, or WebP." }, { status: 400 });
      }
      if (!data) {
        return NextResponse.json({ error: "Image data missing" }, { status: 400 });
      }
      if (data.length > MAX_B64_BYTES) {
        return NextResponse.json({ error: "Image too large (max ~4MB)." }, { status: 400 });
      }
      image = { data, mediaType };
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!input && !image) {
    return NextResponse.json({ error: "Provide text, an image, or both." }, { status: 400 });
  }
  if (input.length > 200) {
    return NextResponse.json({ error: "Keep text under 200 characters." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[line-translator] ANTHROPIC_API_KEY not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const content: Anthropic.MessageParam["content"] = [];
    if (image) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: image.mediaType, data: image.data },
      });
    }
    const textBlock = input || (image ? "Please read the betting line(s) shown in this image and translate the primary one." : "");
    if (textBlock) content.push({ type: "text", text: textBlock });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const first = message.content[0];
    if (first.type !== "text") throw new Error("Unexpected response type");

    const raw = first.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      line: String(parsed.line ?? input),
      translation: String(parsed.translation ?? ""),
      impliedProbability: Math.round(Number(parsed.impliedProbability) || 0),
      context: String(parsed.context ?? ""),
      watch: Array.isArray(parsed.watch) ? parsed.watch.map(String) : [],
    });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[line-translator] FAILED:", e.message);
    return NextResponse.json({ error: "Failed to translate" }, { status: 500 });
  }
}
