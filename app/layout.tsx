import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import DisclaimerFooter from "@/components/DisclaimerFooter";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
    <html
      lang="en"
      className={`${manrope.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DisclaimerFooter />
      </body>
    </html>
  );
}
