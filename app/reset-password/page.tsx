"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

type Status = "exchanging" | "ready" | "submitting" | "error";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("exchanging");
  const [error, setError] = useState<string | null>(null);

  // Supabase PKCE reset link lands here with ?code=… — exchange it for a
  // session so the subsequent updateUser call is authorized. If there's no
  // code (link expired, user hit the URL directly), fall through and let
  // updateUser fail with a clearer error.
  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = createClient();

    (async () => {
      if (code) {
        const { error: sbError } = await supabase.auth.exchangeCodeForSession(code);
        if (sbError) {
          setError(
            "This reset link is no longer valid. Request a new one from the forgot password page."
          );
          setStatus("error");
          return;
        }
      }
      setStatus("ready");
    })();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const supabase = createClient();
      const { error: sbError } = await supabase.auth.updateUser({ password });
      if (sbError) throw new Error(sbError.message);

      // Sign out so the user logs in fresh with the new password rather than
      // landing on an authenticated /login redirect loop.
      await supabase.auth.signOut();
      router.push("/login?reset=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      <div style={{ background: "var(--ink)", minHeight: "280px", padding: "72px 24px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "16px" }}>
            Reset Password
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0 }}>
            Choose a new password.
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            Enter a new password for your account.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "48px 24px 0" }}>
        {status === "exchanging" ? (
          <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--muted)", textAlign: "center" }}>
            Verifying reset link…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="password" style={labelStyle}>New password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--signal)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />

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

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                marginTop: "20px", width: "100%",
                background: "var(--signal)", color: "#FAFAFA",
                border: "none", borderRadius: 0,
                fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                letterSpacing: "0.04em", padding: "14px 24px",
                cursor: status === "submitting" ? "default" : "pointer",
                opacity: status === "submitting" ? 0.6 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {status === "submitting" ? "Updating…" : "Update password"}
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
  borderRadius: 0,
  padding: "14px 18px",
  fontFamily: "var(--sans)",
  fontSize: "16px",
  color: "var(--ink)",
  outline: "none",
  transition: "border-color 150ms ease",
};
