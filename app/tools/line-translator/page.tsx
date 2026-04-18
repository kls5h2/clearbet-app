import type { Metadata } from "next";
import LineTranslatorClient from "./LineTranslatorClient";

export const metadata: Metadata = {
  title: "Line Translator — RawIntel",
  description: "Paste any betting line. Get plain English back. Free, no account needed.",
};

export default function LineTranslatorPage() {
  return <LineTranslatorClient />;
}
