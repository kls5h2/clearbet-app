import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rawintelsports.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  title: "RawIntel — Raw data. Clear read. Your call.",
  description:
    "Structured game breakdowns in plain English. No picks. Your decision, always.",
  openGraph: {
    title: "RawIntel — Raw data. Clear read. Your call.",
    description:
      "Structured game breakdowns in plain English. No picks. Your decision, always.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "RawIntel — Raw data. Clear read. Your call." }],
    type: "website",
    siteName: "RawIntel",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "RawIntel — Raw data. Clear read. Your call.",
    description:
      "Structured game breakdowns in plain English. No picks. Your decision, always.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
