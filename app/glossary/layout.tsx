import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glossary — RawIntel",
  description: "Sports betting terms defined in plain English. No jargon, no assumptions.",
};

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
