"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

type TranslateStatus = "idle" | "loading" | "done" | "error";
type WaitlistStatus = "idle" | "submitting" | "done" | "error";

export default function LineTranslatorClient() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("idle");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setStatus("loading");
    setError(null);
    setTranslation(null);
    try {
      const res = await fetch("/api/line-translator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Translation failed");
      }
      const data = await res.json();
      setTranslation(data.translation ?? "");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setWaitlistError("Enter a valid email");
      setWaitlistStatus("error");
      return;
    }
    setWaitlistStatus("submitting");
    setWaitlistError(null);
    try {
      const { error: sbError } = await supabase.from("waitlist").insert({
        email: trimmed,
        source: "line-translator",
      });
      if (sbError) throw new Error(sbError.message);
      setWaitlistStatus("done");
      setEmail("");
    } catch (err) {
      console.error("[waitlist] insert failed:", err);
      setWaitlistError("Couldn't save your email. Try again in a moment.");
      setWaitlistStatus("error");
    }
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      {/* Dark hero — standardized */}
      <div style={{ background: "var(--ink)", minHeight: "280px", padding: "72px 40px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto", width: "100%" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "16px" }}>
            Line Translator
          </p>
          <h1 style={{
            fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500,
            color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0,
          }}>
            What does that line actually mean?
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", maxWidth: "520px", lineHeight: 1.6, marginTop: "16px", marginBottom: 0 }}>
            Paste any betting line — spread, moneyline, total, prop, or player stat. Get plain English back. No account needed.
          </p>
        </div>
      </div>

      {/* Input + result */}
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 24px 0" }}>
        <form onSubmit={handleTranslate}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. -110, Celtics -7.5, LaMelo 24.5 PRAs, Ohtani to hit a HR"
            maxLength={200}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "var(--paper)", border: "0.5px solid var(--border)",
              borderRadius: "4px", padding: "14px 18px",
              fontFamily: "var(--sans)", fontSize: "16px", color: "var(--ink)",
              outline: "none", transition: "border-color 150ms ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: "14px" }}>
            <button
              type="submit"
              disabled={status === "loading" || !input.trim()}
              style={{
                background: "var(--signal)", color: "#FAFAFA",
                border: "none", borderRadius: "4px",
                fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                letterSpacing: "0.04em", padding: "12px 24px",
                cursor: status === "loading" || !input.trim() ? "default" : "pointer",
                opacity: status === "loading" || !input.trim() ? 0.6 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {status === "loading" ? "Translating…" : "Translate it"}
            </button>
          </div>
        </form>

        {/* Error */}
        {status === "error" && error && (
          <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--signal)" }}>
            {error}
          </p>
        )}

        {/* Translation card — single container, all markdown renders inside */}
        {status === "done" && translation && (
          <div style={{
            marginTop: "28px",
            background: "var(--paper)",
            border: "0.5px solid var(--border)",
            borderLeft: "3px solid var(--signal)",
            borderRadius: "6px",
            padding: "22px 24px",
            fontFamily: "Georgia, serif", fontSize: "16px", color: "var(--ink)", lineHeight: 1.6,
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            <ReactMarkdown
              components={{
                // All block elements use margin: 0 so the flex gap handles spacing — no stacked-card illusion
                p: ({ children }) => <p style={{ margin: 0, lineHeight: 1.6 }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                ul: ({ children }) => <ul style={{ margin: 0, paddingLeft: "20px" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: 0, paddingLeft: "20px" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: "4px" }}>{children}</li>,
                h1: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: "18px" }}>{children}</p>,
                h2: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: "17px" }}>{children}</p>,
                h3: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: "16px" }}>{children}</p>,
                h4: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: "16px" }}>{children}</p>,
                blockquote: ({ children }) => <div style={{ margin: 0, paddingLeft: "12px", borderLeft: "2px solid var(--border)", color: "var(--muted)" }}>{children}</div>,
                hr: () => null, // Never inject a visual divider that fakes a second card
                code: ({ children }) => <code style={{ fontFamily: "var(--sans)", fontSize: "14px", background: "rgba(14,14,14,0.06)", padding: "1px 5px", borderRadius: "3px" }}>{children}</code>,
                pre: ({ children }) => <pre style={{ margin: 0, fontFamily: "var(--sans)", fontSize: "14px", background: "rgba(14,14,14,0.06)", padding: "10px 12px", borderRadius: "4px", overflowX: "auto" }}>{children}</pre>,
                a: ({ children, href }) => <a href={href} style={{ color: "var(--signal)", textDecoration: "underline" }}>{children}</a>,
              }}
            >
              {translation}
            </ReactMarkdown>
          </div>
        )}

        {/* CTA block — only after a successful translation */}
        {status === "done" && translation && (
          <div style={{ textAlign: "center", marginTop: "36px" }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>
              Want the full breakdown for today&#8217;s games?
            </p>
            <Link href="/" style={{
              display: "inline-block", background: "var(--signal)", color: "#FAFAFA",
              fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em",
              padding: "12px 24px", borderRadius: "4px", textDecoration: "none",
            }}>
              See today&#8217;s slate →
            </Link>
          </div>
        )}

        {/* Email capture */}
        <div style={{ marginTop: "56px", paddingTop: "32px", borderTop: "0.5px solid var(--border)" }}>
          {waitlistStatus === "done" ? (
            <p style={{ textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--signal)" }}>
              You&#8217;re on the list. We&#8217;ll reach out when we launch.
            </p>
          ) : (
            <form onSubmit={handleWaitlist} style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get notified when we launch"
                required
                style={{
                  flex: "1 1 280px", minWidth: 0, maxWidth: "360px",
                  background: "var(--paper)", border: "0.5px solid var(--border)",
                  borderRadius: "4px", padding: "12px 16px",
                  fontFamily: "var(--sans)", fontSize: "14px", color: "var(--ink)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="submit"
                disabled={waitlistStatus === "submitting"}
                style={{
                  background: "var(--ink)", color: "#FAFAFA",
                  border: "none", borderRadius: "4px",
                  fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.04em", padding: "12px 20px",
                  cursor: waitlistStatus === "submitting" ? "default" : "pointer",
                  opacity: waitlistStatus === "submitting" ? 0.6 : 1,
                }}
              >
                {waitlistStatus === "submitting" ? "Submitting…" : "Notify me"}
              </button>
            </form>
          )}
          {waitlistStatus === "error" && waitlistError && (
            <p style={{ marginTop: "10px", textAlign: "center", fontSize: "12px", color: "var(--signal)" }}>
              {waitlistError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
