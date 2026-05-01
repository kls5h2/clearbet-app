"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { getStartOfDayET } from "@/lib/usage-window";
import type { Tier } from "@/lib/tier";

export default function AccountPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit email
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  // Change password
  const [changingPw, setChangingPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Cancel plan
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  useEffect(() => {
    const client = createClient();
    async function loadProfile() {
      try {
        const { data } = await client.auth.getUser();
        if (!data.user) { router.replace("/login"); return; }
        setUserId(data.user.id);
        setEmail(data.user.email ?? null);

        const { data: profile } = await client
          .from("profiles")
          .select("tier")
          .eq("id", data.user.id)
          .maybeSingle();
        const t = (profile?.tier as Tier) ?? "free";
        setTier(t);

        if (t === "free") {
          const startOfDayET = getStartOfDayET();
          const { count } = await client
            .from("breakdown_usage")
            .select("id", { count: "exact", head: true })
            .eq("user_id", data.user.id)
            .gte("created_at", startOfDayET);
          setDailyUsed(count ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function handleLogout() {
    const client = createClient();
    await client.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleSaveEmail() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailMsg(null);
    const client = createClient();
    const { error } = await client.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      setEmailMsg(`Error: ${error.message}`);
    } else {
      setEmailMsg("Check your new email address to confirm the change.");
      setEditingEmail(false);
      setNewEmail("");
    }
  }

  async function handleSavePassword() {
    if (!newPw.trim() || newPw.length < 8) {
      setPwMsg("Password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    const client = createClient();
    const { error } = await client.auth.updateUser({ password: newPw.trim() });
    setPwSaving(false);
    if (error) {
      setPwMsg(`Error: ${error.message}`);
    } else {
      setPwMsg("Password updated.");
      setChangingPw(false);
      setNewPw("");
    }
  }

  async function handleCancelPlan() {
    if (!userId) return;
    setCancelSaving(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setCancelMsg(`Error: ${body?.error ?? "Failed to cancel plan."}`);
        return;
      }
      setCancelConfirm(false);
      setCancelMsg("Your plan will remain active until the end of your billing period.");
    } catch {
      setCancelMsg("Something went wrong. Please try again.");
    } finally {
      setCancelSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 0,
    border: "1px solid var(--border-med)", background: "var(--warm-white)",
    fontSize: "14px", color: "var(--ink)", outline: "none",
    fontFamily: "var(--sans)", boxSizing: "border-box",
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: "8px 18px", borderRadius: 0, border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: 600, background: "var(--ink)", color: "#fff",
    transition: "opacity 0.12s",
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: "8px 14px", borderRadius: 0, border: "1px solid var(--border-med)",
    background: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500,
    color: "var(--muted)", transition: "color 0.12s",
  };

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav />

      {loading ? null : <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: "40px" }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)",
            marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ width: "16px", height: "1px", background: "var(--signal)", display: "block" }} />
            Account
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)", margin: 0 }}>
            Your account
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Email */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-med)",
            borderRadius: 0, padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: "8px",
            }}>Email</div>

            {!editingEmail ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div
                  style={{ fontSize: "15px", color: "var(--ink)", fontWeight: 500, userSelect: "text" }}
                  translate="no"
                >
                  {email}
                </div>
                <button
                  onClick={() => { setEditingEmail(true); setEmailMsg(null); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "12.5px", fontWeight: 600, color: "var(--signal)", padding: 0,
                  }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={email ?? ""}
                  style={inputStyle}
                  autoFocus
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveEmail} disabled={emailSaving} style={saveBtnStyle}>
                    {emailSaving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setEditingEmail(false); setNewEmail(""); }} style={cancelBtnStyle}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {emailMsg && (
              <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.5 }}>
                {emailMsg}
              </div>
            )}
          </div>

          {/* Change password */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-med)",
            borderRadius: 0, padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: "8px",
            }}>Password</div>

            {!changingPw ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "15px", color: "var(--muted)", fontWeight: 400, letterSpacing: "0.1em" }}>
                  ••••••••
                </div>
                <button
                  onClick={() => { setChangingPw(true); setPwMsg(null); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "12.5px", fontWeight: 600, color: "var(--signal)", padding: 0,
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  style={inputStyle}
                  autoFocus
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSavePassword} disabled={pwSaving} style={saveBtnStyle}>
                    {pwSaving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setChangingPw(false); setNewPw(""); }} style={cancelBtnStyle}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {pwMsg && (
              <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.5 }}>
                {pwMsg}
              </div>
            )}
          </div>

          {/* Plan */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-med)",
            borderRadius: 0, padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: "8px",
            }}>Plan</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                  {tier === "pro" ? "Pro" : "Free"}
                </span>
                {tier === "pro" && (
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "3px 10px", borderRadius: 0,
                    background: "rgba(201,53,42,0.08)", color: "var(--signal)",
                  }}>PRO</span>
                )}
              </div>
              {tier === "free" && (
                <a href="/login?mode=signup" style={{
                  fontSize: "13px", fontWeight: 600, color: "var(--signal)", textDecoration: "none",
                }}>
                  Upgrade →
                </a>
              )}
            </div>
          </div>

          {/* Today's usage — free only */}
          {tier === "free" && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-med)",
              borderRadius: 0, padding: "20px 24px",
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--muted)", marginBottom: "8px",
              }}>Today&apos;s breakdowns</div>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink)" }}>
                {dailyUsed >= 1 ? "1 / 1 used" : "0 / 1 used"}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "5px", lineHeight: 1.5 }}>
                {dailyUsed >= 1
                  ? "Resets at midnight ET. Upgrade to Pro for unlimited access."
                  : "Free accounts get one breakdown per day."}
              </div>
            </div>
          )}

          {/* My Breakdowns */}
          <a href="/my-breakdowns" style={{
            background: "var(--surface)", border: "1px solid var(--border-med)",
            borderRadius: 0, padding: "20px 24px",
            textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
            color: "var(--ink)",
          }}>
            <div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--muted)", marginBottom: "4px",
              }}>History</div>
              <div style={{ fontSize: "15px", fontWeight: 500 }}>My Breakdowns</div>
            </div>
            <span style={{ fontSize: "18px", color: "var(--muted)" }}>→</span>
          </a>

          {/* Cancel plan — pro only */}
          {tier === "pro" && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-med)",
              borderRadius: 0, padding: "20px 24px",
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--muted)", marginBottom: "8px",
              }}>Subscription</div>

              {!cancelConfirm ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14px", color: "var(--ink)" }}>Pro — active</div>
                  <button
                    onClick={() => setCancelConfirm(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "12.5px", fontWeight: 500, color: "var(--muted)", padding: 0,
                      transition: "color 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--signal)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                  >
                    Cancel plan
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "13.5px", color: "var(--ink)", lineHeight: 1.55 }}>
                    Are you sure? Your Pro access will continue until the end of your current billing period.
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleCancelPlan}
                      disabled={cancelSaving}
                      style={{
                        ...saveBtnStyle,
                        background: "var(--signal)",
                      }}
                    >
                      {cancelSaving ? "Cancelling…" : "Yes, cancel plan"}
                    </button>
                    <button onClick={() => setCancelConfirm(false)} style={cancelBtnStyle}>
                      Keep Pro
                    </button>
                  </div>
                </div>
              )}
              {cancelMsg && (
                <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.5 }}>
                  {cancelMsg}
                </div>
              )}
            </div>
          )}

          {/* Log out */}
          <button
            onClick={handleLogout}
            style={{
              background: "var(--surface)", border: "1px solid var(--border-med)",
              borderRadius: 0, padding: "18px 24px",
              cursor: "pointer", textAlign: "left", width: "100%",
              fontSize: "15px", fontWeight: 500, color: "var(--muted)",
              transition: "color 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--signal)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Log out
          </button>
        </div>
      </div>}

      <footer style={{
        textAlign: "center", padding: "20px", fontSize: "11.5px",
        color: "var(--muted-light)", lineHeight: 1.8,
      }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice.{" "}
        © RawIntel LLC
      </footer>
    </div>
  );
}
