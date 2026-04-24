"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

type Interval = "monthly" | "annual";

export default function PricingPage() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
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

  const freeBullets = [
    "1 breakdown per day",
    "NBA games only",
    "Signal Grade letter",
    "Line Translator (always free)",
  ];
  const proBullets = [
    "Full NBA + MLB coverage — every game on the slate",
    "Your complete breakdown archive — filter by sport, date, outcome",
    "Outcome tracking (W / L / Push / No Action) on every breakdown",
    "Signal Grade with 4-factor detail",
    "Share cards for any game",
    "Regenerate any breakdown",
    "Unlimited breakdowns",
  ];

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      <div style={{ background: "var(--ink)", minHeight: "280px", padding: "72px 24px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "16px" }}>
            Pricing
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0 }}>
            Read the game.<br />Make your own call.
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            Start free. Upgrade when you&#8217;re ready for the full slate.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 0" }}>
        {/* Interval toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "32px" }}>
          {(["monthly", "annual"] as Interval[]).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              style={{
                fontFamily: "var(--sans)", fontSize: "12px", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "8px 20px", borderRadius: "4px", cursor: "pointer",
                border: interval === i ? "none" : "0.5px solid var(--border)",
                background: interval === i ? "var(--ink)" : "transparent",
                color: interval === i ? "#FAFAFA" : "var(--ink)",
                opacity: interval === i ? 1 : 0.7,
                transition: "opacity 150ms ease, background 150ms ease",
              }}
            >
              {i === "monthly" ? "Monthly" : "Annual · save 34%"}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {/* Free */}
          <div style={{
            background: "var(--paper)", border: "0.5px solid var(--border)",
            borderRadius: "6px", padding: "28px 26px",
          }}>
            <p style={{ fontFamily: "var(--sans)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px" }}>
              Free
            </p>
            <p style={{ fontFamily: "var(--serif)", fontSize: "40px", fontWeight: 500, color: "var(--ink)", margin: 0, marginBottom: "4px", lineHeight: 1 }}>
              $0
            </p>
            <p style={{ fontFamily: "var(--sans)", fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
              Start here. No card required.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "24px" }}>
              {freeBullets.map((b) => (
                <li key={b} style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--ink)", lineHeight: 1.7 }}>
                  · {b}
                </li>
              ))}
            </ul>
            <Link href="/login" style={{
              display: "block", textAlign: "center",
              background: "transparent", color: "var(--ink)",
              border: "0.5px solid var(--border)", borderRadius: "4px",
              fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
              letterSpacing: "0.04em", padding: "12px 24px", textDecoration: "none",
            }}>
              Get started
            </Link>
          </div>

          {/* Pro */}
          <div style={{
            background: "var(--ink)", border: "0.5px solid var(--ink)",
            borderRadius: "6px", padding: "28px 26px",
            position: "relative",
          }}>
            <p style={{ fontFamily: "var(--sans)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal)", marginBottom: "10px" }}>
              Pro
            </p>
            <p style={{ fontFamily: "var(--serif)", fontSize: "40px", fontWeight: 500, color: "#FAFAFA", margin: 0, marginBottom: "4px", lineHeight: 1 }}>
              {interval === "monthly" ? "$9.99" : "$79"}
              <span style={{ fontFamily: "var(--sans)", fontSize: "14px", fontWeight: 400, color: "#9A9A96", marginLeft: "6px" }}>
                /{interval === "monthly" ? "mo" : "yr"}
              </span>
            </p>
            <p style={{ fontFamily: "var(--sans)", fontSize: "13px", color: "#9A9A96", marginBottom: "20px" }}>
              {interval === "monthly" ? "Cancel anytime." : "About $6.58/month. Cancel anytime."}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "24px" }}>
              {proBullets.map((b) => (
                <li key={b} style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "#FAFAFA", lineHeight: 1.7 }}>
                  · {b}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={busy}
              style={{
                display: "block", width: "100%", textAlign: "center",
                background: "var(--signal)", color: "#FAFAFA",
                border: "none", borderRadius: "4px",
                fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                letterSpacing: "0.04em", padding: "12px 24px",
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {busy ? "Loading…" : "Upgrade now"}
            </button>
            {error && (
              <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--signal)", textAlign: "center" }}>
                {error}
              </p>
            )}
          </div>
        </div>

        <p style={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "32px", lineHeight: 1.6 }}>
          RawIntel is decision support, not a picks service. Bet responsibly.
        </p>
      </div>
    </div>
  );
}
