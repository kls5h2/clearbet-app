import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these out of the Next.js webpack bundle — they use native Node.js APIs
  // and/or ship their own native binaries that must run outside the bundler.
  serverExternalPackages: ["pdf-parse", "@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
