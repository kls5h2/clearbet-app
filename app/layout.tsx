import type { Metadata } from "next";
import "./globals.css";
import DisclaimerFooter from "@/components/DisclaimerFooter";

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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
        <DisclaimerFooter />
      </body>
    </html>
  );
}
