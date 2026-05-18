import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { GLOSSARY_TERMS, getGlossaryTerm } from "@/lib/glossary-content";
import { getLearnArticle } from "@/lib/learn-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) return { title: "Not found — RawIntel" };
  return {
    title: `${term.name} — RawIntel Glossary`,
    description: term.def,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  rawintel: "RawIntel System",
  dna:      "Game DNA Tags",
  betting:  "Betting Basics",
  stats:    "Stats & Data",
};

const BADGE_LABELS: Record<string, string> = {
  "cb-clear":   "Clear Spot",
  "cb-lean":    "Lean",
  "cb-fragile": "Fragile",
  "cb-pass":    "Pass",
};

export default async function GlossaryTermPage({ params }: PageProps) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const categoryLabel = CATEGORY_LABELS[term.categoryId] ?? term.categoryId;

  const relatedArticles = (term.relatedSlugs ?? [])
    .map((s) => getLearnArticle(s))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav activePage="glossary" />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 40px 96px" }}>

        {/* Back link */}
        <Link
          href="/glossary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
            textDecoration: "none",
            marginBottom: 40,
          }}
        >
          ← Glossary
        </Link>

        {/* Category label */}
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 10,
          }}
        >
          {categoryLabel}
        </div>

        {/* Term name */}
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 38px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: term.badge ? 16 : 24,
            fontFamily: "var(--sans)",
          }}
        >
          {term.name}
        </h1>

        {/* Confidence badge */}
        {term.badge && (
          <div className={`conf-badge ${term.badge}`} style={{ marginBottom: 24 }}>
            <span className="dot" />
            {BADGE_LABELS[term.badge]}
          </div>
        )}

        {/* Rule */}
        <div style={{ height: 1, background: "var(--border-med)", marginBottom: 28 }} />

        {/* Definition */}
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.75,
            color: "var(--ink-2)",
            fontFamily: "var(--sans)",
            margin: 0,
          }}
        >
          {term.def}
        </p>

        {/* Related reading */}
        {relatedArticles.length > 0 && (
          <div style={{ marginTop: 48, borderTop: "1px solid var(--border-med)", paddingTop: 28 }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              Related reading
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/learn/${a.slug}`}
                    style={{
                      fontSize: 15,
                      color: "var(--signal)",
                      textDecoration: "none",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    {a.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
