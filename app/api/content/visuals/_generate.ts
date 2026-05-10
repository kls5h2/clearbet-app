import path from "path";
import fs from "fs";
import type { VisualData } from "./_lib";
import {
  renderCoverHtml,
  renderKeyDriversHtml,
  renderFragilityHtml,
  renderCtaHtml,
} from "./_lib";

const SLIDE_NAMES = ["slide-1", "slide-2", "slide-3", "slide-4"];

export async function generatePngsForBreakdown(
  id: string,
  data: VisualData
): Promise<string[]> {
  // Dynamic imports keep puppeteer out of the main bundle for pages that don't need it.
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;

  const slides = [
    renderCoverHtml(data),
    renderKeyDriversHtml(data),
    renderFragilityHtml(data),
    renderCtaHtml(data),
  ];

  // public/generated/ is writable in local dev.
  // On Vercel production the project root is read-only — integrate Vercel Blob
  // (vercel.com/docs/storage/vercel-blob) to store PNGs in production.
  const outputDir = path.join(process.cwd(), "public", "generated", id);
  fs.mkdirSync(outputDir, { recursive: true });

  // Prefer an explicit local Chrome path (useful in dev); fall back to the
  // Chromium binary that @sparticuz/chromium downloads to /tmp on first run.
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ?? (await chromium.executablePath());

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 1 },
    executablePath,
    headless: true,
  });

  const urls: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const page = await browser.newPage();
    // networkidle0 ensures Google Fonts have loaded before we screenshot.
    await page.setContent(slides[i], { waitUntil: "networkidle0" });
    const filePath = path.join(outputDir, `${SLIDE_NAMES[i]}.png`);
    await page.screenshot({ path: filePath, type: "png" });
    await page.close();
    urls.push(`/generated/${id}/${SLIDE_NAMES[i]}.png`);
  }

  await browser.close();
  return urls;
}
