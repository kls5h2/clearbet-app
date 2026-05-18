import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Intel — RawIntel",
  description: "Live game breakdowns for today's NBA and MLB slate. Pick a game, get the data.",
};

export default function IntelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
