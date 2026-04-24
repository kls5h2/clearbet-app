"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";
type Status = "idle" | "submitting" | "sent" | "error";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus("idle");
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      setStatus("error");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const supabase = createClient();

      if (mode === "signin") {
        const { error: sbError } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (sbError) throw new Error(sbError.message);
        router.push(next);
        router.refresh();
        return;
      }

      // signup
      const { data, error: sbError } = await supabase.auth.signUp({
        email: trimmed,
        password,
      });
      if (sbError) throw new Error(sbError.message);

      // If email confirmation is disabled in Supabase, a session is returned
      // immediately — redirect. Otherwise, show the "check your email" state.
      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const isSignup = mode === "signup";
  const heading = isSignup ? "Create your account." : "Welcome back.";
  const eyebrow = isSignup ? "Sign Up" : "Log In";
  const subhead = isSignup
    ? "Start with 3 free breakdowns per week. Upgrade anytime."
    : "Sign in with your email and password.";

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
            {eyebrow}
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0 }}>
            {heading}
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            {subhead}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "48px 24px 0" }}>
        {status === "sent" ? (
          <div style={{ background: "var(--paper)", border: "0.5px solid var(--border)", borderLeft: "3px solid var(--signal)", borderRadius: "6px", padding: "20px 22px" }}>
            <p style={{ fontFamily: "var(--sans)", fontSize: "14px", fontWeight: 500, color: "var(--ink)", marginBottom: "6px" }}>Confirm your email</p>
            <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              We sent a confirmation link to <strong style={{ color: "var(--ink)" }}>{email}</strong>. Click it to activate your account, then come back and sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />

            <label htmlFor="password" style={{ ...labelStyle, marginTop: "18px" }}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              required
              minLength={8}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />

            {isSignup && (
              <>
                <label htmlFor="confirm-password" style={{ ...labelStyle, marginTop: "18px" }}>Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={8}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                marginTop: "20px", width: "100%",
                background: "var(--signal)", color: "#FAFAFA",
                border: "none", borderRadius: "4px",
                fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                letterSpacing: "0.04em", padding: "14px 24px",
                cursor: status === "submitting" ? "default" : "pointer",
                opacity: status === "submitting" ? 0.6 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {status === "submitting"
                ? (isSignup ? "Creating account…" : "Signing in…")
                : (isSignup ? "Create account" : "Sign in")}
            </button>

            {status === "error" && error && (
              <p style={{ marginTop: "14px", fontSize: "13px", color: "var(--signal)", textAlign: "center" }}>{error}</p>
            )}

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--sans)", fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(isSignup ? "signin" : "signup")}
                  style={{
                    background: "transparent", border: "none", padding: 0,
                    color: "var(--signal)", fontFamily: "var(--sans)", fontSize: "13px",
                    fontWeight: 500, cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  {isSignup ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--sans)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--paper)",
  border: "0.5px solid var(--border)",
  borderRadius: "4px",
  padding: "14px 18px",
  fontFamily: "var(--sans)",
  fontSize: "16px",
  color: "var(--ink)",
  outline: "none",
  transition: "border-color 150ms ease",
};
