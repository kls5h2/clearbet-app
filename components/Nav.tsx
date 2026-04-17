"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

interface NavProps {
  backHref?: string;
  backLabel?: string;
  sportTag?: string;
  activePage?: "how-it-works" | "glossary";
}

export default function Nav({ backHref, backLabel = "Back", sportTag, activePage }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--canvas)",
        borderBottom: "0.5px solid var(--border)",
        height: "60px",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "60px",
          padding: "0 1.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Left side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {backHref && (
            <>
              <Link
                href={backHref}
                style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
              >
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>←</span>
                <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--muted)" }}>
                  {backLabel}
                </span>
              </Link>
              <div style={{ width: "0.5px", height: "14px", background: "var(--border)" }} />
            </>
          )}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
        </div>

        {/* Right side — nav links + sport tag (desktop) + hamburger (mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Desktop nav links */}
          <div className="hidden sm:flex" style={{ gap: "1.5rem", alignItems: "center" }}>
            <Link
              href="/how-it-works"
              style={{
                fontSize: "13px", fontWeight: 400,
                color: "var(--ink)",
                opacity: activePage === "how-it-works" ? 1 : 0.7,
                textDecoration: "none",
              }}
            >
              How It Works
            </Link>
            <Link
              href="/glossary"
              style={{
                fontSize: "13px", fontWeight: 400,
                color: "var(--ink)",
                opacity: activePage === "glossary" ? 1 : 0.7,
                textDecoration: "none",
              }}
            >
              Glossary
            </Link>
            {sportTag && (
              <Link href={`/?sport=${sportTag}`} style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--muted)",
                }}>
                  {sportTag}
                </span>
              </Link>
            )}
          </div>

          {/* Hamburger button (mobile only) */}
          <button
            className="sm:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
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

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden"
          style={{
            background: "var(--canvas)",
            borderTop: "0.5px solid var(--border)",
            padding: "0.75rem 1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <Link href="/how-it-works" onClick={() => setMenuOpen(false)}
            style={{ fontSize: "15px", fontWeight: 400, color: activePage === "how-it-works" ? "var(--ink)" : "var(--muted)", textDecoration: "none" }}>
            How It Works
          </Link>
          <Link href="/glossary" onClick={() => setMenuOpen(false)}
            style={{ fontSize: "15px", fontWeight: 400, color: activePage === "glossary" ? "var(--ink)" : "var(--muted)", textDecoration: "none" }}>
            Glossary
          </Link>
          {sportTag && (
            <Link href={`/?sport=${sportTag}`} onClick={() => setMenuOpen(false)}
              style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {sportTag}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
