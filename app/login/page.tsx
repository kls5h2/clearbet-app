"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: sbError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });
      if (sbError) throw new Error(sbError.message);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      {/* Dark hero — matches the standardized pattern */}
      <div style={{ background: "var(--ink)", minHeight: "280px", padding: "72px 24px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "16px" }}>
            Log In
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0 }}>
            Send yourself a magic link.
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            No password. We email you a one-click sign-in link.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "48px 24px 0" }}>
        {status === "sent" ? (
          <div style={{ background: "var(--paper)", border: "0.5px solid var(--border)", borderLeft: "3px solid var(--signal)", borderRadius: "6px", padding: "20px 22px" }}>
            <p style={{ fontFamily: "var(--sans)", fontSize: "14px", fontWeight: 500, color: "var(--ink)", marginBottom: "6px" }}>Check your email</p>
            <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              We sent a sign-in link to <strong style={{ color: "var(--ink)" }}>{email}</strong>. Click it from this device to finish logging in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" style={{ display: "block", fontFamily: "var(--sans)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
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
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                marginTop: "16px", width: "100%",
                background: "var(--signal)", color: "#FAFAFA",
                border: "none", borderRadius: "4px",
                fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                letterSpacing: "0.04em", padding: "14px 24px",
                cursor: status === "sending" ? "default" : "pointer",
                opacity: status === "sending" ? 0.6 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {status === "error" && error && (
              <p style={{ marginTop: "14px", fontSize: "13px", color: "var(--signal)", textAlign: "center" }}>{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
