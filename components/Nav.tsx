"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tier } from "@/lib/tier";

type ActivePage = "today" | "how-it-works" | "glossary" | "line-translator" | "my-breakdowns";

interface NavProps {
  backHref?: string;
  backLabel?: string;
  activePage?: ActivePage;
}

const LINKS: { href: string; label: string; page: ActivePage; proOnly?: boolean }[] = [
  { href: "/intel",                  label: "Today's Intel",   page: "today" },
  { href: "/how-it-works",          label: "How It Works",    page: "how-it-works" },
  { href: "/glossary",              label: "Glossary",        page: "glossary" },
  { href: "/tools/line-translator", label: "Line Translator", page: "line-translator" },
  { href: "/my-breakdowns",         label: "My Breakdowns",   page: "my-breakdowns", proOnly: true },
];

export default function Nav({ backHref, backLabel = "Today's Intel", activePage }: NavProps) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function loadTier(userId: string) {
      const { data } = await supabase.from("profiles").select("tier").eq("id", userId).maybeSingle();
      setTier((data?.tier as Tier | undefined) ?? "free");
    }
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setAuthReady(true);
      if (data.user) loadTier(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setAuthReady(true);
      if (session?.user) loadTier(session.user.id);
      else setTier(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayEmail = email && email.length > 24
    ? `${email.slice(0, email.indexOf("@") > 9 ? 9 : email.indexOf("@"))}…${email.slice(email.indexOf("@"))}`
    : email;

  const isBackMode = !!backHref;

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(248,246,242,0.96)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-med)",
      padding: "0 40px",
      height: "54px",
      display: "flex",
      alignItems: "center",
    }}>
      {/* Back mode — breakdown page */}
      {isBackMode ? (
        <>
          <Link href={backHref!} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--muted)",
            textDecoration: "none",
            padding: "6px 10px 6px 4px",
            borderRight: "1px solid var(--border-med)",
            marginRight: "16px",
            transition: "color 0.12s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            ← {backLabel}
          </Link>
          <Link href="/" style={{
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textDecoration: "none",
            color: "var(--ink)",
            flexShrink: 0,
          }}>
            Raw<span style={{ color: "var(--muted-light)", fontWeight: 500 }}>Intel</span><span style={{ color: "var(--signal)" }}>.</span>
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            {authReady && email && (
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted-light)" }}>
                {displayEmail}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Standard nav */}
          <Link href="/" style={{
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textDecoration: "none",
            color: "var(--ink)",
            paddingRight: "24px",
            borderRight: "1px solid var(--border-med)",
            marginRight: "20px",
            flexShrink: 0,
          }}>
            Raw<span style={{ color: "var(--muted-light)", fontWeight: 500 }}>Intel</span><span style={{ color: "var(--signal)" }}>.</span>
          </Link>

          {/* Nav links — desktop */}
          <ul className="hidden md:flex" style={{ gap: "2px", listStyle: "none", flex: 1, margin: 0, padding: 0 }}>
            {LINKS.filter((l) => !l.proOnly || tier === "pro").map((l) => (
              <li key={l.page}>
                <Link href={l.href} style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: activePage === l.page ? "var(--ink)" : "var(--muted)",
                  textDecoration: "none",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  display: "block",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (activePage !== l.page) {
                    (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                    (e.currentTarget as HTMLElement).style.background = "var(--cream)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== l.page) {
                    (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side — desktop */}
          <div className="hidden md:flex" style={{ marginLeft: "auto", alignItems: "center", gap: "16px" }}>
            {authReady && (email ? (
              <>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted-light)" }}>
                  {displayEmail}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "12.5px", fontWeight: 500, color: "var(--muted)",
                    transition: "color 0.12s", padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  fontSize: "12.5px", fontWeight: 500, color: "var(--muted)",
                  textDecoration: "none", padding: "7px 16px", borderRadius: "5px",
                  border: "1px solid var(--border-med)", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-med)";
                }}
                >
                  Log in
                </Link>
                <Link href="/login?mode=signup" style={{
                  fontSize: "12.5px", fontWeight: 600, color: "#fff",
                  textDecoration: "none", padding: "7px 18px", borderRadius: "5px",
                  background: "var(--signal)", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#b02e24")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--signal)")}
                >
                  Start free
                </Link>
              </>
            ))}
          </div>

          {/* Hamburger — mobile */}
          <div className="md:hidden" style={{ marginLeft: "auto" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "4px", display: "flex", flexDirection: "column",
                gap: "5px", alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: "block", width: "20px", height: "2px",
                  background: "var(--muted)", borderRadius: "2px",
                }} />
              ))}
            </button>
          </div>
        </>
      )}

      {/* Mobile dropdown */}
      {menuOpen && !isBackMode && (
        <div className="md:hidden" style={{
          position: "absolute", top: "54px", left: 0, right: 0,
          background: "var(--warm-white)", borderTop: "1px solid var(--border-med)",
          padding: "0.75rem 1.5rem 1rem",
          display: "flex", flexDirection: "column", gap: "0.75rem",
          boxShadow: "0 8px 24px rgba(17,17,16,0.08)",
        }}>
          {LINKS.filter((l) => !l.proOnly || tier === "pro").map((l) => (
            <Link key={l.page} href={l.href} onClick={() => setMenuOpen(false)} style={{
              fontSize: "15px", fontWeight: activePage === l.page ? 600 : 400,
              color: activePage === l.page ? "var(--ink)" : "var(--muted)",
              textDecoration: "none",
            }}>
              {l.label}
            </Link>
          ))}
          {authReady && (email ? (
            <>
              <Link href="/account" onClick={() => setMenuOpen(false)} style={{ fontSize: "12px", color: "var(--muted-light)", fontFamily: "var(--mono)", textDecoration: "none" }}>
                {displayEmail}
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "var(--ink)", padding: 0, textAlign: "left" }}
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{
              fontSize: "15px", fontWeight: 500, color: "var(--signal)", textDecoration: "none",
            }}>
              Log in
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
