"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { GLOSSARY_CATEGORIES } from "@/lib/glossary-content";

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);
const BarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  rawintel: <StarIcon />,
  dna:      <GridIcon />,
  betting:  <DollarIcon />,
  stats:    <BarIcon />,
};

const BADGE_LABELS: Record<string, string> = {
  "cb-clear":   "Clear Spot",
  "cb-lean":    "Lean",
  "cb-fragile": "Fragile",
  "cb-pass":    "Pass",
};

export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.05 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const q = query.toLowerCase().trim();

  const filtered = GLOSSARY_CATEGORIES.map((cat) => ({
    ...cat,
    terms: cat.terms.filter((t) => {
      if (!q) return true;
      return (
        t.keywords.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.def.toLowerCase().includes(q)
      );
    }),
  })).filter((cat) => cat.terms.length > 0);

  const noResults = q && filtered.length === 0;

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .glossary-term-row {
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          alignItems: start !important;
        }
      }
    `}</style>
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav activePage="glossary" />

      {/* HERO */}
      <div
        className="f2"
        style={{
          background: "var(--ink)",
          padding: "36px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-2%",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "clamp(140px, 22vw, 260px)",
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.03)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            fontFamily: "var(--sans)",
          }}
        >
          R
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 20,
              height: 1,
              background: "var(--signal)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Glossary
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#fff",
            lineHeight: 1.1,
            marginBottom: 10,
            fontFamily: "var(--sans)",
          }}
        >
          Know the language.
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          Every term in the RawIntel system, plus the betting and stats
          vocabulary that shows up in every breakdown. Read smarter.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div
        className="f2"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-med)",
          padding: "16px 40px",
          position: "sticky",
          top: 54,
          zIndex: 90,
          boxShadow: "0 2px 8px rgba(17,17,16,0.04)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted-light)",
              pointerEvents: "none",
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search terms…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--ink)",
              background: "var(--warm-white)",
              border: "1px solid var(--border-med)",
              borderRadius: 0,
              outline: "none",
              transition: "border-color 0.15s",
              WebkitAppearance: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--signal)";
              (e.target as HTMLInputElement).style.background = "var(--surface)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--border-med)";
              (e.target as HTMLInputElement).style.background = "var(--warm-white)";
            }}
          />
        </div>
      </div>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "48px 40px 80px" }}
      >
        {/* Leverage point — shown only when not searching */}
        {!q && (
          <div style={{
            marginBottom: "36px",
            padding: "20px 24px",
            background: "var(--surface)",
            border: "1px solid var(--border-med)",
            borderLeft: "3px solid var(--signal)",
          }}>
            <p style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>New here?</strong> Start with the{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>RawIntel System</strong> terms below — they define how every breakdown is structured. Once those click, the betting and stats vocabulary will make a lot more sense.
            </p>
          </div>
        )}

        {noResults && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 6,
              }}
            >
              No terms found.
            </strong>
            Try a different search — or clear it to browse the full list.
          </div>
        )}

        {filtered.map((cat, ci) => (
          <div
            key={cat.id}
            ref={(el) => {
              revealRefs.current[ci] = el;
            }}
            className="reveal"
            style={{ marginBottom: 52 }}
          >
            {/* Category header */}
            {cat.id === "rawintel" ? (
              <div style={{
                background: "var(--ink)", padding: "14px 20px",
                display: "flex", alignItems: "center", gap: 12,
                marginBottom: 2,
              }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "var(--signal)", background: "rgba(201,53,42,0.12)",
                  padding: "3px 8px", flexShrink: 0,
                }}>
                  Start Here
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
                  textTransform: "uppercase", fontFamily: "var(--mono)",
                  color: "rgba(255,255,255,0.55)",
                }}>
                  {cat.name}
                </div>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 0,
                  background: "var(--cream)", border: "1px solid var(--border-med)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, color: "var(--signal)",
                }}>
                  {CATEGORY_ICONS[cat.id]}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
                  textTransform: "uppercase", fontFamily: "var(--mono)",
                  color: "var(--muted)",
                }}>
                  {cat.name}
                </div>
                <div style={{ flex: 1, height: 1, background: "var(--border-med)" }} />
              </div>
            )}

            {/* Term rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cat.terms.map((term) => (
                <div
                  key={term.slug}
                  className="glossary-term-row"
                  style={{
                    background: "var(--surface)",
                    borderRadius: 0,
                    border: "1px solid rgba(17,17,16,0.06)",
                    borderLeft: cat.id === "rawintel" ? "3px solid var(--signal)" : "1px solid rgba(17,17,16,0.06)",
                    padding: "16px 20px",
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: 24,
                    alignItems: "baseline",
                    boxShadow: "var(--shadow-sm)",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 2px 12px rgba(17,17,16,0.08)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  <div>
                    <Link
                      href={`/glossary/${term.slug}`}
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: "var(--ink)",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--signal)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                      }}
                    >
                      {term.name}
                    </Link>
                    {term.badge && (
                      <div
                        className={`conf-badge ${term.badge}`}
                        style={{ marginTop: 4 }}
                      >
                        <span className="dot" />
                        {BADGE_LABELS[term.badge]}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--ink-2)",
                      lineHeight: 1.6,
                    }}
                  >
                    {term.def}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "24px 40px",
          fontSize: 12,
          color: "var(--muted-light)",
          lineHeight: 1.8,
        }}
      >
        For informational purposes only. RawIntel does not provide financial,
        betting, or investment advice. Bet responsibly.
        <br />
        <a
          href="https://ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          ncpgambling.org
        </a>
        {" · "}
        <Link
          href="/terms"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Terms of Service
        </Link>
        {" · "}
        <Link
          href="/privacy"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Privacy Policy
        </Link>
        {" · "}© RawIntel LLC
      </footer>
    </div>
    </>
  );
}
