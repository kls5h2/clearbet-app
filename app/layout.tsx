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
const OG_IMAGE = `${SITE_URL}/api/og?type=home`;

export const metadata: Metadata = {
  title: "RawIntel — What the data says. Your decision to make.",
  description:
    "RawIntel turns raw game data into plain-English analysis so you can make informed betting decisions in under 60 seconds.",
  openGraph: {
    title: "RawIntel — Raw data. Clear read. Your call.",
    description:
      "Six-step breakdown on every game. Plain-English reasoning. Never picks — your decision is always yours.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "RawIntel — Raw data. Clear read. Your call." }],
    type: "website",
    siteName: "RawIntel",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "RawIntel — Raw data. Clear read. Your call.",
    description:
      "Six-step breakdown on every game. Plain-English reasoning. Never picks — your decision is always yours.",
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
