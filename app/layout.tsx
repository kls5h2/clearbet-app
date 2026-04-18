import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import DisclaimerFooter from "@/components/DisclaimerFooter";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "RawIntel — What the data says. Your decision to make.",
  description:
    "RawIntel turns raw game data into plain-English analysis so you can make informed betting decisions in under 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
        <DisclaimerFooter />
      </body>
    </html>
  );
}
