"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Admin gate — client-side only, swap for real session check when auth lands
const ADMIN_EMAIL = "KimLynnSharp@gmail.com";
const STORAGE_KEY = "rawintel_admin_auth";

interface BreakdownRow {
  game_id: string;
  game_date: string;
  sport: string;
  home_team: string;
  away_team: string;
  confidence_label: string | null;
}

interface RepurposeResult {
  tweet_thread: string[];
  substack_excerpt: string;
  one_line_stat: string;
  learn_page_slug: string;
}

function getTodayDateString(): string {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}

export default function RepurposePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [breakdowns, setBreakdowns] = useState<BreakdownRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepurposeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setAuthed(stored === ADMIN_EMAIL);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const todayStr = getTodayDateString();
    Promise.resolve(
      supabase
        .from("breakdowns")
        .select("game_id, game_date, sport, home_team, away_team, confidence_label")
        .eq("game_date", todayStr)
        .order("created_at", { ascending: false })
    ).then(({ data }) => {
      setBreakdowns((data ?? []) as BreakdownRow[]);
    }).catch(() => {});
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const val = emailInput.trim().toLowerCase();
    if (val === ADMIN_EMAIL.toLowerCase()) {
      localStorage.setItem(STORAGE_KEY, ADMIN_EMAIL);
      setAuthed(true);
      setLoginError(null);
    } else {
      setLoginError("Not authorized");
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setBreakdowns([]);
    setResult(null);
    setSelectedId(null);
    setEmailInput("");
  }

  async function handleGenerate(breakdownId: string) {
    setSelectedId(breakdownId);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breakdownId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to generate");
      }
      const data = (await res.json()) as RepurposeResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Mount gate
  if (authed === null) {
    return <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)" }}>Loading…</div>;
  }

  if (!authed) {
    return (
      <div style={{ background: "var(--canvas)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.025em", marginBottom: "20px" }}>
            Content Engine
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "18px" }}>
            Admin access required.
          </p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email"
              autoFocus
              style={{
                background: "var(--paper)", border: "0.5px solid var(--border)",
                borderRadius: "4px", padding: "12px 16px",
                fontFamily: "var(--sans)", fontSize: "14px", color: "var(--ink)",
                outline: "none",
              }}
            />
            <button type="submit" style={{
              background: "var(--ink)", color: "#FAFAFA", border: "none",
              borderRadius: "4px", padding: "12px 16px",
              fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
              letterSpacing: "0.04em", cursor: "pointer",
            }}>
              Enter
            </button>
          </form>
          {loginError && <p style={{ marginTop: "10px", fontSize: "12px", color: "var(--signal)" }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: 500,
            color: "var(--ink)", letterSpacing: "-0.025em", margin: 0,
          }}>
            Content Engine
          </h1>
          <button onClick={handleLogout} style={{
            background: "none", border: "none", padding: 0,
            fontSize: "12px", color: "var(--muted)", cursor: "pointer",
          }}>
            Sign out
          </button>
        </div>

        {/* Breakdown list */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink)", opacity: 0.5, marginBottom: "12px" }}>
            Today&#8217;s breakdowns
          </h2>
          {breakdowns.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>No breakdowns found for today.</p>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {breakdowns.map((b) => {
                const active = selectedId === b.game_id;
                return (
                  <button
                    key={b.game_id}
                    onClick={() => handleGenerate(b.game_id)}
                    disabled={loading}
                    style={{
                      textAlign: "left",
                      background: active ? "#EFEDE7" : "var(--paper)",
                      border: `0.5px solid ${active ? "rgba(14,14,14,0.2)" : "var(--border)"}`,
                      borderRadius: "6px",
                      padding: "14px 18px",
                      cursor: loading ? "default" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>
                      {b.away_team} at {b.home_team}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {b.sport} · {b.confidence_label ?? "—"} · <span style={{ fontFamily: "var(--sans)" }}>{b.game_id}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {loading && (
          <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
            Generating content…
          </p>
        )}

        {error && (
          <p style={{ fontSize: "13px", color: "var(--signal)" }}>
            {error}
          </p>
        )}

        {result && (
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Tweet thread */}
            <OutputBlock title="Tweet thread">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {result.tweet_thread.map((tweet, i) => (
                  <CopyRow key={i} label={`Tweet ${i + 1}`} value={tweet} showChars />
                ))}
                <CopyRow label="Full thread" value={result.tweet_thread.join("\n\n")} />
              </div>
            </OutputBlock>

            <OutputBlock title="Substack excerpt">
              <CopyRow value={result.substack_excerpt} />
            </OutputBlock>

            <OutputBlock title="One-line stat">
              <CopyRow value={result.one_line_stat} />
            </OutputBlock>

            <OutputBlock title="Learn page">
              <CopyRow
                label="Slug"
                value={result.learn_page_slug}
              />
              <CopyRow
                label="URL"
                value={`https://rawintel.ai/learn/${result.learn_page_slug}`}
              />
            </OutputBlock>
          </section>
        )}
      </div>
    </div>
  );
}

function OutputBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--paper)",
      border: "0.5px solid var(--border)",
      borderRadius: "6px",
      padding: "18px 20px",
    }}>
      <h3 style={{
        fontSize: "11px", textTransform: "uppercase",
        letterSpacing: "0.1em", color: "var(--ink)", opacity: 0.5,
        marginBottom: "12px", fontWeight: 500,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function CopyRow({ label, value, showChars = false }: { label?: string; value: string; showChars?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {label && (
          <p style={{
            fontSize: "10px", fontWeight: 500, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "4px",
          }}>
            {label}{showChars ? ` · ${value.length} chars` : ""}
          </p>
        )}
        <p style={{
          fontSize: "14px", color: "var(--ink)",
          lineHeight: 1.55, margin: 0,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {value}
        </p>
      </div>
      <button
        onClick={copy}
        style={{
          flexShrink: 0,
          background: copied ? "var(--ink)" : "transparent",
          color: copied ? "#FAFAFA" : "var(--ink)",
          border: "0.5px solid var(--border)",
          borderRadius: "4px",
          padding: "6px 12px",
          fontFamily: "var(--sans)", fontSize: "11px", fontWeight: 500,
          cursor: "pointer",
          transition: "background 150ms ease, color 150ms ease",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
