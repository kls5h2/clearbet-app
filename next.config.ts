import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf-parse out of the Next.js bundle — it uses Node.js fs APIs
  // that aren't available in Edge Runtime or the webpack build pipeline.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
