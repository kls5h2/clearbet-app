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
        background: "#0D1B2E",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 1.5rem",
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
                <span style={{ fontSize: "14px", color: "#637A96" }}>←</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#637A96", letterSpacing: "0.04em" }}>
                  {backLabel}
                </span>
              </Link>
              <div style={{ width: "1px", height: "14px", background: "#2A3F5A" }} />
            </>
          )}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
        </div>

        {/* Center — sport tag, absolutely centered, clickable back to sport slate */}
        {sportTag && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Link
              href={`/?sport=${sportTag}`}
              style={{ textDecoration: "none" }}
              className="group"
            >
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#8FA3BC",
                  cursor: "pointer",
                }}
                className="group-hover:underline"
              >
                {sportTag}
              </span>
            </Link>
          </div>
        )}

        {/* Right side — nav links (desktop) + hamburger (mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Desktop nav links */}
          <div className="hidden sm:flex" style={{ gap: "1.25rem" }}>
            <Link
              href="/how-it-works"
              style={{
                fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em",
                color: activePage === "how-it-works" ? "#FFFFFF" : "#637A96",
                textDecoration: "none",
              }}
            >
              How It Works
            </Link>
            <Link
              href="/glossary"
              style={{
                fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em",
                color: activePage === "glossary" ? "#FFFFFF" : "#637A96",
                textDecoration: "none",
              }}
            >
              Glossary
            </Link>
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
            <span style={{ display: "block", width: "20px", height: "2px", background: menuOpen ? "#FFFFFF" : "#637A96", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: menuOpen ? "#FFFFFF" : "#637A96", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: menuOpen ? "#FFFFFF" : "#637A96", borderRadius: "2px" }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden"
          style={{
            background: "#0D1B2E",
            borderTop: "1px solid #2A3F5A",
            padding: "0.75rem 1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <Link
            href="/how-it-works"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: "15px", fontWeight: 600,
              color: activePage === "how-it-works" ? "#FFFFFF" : "#8FA3BC",
              textDecoration: "none",
            }}
          >
            How It Works
          </Link>
          <Link
            href="/glossary"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: "15px", fontWeight: 600,
              color: activePage === "glossary" ? "#FFFFFF" : "#8FA3BC",
              textDecoration: "none",
            }}
          >
            Glossary
          </Link>
        </div>
      )}
    </header>
  );
}
