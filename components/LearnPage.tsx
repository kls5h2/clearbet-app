import Link from "next/link";
import Nav from "@/components/Nav";
import type { LearnArticle } from "@/lib/learn-content";
import { getLearnArticle } from "@/lib/learn-content";

interface Props {
  article: LearnArticle;
}

export default function LearnPage({ article }: Props) {
  const { title, directAnswer, explanation, example, decisionContext, faqs, relatedSlugs } = article;

  const related = relatedSlugs
    .map((s) => getLearnArticle(s))
    .filter((a): a is LearnArticle => a !== null);

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      {/* Dark hero — standardized */}
      <header style={{ background: "var(--ink)", minHeight: "280px", padding: "72px 24px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
          <p style={{
            fontFamily: "var(--sans)", fontSize: "11px",
            textTransform: "uppercase", letterSpacing: "0.22em",
            color: "var(--signal)", marginBottom: "16px",
          }}>
            Betting Basics
          </p>
          <h1 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 500, color: "#FAFAFA",
            letterSpacing: "-0.025em", lineHeight: 1.1,
            maxWidth: "680px", margin: 0,
          }}>
            {title}
          </h1>
        </div>
      </header>

      <article style={{ maxWidth: "680px", margin: "0 auto", padding: "24px" }}>

        {/* 1. Direct Answer — pull quote with signal red left border */}
        <section style={{
          borderLeft: "3px solid var(--signal)",
          paddingLeft: "22px",
          marginBottom: "40px",
        }}>
          <p style={{
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: "22px", fontWeight: 500,
            color: "var(--ink)", lineHeight: 1.4,
            margin: 0,
          }}>
            {directAnswer}
          </p>
        </section>

        {/* 2. Plain English explanation */}
        <section style={{ marginBottom: "40px" }}>
          <p style={{
            fontSize: "16px", color: "var(--ink)",
            lineHeight: 1.8, margin: 0,
          }}>
            {explanation}
          </p>
        </section>

        {/* 3. Example — paper card */}
        <section style={{ marginBottom: "40px" }}>
          <div style={{
            background: "var(--paper)",
            border: "0.5px solid var(--border)",
            borderRadius: "6px",
            padding: "22px 24px",
          }}>
            <p style={{
              fontSize: "11px", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--ink)", opacity: 0.5, marginBottom: "10px",
            }}>
              Example
            </p>
            <p style={{
              fontSize: "16px", color: "var(--ink)",
              lineHeight: 1.65, margin: 0,
            }}>
              {example}
            </p>
          </div>
        </section>

        {/* 4. What It Means For Your Decision */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: "22px",
            fontWeight: 500, color: "var(--ink)",
            letterSpacing: "-0.015em", margin: 0, marginBottom: "12px",
          }}>
            What it means for your decision
          </h2>
          <p style={{
            fontSize: "16px", color: "var(--ink)",
            lineHeight: 1.8, margin: 0,
          }}>
            {decisionContext}
          </p>
        </section>

        {/* 5. FAQ — native <details> accordion */}
        {faqs.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{
              fontFamily: "Georgia, serif", fontSize: "22px",
              fontWeight: 500, color: "var(--ink)",
              letterSpacing: "-0.015em", margin: 0, marginBottom: "16px",
            }}>
              Frequently asked
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {faqs.map((faq, i) => (
                <details key={i} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <summary style={{
                    fontSize: "15px", fontWeight: 500,
                    color: "var(--ink)", cursor: "pointer",
                    padding: "14px 0", listStyle: "none",
                  }}>
                    {faq.q}
                  </summary>
                  <p style={{
                    fontSize: "15px", color: "var(--muted)",
                    lineHeight: 1.65, margin: 0,
                    padding: "0 0 14px",
                  }}>
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* 6. CTA → slate */}
        <section style={{ textAlign: "center", marginBottom: "48px" }}>
          <Link href="/" style={{
            display: "inline-block",
            background: "var(--signal)", color: "#FAFAFA",
            fontFamily: "var(--sans)", fontSize: "13px",
            fontWeight: 500, letterSpacing: "0.04em",
            padding: "14px 24px", borderRadius: "4px",
            textDecoration: "none",
          }}>
            See it in a real breakdown →
          </Link>
        </section>

        {/* 7. Related terms */}
        {related.length > 0 && (
          <section style={{ borderTop: "0.5px solid var(--border)", paddingTop: "24px" }}>
            <p style={{
              fontSize: "11px", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--ink)", opacity: 0.5, marginBottom: "12px",
            }}>
              Related terms
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/learn/${r.slug}`} style={{
                    fontSize: "15px", color: "var(--signal)",
                    textDecoration: "none",
                  }}>
                    {r.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
