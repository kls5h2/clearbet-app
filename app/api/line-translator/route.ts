import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a plain-English sports betting translator for RawIntel. When given a betting line, explain in 2-4 sentences exactly what it means, what the market is implying, and what a bettor needs to understand about it. Use no jargon without explaining it. No picks, no recommendations. Voice: sharp, calm, direct. End every response with: 'Your decision is always yours.'`;

const CLOSING = "Your decision is always yours.";

// Accepted vision mime types (matches Anthropic's source.media_type union).
type ImageMime = "image/png" | "image/jpeg" | "image/webp";
const ALLOWED_MIMES = new Set<ImageMime>(["image/png", "image/jpeg", "image/webp"]);

// ~5MB ceiling on the base64 payload — the raw image is ~75% of this.
const MAX_B64_BYTES = 5 * 1024 * 1024;

const IMAGE_ONLY_PROMPT = "Please read the betting line(s) shown in this image and translate each one into plain English.";

interface ImagePayload {
  data: string;        // base64 without data-URL prefix
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

    // Build the user content block. Image-only → use the fallback prompt.
    const content: Anthropic.MessageParam["content"] = [];
    if (image) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: image.mediaType, data: image.data },
      });
    }
    const textBlock = input || (image ? IMAGE_ONLY_PROMPT : "");
    if (textBlock) {
      content.push({ type: "text", text: textBlock });
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const first = message.content[0];
    if (first.type !== "text") throw new Error("Unexpected response type");
    let text = first.text.trim();
    if (!text.includes(CLOSING)) text = text.trimEnd() + " " + CLOSING;

    return NextResponse.json({ translation: text });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[line-translator] FAILED:", e.message);
    return NextResponse.json({ error: "Failed to translate" }, { status: 500 });
  }
}
