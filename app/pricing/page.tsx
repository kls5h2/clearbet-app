"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

export default function PricingPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function handleUpgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: "monthly" }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/pricing";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Checkout failed");
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav />

      {/* HERO BAND */}
      <div
        className="f2"
        style={{
          background: "var(--ink)",
          padding: "40px 40px 44px",
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
          Pricing
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fff",
            lineHeight: 1.05,
            marginBottom: 12,
            fontFamily: "var(--sans)",
          }}
        >
          Start free.
          <br />
          Go deeper{" "}
          <span style={{ color: "var(--signal)" }}>when you're ready.</span>
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          One free breakdown every day, no card required. Upgrade when one
          isn't enough.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 40px 80px" }}>

        {/* THE PITCH */}
        <div className="f3" style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "var(--ink)",
              fontFamily: "var(--sans)",
            }}
          >
            <span style={{ display: "block" }}>Read every game.</span>
            <span style={{ display: "block" }}>Understand every grade.</span>
            <span
              style={{
                display: "block",
                color: "var(--muted-light)",
                fontWeight: 300,
                fontStyle: "italic",
              }}
            >
              See the full picture.
            </span>
          </div>
          <p
            style={{
              fontSize: 15,
              color: "var(--muted)",
              lineHeight: 1.65,
              maxWidth: 440,
              margin: "16px auto 0",
            }}
          >
            Start free. You'll know when you're ready.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div
          className="f3 grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: 16, marginBottom: 48 }}
        >
          {/* FREE CARD */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border-med)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                padding: "28px 28px 24px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 16,
                }}
              >
                Free
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: "var(--ink)",
                  }}
                >
                  $0
                </div>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--muted)",
                  lineHeight: 1.55,
                }}
              >
                One breakdown a day. Enough to learn how this works and decide
                if you want more.
              </div>
            </div>

            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Link
                href="/login?mode=signup"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  textDecoration: "none",
                  padding: "12px 20px",
                  borderRadius: 6,
                  border: "1.5px solid var(--border-strong)",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--cream)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "transparent")
                }
              >
                Create free account
              </Link>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  color: "var(--muted-light)",
                  textAlign: "center",
                  marginTop: 10,
                  letterSpacing: "0.03em",
                }}
              >
                No card required · Always free
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted-light)",
                  marginBottom: 16,
                }}
              >
                What's included
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {(
                  [
                    {
                      yes: true,
                      node: (
                        <>
                          <strong
                            style={{
                              fontWeight: 600,
                              color: "var(--ink)",
                            }}
                          >
                            1 breakdown per day
                          </strong>{" "}
                          — your pick, any game on the slate
                        </>
                      ),
                    },
                    {
                      yes: true,
                      node: "Full six-step analysis — same quality, every time",
                    },
                    {
                      yes: true,
                      node: "Confidence level on every game",
                    },
                    { yes: true, node: "Glossary & How It Works" },
                    { yes: true, node: "Line Translator" },
                    {
                      yes: false,
                      node: "Signal Grade detail (4-factor breakdown)",
                    },
                    {
                      yes: false,
                      node: "Full slate — every game, every night",
                    },
                    {
                      yes: false,
                      node: "My Breakdowns — your full history",
                    },
                  ] as { yes: boolean; node: React.ReactNode }[]
                ).map((item, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                        fontSize: 10,
                        fontWeight: 700,
                        background: item.yes
                          ? "rgba(26,122,72,0.12)"
                          : "rgba(17,17,16,0.05)",
                        color: item.yes ? "#1A7A48" : "var(--muted-light)",
                      }}
                    >
                      {item.yes ? "✓" : "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: item.yes ? "var(--ink-2)" : "var(--muted-light)",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.node}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PRO CARD */}
          <div
            style={{
              background: "var(--ink)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
              position: "relative",
            }}
          >
            {/* glow */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-40%",
                left: "-20%",
                width: "80%",
                height: "80%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(201,53,42,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                padding: "28px 28px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--signal)",
                  marginBottom: 16,
                }}
              >
                Pro
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: "#fff",
                  }}
                >
                  $9.99
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  / month
                </div>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.55,
                }}
              >
                The full product. Every game, every night, every breakdown
                you've ever run.
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(201,53,42,0.12)",
                  border: "1px solid rgba(201,53,42,0.2)",
                  borderRadius: 4,
                  padding: "4px 10px",
                  marginTop: 12,
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--signal)",
                  letterSpacing: "0.04em",
                }}
              >
                Less than $0.34 a day
              </div>
            </div>

            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <button
                onClick={handleUpgrade}
                disabled={busy}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  padding: "13px 20px",
                  borderRadius: 6,
                  background: "var(--signal)",
                  border: "none",
                  cursor: busy ? "default" : "pointer",
                  transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: "0 2px 12px rgba(201,53,42,0.3)",
                  position: "relative",
                  zIndex: 1,
                  opacity: busy ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!busy) {
                    (e.currentTarget as HTMLElement).style.background =
                      "#b02e24";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-1px)";
                    (
                      e.currentTarget as HTMLElement
                    ).style.boxShadow =
                      "0 4px 20px rgba(201,53,42,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--signal)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 12px rgba(201,53,42,0.3)";
                }}
              >
                {busy ? "Loading…" : "Upgrade to Pro"}
              </button>
              {error && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--signal)",
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
              )}
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.22)",
                  textAlign: "center",
                  marginTop: 10,
                  letterSpacing: "0.03em",
                }}
              >
                Cancel anytime · No contracts
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 16,
                }}
              >
                Everything in Free, plus
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {(
                  [
                    <>
                      <strong style={{ fontWeight: 600, color: "#fff" }}>
                        Unlimited breakdowns
                      </strong>{" "}
                      — the whole board, every night
                    </>,
                    <>
                      <strong style={{ fontWeight: 600, color: "#fff" }}>
                        Signal Grade detail
                      </strong>{" "}
                      — see the four factors behind every grade, not just the
                      letter
                    </>,
                    <>
                      <strong style={{ fontWeight: 600, color: "#fff" }}>
                        My Breakdowns
                      </strong>{" "}
                      — every breakdown you've ever run, filterable by sport,
                      date, and outcome
                    </>,
                    "Full confidence level breakdown on every game",
                    "NBA & MLB covered every day of the season",
                  ] as React.ReactNode[]
                ).map((node, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(201,53,42,0.15)",
                        color: "var(--signal)",
                      }}
                    >
                      ✓
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: "rgba(255,255,255,0.7)",
                        lineHeight: 1.45,
                      }}
                    >
                      {node}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NFL STRIP */}
        <div
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="reveal"
          style={{
            background: "var(--surface)",
            borderRadius: 10,
            border: "1px solid var(--border-med)",
            boxShadow: "var(--shadow-sm)",
            marginBottom: 48,
          }}
        >
          <div
            style={{
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 7,
                  background: "var(--cream)",
                  border: "1px solid var(--border-med)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                🏈
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 2,
                  }}
                >
                  Coming Soon
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  NFL breakdowns — included with Pro at no extra cost
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--signal)",
                letterSpacing: "0.04em",
                background: "rgba(201,53,42,0.08)",
                border: "1px solid rgba(201,53,42,0.15)",
                padding: "6px 14px",
                borderRadius: 4,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Season begins Sept 9, 2026
            </div>
          </div>
        </div>

        {/* CLOSING STRIP */}
        <div
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="reveal rd1"
          style={{
            background: "var(--ink)",
            borderRadius: 10,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div
            style={{
              padding: "32px 36px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--signal)",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 1,
                  background: "var(--signal)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Our standard
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#fff",
                lineHeight: 1.35,
                marginBottom: 8,
              }}
            >
              No pressure.
              <br />
              No tricks.
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.6,
              }}
            >
              Cancel anytime — no questions, no hoops. This product only works
              if you trust it.
            </div>
          </div>
          <div style={{ padding: "32px 36px" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--signal)",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 1,
                  background: "var(--signal)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              The breakdown
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#fff",
                lineHeight: 1.35,
                marginBottom: 8,
              }}
            >
              Raw data.
              <br />
              Clear read.
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.6,
              }}
            >
              The same standard, every game, every night.
            </div>
          </div>
        </div>
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
  );
}
