import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { LEARN_ARTICLES } from "@/lib/learn-content";

export const metadata: Metadata = {
  title: "Betting Basics — RawIntel",
  description: "Twenty terms every bettor should understand. Plain-English explanations of spreads, moneylines, juice, and more.",
};

/** Extract the first sentence (through the first terminal punctuation). Falls back to the full string. */
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
}

export default function LearnIndexPage() {
  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      {/* Hero */}
      <header style={{ background: "var(--canvas)", padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <p style={{
            fontSize: "11px", textTransform: "uppercase",
            letterSpacing: "0.22em", color: "var(--signal)",
            marginBottom: "16px",
          }}>
            Betting Basics
          </p>
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 500, color: "var(--ink)",
            letterSpacing: "-0.025em", lineHeight: 1.1,
            margin: 0, marginBottom: "14px",
          }}>
            The language of betting, plain English.
          </h1>
          <p style={{
            fontSize: "16px", color: "var(--muted)",
            maxWidth: "560px", lineHeight: 1.6, margin: 0,
          }}>
            Twenty terms every bettor should understand before they place a single dollar.
          </p>
        </div>
      </header>

      {/* Grid */}
      <section style={{ maxWidth: "860px", margin: "0 auto", padding: "16px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "12px",
        }}>
          {LEARN_ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/learn/${a.slug}`}
              className="learn-card"
              style={{
                display: "block",
                textDecoration: "none",
                background: "var(--paper)",
                border: "0.5px solid var(--border)",
                borderRadius: 0,
                padding: "20px 22px",
              }}
            >
              <h2 style={{
                fontFamily: "Georgia, serif",
                fontSize: "17px", fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.015em",
                lineHeight: 1.25,
                margin: 0, marginBottom: "10px",
              }}>
                {a.title}
              </h2>
              <p style={{
                fontSize: "13px", color: "var(--muted)",
                lineHeight: 1.5, margin: 0,
              }}>
                {firstSentence(a.directAnswer)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
