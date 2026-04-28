"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const next = searchParams.get("next") ?? "/";
  const initialMode: Mode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
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

      const { data, error: sbError } = await supabase.auth.signUp({
        email: trimmed,
        password,
      });
      if (sbError) throw new Error(sbError.message);

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
  const submitting = status === "submitting";

  return (
    <div
      className="grid md:grid-cols-2"
      style={{ minHeight: "100vh", background: "var(--ink)" }}
    >
      {/* LEFT PANEL */}
      <div
        className="f1 hidden md:flex"
        style={{
          background: "var(--ink)",
          padding: 48,
          flexDirection: "column",
          justifyContent: "flex-start",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: "70%",
            height: "70%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,53,42,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* watermark R */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-8%",
            bottom: "-5%",
            fontSize: 420,
            fontWeight: 900,
            letterSpacing: "-0.05em",
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

        {/* Brand */}
        <Link
          href="/"
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textDecoration: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 1,
            position: "relative",
            zIndex: 1,
          }}
        >
          Raw
          <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
            Intel
          </span>
          <span style={{ color: "var(--signal)" }}>.</span>
        </Link>

        {/* Copy — flex: 1 centers it between brand and proof */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}>
        <div>
          <div
            style={{
              fontSize: "clamp(28px, 3.5vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Raw data.
            <br />
            Clear read.
            <br />
            <span style={{ color: "var(--signal)" }}>Your call.</span>
          </div>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.65,
              maxWidth: 320,
            }}
          >
            The same structured breakdown on every game. No picks. No noise.
            Just the read — and the decision is always yours.
          </p>
        </div>
        </div>

        {/* Proof */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                strong: "One free breakdown every day.",
                rest: " Your pick, any game on the slate.",
              },
              {
                strong: "Six-step analysis",
                rest: " — game shape, key drivers, market read, and more.",
              },
              {
                strong: "No card required",
                rest: " to start. Upgrade when one isn't enough.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(201,53,42,0.15)",
                    color: "var(--signal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.45,
                  }}
                >
                  <strong
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 600,
                    }}
                  >
                    {item.strong}
                  </strong>
                  {item.rest}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="f2"
        style={{
          background: "var(--warm-white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile brand */}
          <Link
            href="/"
            className="md:hidden"
            style={{
              display: "block",
              marginBottom: 32,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            Raw
            <span style={{ color: "var(--muted-light)", fontWeight: 500 }}>
              Intel
            </span>
            <span style={{ color: "var(--signal)" }}>.</span>
          </Link>

          {status === "sent" ? (
            /* Email confirmation sent state */
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Check your email.
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                We sent a confirmation link to{" "}
                <strong style={{ color: "var(--ink)" }}>{email}</strong>. Click
                it to activate your account, then come back and sign in.
              </p>
              <button
                onClick={() => switchMode("signin")}
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--signal)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Back to sign in →
              </button>
            </div>
          ) : (
            <>
              {/* MODE TOGGLE */}
              <div
                style={{
                  display: "flex",
                  background: "var(--cream)",
                  borderRadius: 8,
                  padding: 3,
                  marginBottom: 32,
                }}
              >
                {(["signin", "signup"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: mode === m ? "var(--ink)" : "var(--muted)",
                      background:
                        mode === m
                          ? "var(--surface)"
                          : "transparent",
                      border: "none",
                      padding: "9px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow:
                        mode === m ? "var(--shadow-md)" : "none",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    {m === "signin" ? "Log in" : "Create account"}
                  </button>
                ))}
              </div>

              {/* Free callout — signup only */}
              {isSignup && (
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: 7,
                    border: "1px solid var(--border-med)",
                    padding: "12px 16px",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                    🎉
                  </span>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: "var(--ink)", fontWeight: 600 }}>
                      Free to start.
                    </strong>{" "}
                    One breakdown a day, no card required. Upgrade anytime.
                  </div>
                </div>
              )}

              {/* HEADER */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--ink)",
                    marginBottom: 6,
                  }}
                >
                  {isSignup ? "Start for free." : "Welcome back."}
                </div>
                <div
                  style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}
                >
                  {isSignup
                    ? "Create your account — no card required."
                    : "Sign in to access your breakdowns."}
                </div>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--ink-2)",
                      marginBottom: 6,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "var(--signal)";
                      (e.target as HTMLInputElement).style.boxShadow =
                        "0 0 0 3px rgba(201,53,42,0.08)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "var(--border-med)";
                      (e.target as HTMLInputElement).style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: isSignup ? 16 : 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      htmlFor="password"
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--ink-2)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      Password
                    </label>
                    {!isSignup && (
                      <Link
                        href="/forgot-password"
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--muted)",
                          textDecoration: "none",
                          transition: "color 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.color =
                            "var(--ink)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.color =
                            "var(--muted)")
                        }
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      style={{ ...inputStyle, paddingRight: 52 }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "var(--signal)";
                        (e.target as HTMLInputElement).style.boxShadow =
                          "0 0 0 3px rgba(201,53,42,0.08)";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "var(--border-med)";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted-light)",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--sans)",
                        padding: 4,
                        transition: "color 0.12s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--ink)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--muted-light)")
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm password — signup only */}
                {isSignup && (
                  <div style={{ marginBottom: 0 }}>
                    <label
                      htmlFor="confirm-password"
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--ink-2)",
                        marginBottom: 6,
                        letterSpacing: "0.01em",
                      }}
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      style={inputStyle}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "var(--signal)";
                        (e.target as HTMLInputElement).style.boxShadow =
                          "0 0 0 3px rgba(201,53,42,0.08)";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "var(--border-med)";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: 13,
                    fontFamily: "var(--sans)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    background: "var(--signal)",
                    border: "none",
                    borderRadius: 7,
                    cursor: submitting ? "default" : "pointer",
                    marginTop: 8,
                    transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                    boxShadow: "0 2px 8px rgba(201,53,42,0.25)",
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      (e.currentTarget as HTMLElement).style.background =
                        "#b02e24";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(-1px)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 4px 16px rgba(201,53,42,0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--signal)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 2px 8px rgba(201,53,42,0.25)";
                  }}
                >
                  {submitting
                    ? isSignup
                      ? "Creating account…"
                      : "Signing in…"
                    : isSignup
                    ? "Create account"
                    : "Log in"}
                </button>

                {status === "error" && error && (
                  <p
                    style={{
                      marginTop: 14,
                      fontSize: 13,
                      color: "var(--signal)",
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </p>
                )}
              </form>

              {/* Bottom note */}
              <div
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  fontSize: 12.5,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "var(--signal)",
                        fontFamily: "var(--sans)",
                        padding: 0,
                        textDecoration: "none",
                      }}
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "var(--signal)",
                        fontFamily: "var(--sans)",
                        padding: 0,
                        textDecoration: "none",
                      }}
                    >
                      Create one free
                    </button>
                  </>
                )}
              </div>

              {/* Legal */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--border)",
                  fontSize: 11,
                  color: "var(--muted-light)",
                  textAlign: "center",
                  lineHeight: 1.7,
                }}
              >
                By continuing you agree to our{" "}
                <Link
                  href="/terms"
                  style={{
                    color: "var(--muted)",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
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
                .
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  fontFamily: "var(--sans)",
  fontSize: 14,
  fontWeight: 400,
  color: "var(--ink)",
  background: "var(--surface)",
  border: "1px solid var(--border-med)",
  borderRadius: 7,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none",
  boxSizing: "border-box",
};
