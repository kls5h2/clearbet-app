"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { createClient } from "@/lib/supabase/client";
import type { Tier } from "@/lib/tier";

type ActivePage = "today" | "how-it-works" | "glossary" | "line-translator" | "my-breakdowns";

interface NavProps {
  backHref?: string;
  backLabel?: string;
  sportTag?: string;
  activePage?: ActivePage;
}

const LINKS: { href: string; label: string; page: ActivePage; proOnly?: boolean }[] = [
  { href: "/",                        label: "Today's Intel",   page: "today" },
  { href: "/how-it-works",            label: "How It Works",    page: "how-it-works" },
  { href: "/glossary",                label: "Glossary",        page: "glossary" },
  { href: "/tools/line-translator",   label: "Line Translator", page: "line-translator" },
  { href: "/my-breakdowns",           label: "My Breakdowns",   page: "my-breakdowns", proOnly: true },
];

export default function Nav({ backHref, backLabel = "Back", sportTag, activePage }: NavProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadTier(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .maybeSingle();
      setTier((data?.tier as Tier | undefined) ?? "free");
    }

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setEmail(user?.email ?? null);
      setAuthReady(true);
      if (user) loadTier(user.id);
      else setTier(null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setEmail(user?.email ?? null);
      setAuthReady(true);
      if (user) loadTier(user.id);
      else setTier(null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Shorten long emails for display: "long-user@example.com" → "long-u…@example.com"
  const displayEmail = email && email.length > 22
    ? `${email.slice(0, email.indexOf("@") > 8 ? 8 : email.indexOf("@"))}…${email.slice(email.indexOf("@"))}`
    : email;

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
        {/* Left: back link + logo — flex:1 so left/center/right share space evenly */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
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

        {/* Center: nav links — flex:1 with justify-content:center for true centering */}
        <nav className="hidden md:flex" style={{ flex: 1, gap: "1.5rem", alignItems: "center", justifyContent: "center" }}>
          {LINKS.filter((l) => !l.proOnly || tier === "pro").map((l) => (
            <Link key={l.page} href={l.href} style={linkStyle(l.page)}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: sport tag + auth — flex:1 with justify-content:flex-end */}
        <div className="hidden md:flex" style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: "1.5rem" }}>
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
          {authReady && (email ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link href="/dashboard" style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none", whiteSpace: "nowrap" }}>
                {displayEmail}
              </Link>
              <button
                onClick={handleLogout}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--ink)", opacity: 0.7, padding: 0 }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                fontSize: "13px", fontWeight: 500,
                color: "var(--signal)", textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              Log In
            </Link>
          ))}
        </div>

        {/* Hamburger button — mobile only, <768px.
            Wrapper carries md:hidden so inline display:flex on the button doesn't override it. */}
        <div className="md:hidden">
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
          {LINKS.filter((l) => !l.proOnly || tier === "pro").map((l) => (
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

          {/* Auth action — mirrored from desktop nav */}
          {authReady && (email ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "none" }}>
                {displayEmail}
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "var(--ink)", padding: 0, textAlign: "left" }}
              >
                Log Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "15px", fontWeight: 500, color: "var(--signal)", textDecoration: "none" }}>
              Log In
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
