"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

type ActivePage = "today" | "how-it-works" | "glossary" | "line-translator";

interface NavProps {
  backHref?: string;
  backLabel?: string;
  sportTag?: string;
  activePage?: ActivePage;
}

const LINKS: { href: string; label: string; page: ActivePage }[] = [
  { href: "/",                        label: "Today's Intel",   page: "today" },
  { href: "/how-it-works",            label: "How It Works",    page: "how-it-works" },
  { href: "/glossary",                label: "Glossary",        page: "glossary" },
  { href: "/tools/line-translator",   label: "Line Translator", page: "line-translator" },
];

export default function Nav({ backHref, backLabel = "Back", sportTag, activePage }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkStyle = (page: ActivePage): React.CSSProperties => ({
    fontSize: "13px", fontWeight: 400,
    color: "var(--ink)", opacity: activePage === page ? 1 : 0.7,
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--canvas)",
        borderBottom: "0.5px solid var(--border)",
        height: "60px",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center",
          height: "60px", padding: "0 1.5rem",
          maxWidth: "1100px", margin: "0 auto",
        }}
      >
        {/* Left: back link + logo with hairline */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingRight: "40px", borderRight: "0.5px solid var(--border)", marginRight: "32px", flexShrink: 0 }}>
          {backHref && (
            <>
              <Link href={backHref} style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>←</span>
                <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--muted)" }}>{backLabel}</span>
              </Link>
              <div style={{ width: "0.5px", height: "14px", background: "var(--border)" }} />
            </>
          )}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
        </div>

        {/* Desktop nav links — visible at ≥768px, right-aligned via margin-left: auto */}
        <nav className="hidden md:flex" style={{ gap: "1.5rem", alignItems: "center", marginLeft: "auto" }}>
          {LINKS.map((l) => (
            <Link key={l.page} href={l.href} style={linkStyle(l.page)}>
              {l.label}
            </Link>
          ))}
          {sportTag && (
            <Link
              href={`/?sport=${sportTag.toLowerCase()}`}
              style={{ textDecoration: "none" }}
              aria-label={`View today's ${sportTag} slate`}
            >
              <span
                style={{
                  fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--muted)",
                  transition: "opacity 150ms ease, color 150ms ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.textDecoration = "underline";
                  e.currentTarget.style.textUnderlineOffset = "3px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted)";
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                {sportTag}
              </span>
            </Link>
          )}
        </nav>

        {/* Hamburger button — mobile only, <768px.
            Wrapper carries md:hidden so inline display:flex on the button doesn't override it. */}
        <div className="md:hidden" style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px", display: "flex", flexDirection: "column",
              gap: "5px", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ display: "block", width: "20px", height: "2px", background: menuOpen ? "var(--ink)" : "var(--muted)", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: menuOpen ? "var(--ink)" : "var(--muted)", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: menuOpen ? "var(--ink)" : "var(--muted)", borderRadius: "2px" }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu — <768px only */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            background: "var(--canvas)", borderTop: "0.5px solid var(--border)",
            padding: "0.75rem 1.5rem 1rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.page}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "15px", fontWeight: 400,
                color: activePage === l.page ? "var(--ink)" : "var(--muted)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
          {sportTag && (
            <Link href={`/?sport=${sportTag.toLowerCase()}`} onClick={() => setMenuOpen(false)}
              style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              View today&#8217;s {sportTag} slate
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
