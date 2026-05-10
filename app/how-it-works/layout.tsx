import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — RawIntel",
  description: "See how RawIntel turns live game data into plain-English breakdowns. No picks. Your decision.",
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
