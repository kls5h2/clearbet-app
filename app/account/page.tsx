"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import type { Tier } from "@/lib/tier";

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  msg: string;
  type: "success" | "error";
}

function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        background: toast.type === "error" ? "var(--signal)" : "var(--ink)",
        color: "#fff",
        padding: "13px 22px",
        fontSize: "13.5px",
        fontWeight: 500,
        fontFamily: "var(--sans)",
        maxWidth: "380px",
        zIndex: 1000,
        borderRadius: 0,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        lineHeight: 1.4,
        pointerEvents: "none",
      }}
    >
      {toast.msg}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 0,
  border: "1px solid var(--border-med)",
  background: "var(--warm-white)",
  fontSize: "14px",
  color: "var(--ink)",
  outline: "none",
  fontFamily: "var(--sans)",
  boxSizing: "border-box",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 0,
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  background: "var(--ink)",
  color: "#fff",
  transition: "opacity 0.12s",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 0,
  border: "1px solid var(--border-med)",
  background: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--muted)",
};

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "8px",
};

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-med)",
  borderRadius: 0,
  padding: "20px 24px",
};

const dangerCard: React.CSSProperties = {
  ...card,
  borderLeft: "3px solid var(--signal)",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--muted-light)",
  marginBottom: "10px",
  marginTop: "32px",
};

const editActionBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "12.5px",
  fontWeight: 600,
  color: "var(--signal)",
  padding: 0,
  flexShrink: 0,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Subscription
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  // Edit email
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  // Change password
  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Cancel plan
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);

  // ─── Toast helper ───────────────────────────────────────────────────────────

  function showToast(msg: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ─── Load user ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const client = createClient();
    async function load() {
      try {
        const { data } = await client.auth.getUser();
        if (!data.user) { router.replace("/login"); return; }
        setEmail(data.user.email ?? null);

        const uid = data.user.id;
        const { data: profile } = await client
          .from("profiles")
          .select("tier")
          .eq("id", uid)
          .maybeSingle();
        const t = (profile?.tier as Tier) ?? "free";
        setTier(t);

        if (t === "pro") {
          fetchSubscription();
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/stripe/subscription");
      if (!res.ok) return;
      const data = await res.json() as { currentPeriodEnd: number; cancelAtPeriodEnd: boolean };
      setRenewalDate(formatDate(data.currentPeriodEnd));
      setCancelAtPeriodEnd(data.cancelAtPeriodEnd);
    } catch {
      // Non-fatal — renewal date stays null
    }
  }

  // ─── Email ──────────────────────────────────────────────────────────────────

  async function handleSaveEmail() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    const client = createClient();
    const { error } = await client.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      showToast(`Error: ${error.message}`, "error");
    } else {
      setEditingEmail(false);
      setNewEmail("");
      showToast("Confirmation sent to your new email.");
    }
  }

  // ─── Password ───────────────────────────────────────────────────────────────

  async function handleSavePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      showToast("All three password fields are required.", "error");
      return;
    }
    if (newPw.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("New passwords don't match.", "error");
      return;
    }
    setPwSaving(true);
    const client = createClient();
    // Verify current password by re-authenticating
    if (email) {
      const { error: signInErr } = await client.auth.signInWithPassword({
        email,
        password: currentPw,
      });
      if (signInErr) {
        setPwSaving(false);
        showToast("Current password is incorrect.", "error");
        return;
      }
    }
    const { error } = await client.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) {
      showToast(`Error: ${error.message}`, "error");
    } else {
      setChangingPw(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      showToast("Password updated.");
    }
  }

  // ─── Cancel plan ────────────────────────────────────────────────────────────

  async function handleCancelPlan() {
    setCancelSaving(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        showToast(body?.error ?? "Failed to cancel plan.", "error");
        return;
      }
      setCancelConfirm(false);
      setTier("free");
      const msg = renewalDate
        ? `Plan cancelled. Access continues until ${renewalDate}.`
        : "Plan cancelled. Access continues until the end of your billing period.";
      showToast(msg);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setCancelSaving(false);
    }
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  async function handleLogout() {
    const client = createClient();
    await client.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // ─── Delete account ─────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleteSaving(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        showToast(body?.error ?? "Failed to delete account.", "error");
        setDeleteSaving(false);
        return;
      }
      const client = createClient();
      await client.auth.signOut();
      router.push("/?deleted=1");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      setDeleteSaving(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
        <Nav />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav />

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Page heading */}
        <div style={{ marginBottom: "8px" }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)",
            marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ width: "16px", height: "1px", background: "var(--signal)", display: "block" }} />
            Account
          </div>
          <h1 style={{
            fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em",
            color: "var(--ink)", margin: 0,
          }}>
            Your account
          </h1>
        </div>

        {/* ── ACCOUNT INFO ──────────────────────────────────────── */}
        <div style={sectionLabel}>Account Info</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

          {/* Email */}
          <div style={card}>
            <div style={monoLabel}>Email</div>
            {!editingEmail ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ fontSize: "15px", color: "var(--ink)", fontWeight: 500, userSelect: "text" }} translate="no">
                  {email}
                </div>
                <button
                  onClick={() => setEditingEmail(true)}
                  style={editActionBtn}
                >
                  Edit →
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
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEmail(); if (e.key === "Escape") { setEditingEmail(false); setNewEmail(""); }}}
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
          </div>

          {/* Password */}
          <div style={card}>
            <div style={monoLabel}>Password</div>
            {!changingPw ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "15px", color: "var(--muted)", fontWeight: 400, letterSpacing: "0.1em" }}>
                  ••••••••
                </div>
                <button
                  onClick={() => setChangingPw(true)}
                  style={editActionBtn}
                >
                  Change →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Current password"
                  style={inputStyle}
                  autoFocus
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  style={inputStyle}
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSavePassword(); }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSavePassword} disabled={pwSaving} style={saveBtnStyle}>
                    {pwSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setChangingPw(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                    style={cancelBtnStyle}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── PLAN ──────────────────────────────────────────────── */}
        <div style={sectionLabel}>Plan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={card}>
            <div style={monoLabel}>Current plan</div>

            {tier === "pro" ? (
              <>
                {/* Pro — view mode */}
                {!cancelConfirm ? (
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: renewalDate ? "6px" : 0 }}>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>Pro</span>
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "3px 10px", borderRadius: 0,
                          background: "rgba(201,53,42,0.08)", color: "var(--signal)",
                        }}>PRO</span>
                        {cancelAtPeriodEnd && (
                          <span style={{
                            fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            color: "var(--muted)",
                          }}>Cancelling</span>
                        )}
                      </div>
                      {renewalDate && !cancelAtPeriodEnd && (
                        <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.5 }}>
                          Renews {renewalDate}
                        </div>
                      )}
                      {renewalDate && cancelAtPeriodEnd && (
                        <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.5 }}>
                          Access until {renewalDate}
                        </div>
                      )}
                    </div>
                    {!cancelAtPeriodEnd && (
                      <button
                        onClick={() => setCancelConfirm(true)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: "12.5px", fontWeight: 500, color: "var(--muted)",
                          padding: 0, flexShrink: 0, transition: "color 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--signal)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                      >
                        Cancel plan →
                      </button>
                    )}
                  </div>
                ) : (
                  /* Pro — cancel confirm */
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ fontSize: "13.5px", color: "var(--ink)", lineHeight: 1.6 }}>
                      {renewalDate
                        ? `Your Pro access continues until ${renewalDate}. After that you'll move to the free tier. Cancel anyway?`
                        : "Your Pro access continues until the end of your billing period. After that you'll move to the free tier. Cancel anyway?"}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={handleCancelPlan}
                        disabled={cancelSaving}
                        style={{ ...saveBtnStyle, background: "var(--signal)" }}
                      >
                        {cancelSaving ? "Cancelling…" : "Yes, cancel"}
                      </button>
                      <button onClick={() => setCancelConfirm(false)} style={cancelBtnStyle}>
                        Keep Pro
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Free */
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink)" }}>
                  Free — 1 breakdown per day
                </div>
                <a
                  href="/pricing"
                  style={{
                    fontSize: "12.5px", fontWeight: 600, color: "var(--signal)",
                    textDecoration: "none", flexShrink: 0,
                  }}
                >
                  Upgrade to Pro →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── HISTORY ───────────────────────────────────────────── */}
        <div style={sectionLabel}>History</div>
        <div>
          <a
            href="/my-breakdowns"
            style={{
              ...card,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--ink)",
            }}
          >
            <div>
              <div style={{ ...monoLabel, marginBottom: "4px" }}>Breakdowns</div>
              <div style={{ fontSize: "15px", fontWeight: 500 }}>My Breakdowns</div>
            </div>
            <span style={{ fontSize: "18px", color: "var(--muted)" }}>→</span>
          </a>
        </div>

        {/* ── DANGER ZONE ───────────────────────────────────────── */}
        <div style={sectionLabel}>Danger Zone</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

          {/* Log out */}
          <div style={dangerCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ ...monoLabel, marginBottom: "4px" }}>Session</div>
                <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink)" }}>Log out</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "none", border: "1px solid var(--border-med)",
                  cursor: "pointer", fontSize: "13px", fontWeight: 500,
                  color: "var(--muted)", padding: "7px 14px", borderRadius: 0,
                  transition: "color 0.12s, border-color 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--signal)"; e.currentTarget.style.borderColor = "var(--signal)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border-med)"; }}
              >
                Log out
              </button>
            </div>
          </div>

          {/* Delete account */}
          <div style={dangerCard}>
            <div style={{ ...monoLabel, marginBottom: "4px" }}>Permanently delete</div>

            {!deleteConfirm ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink)" }}>Delete account</div>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    background: "none", border: "1px solid var(--signal)",
                    cursor: "pointer", fontSize: "13px", fontWeight: 500,
                    color: "var(--signal)", padding: "7px 14px", borderRadius: 0,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,53,42,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  Delete account
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "13.5px", color: "var(--ink)", lineHeight: 1.6 }}>
                  This will permanently delete your account, all breakdowns, and cancel any active subscription.
                  Type <strong>DELETE</strong> to confirm.
                </div>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  style={{
                    ...inputStyle,
                    border: deleteInput === "DELETE"
                      ? "1px solid var(--signal)"
                      : "1px solid var(--border-med)",
                  }}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE" || deleteSaving}
                    style={{
                      ...saveBtnStyle,
                      background: deleteInput === "DELETE" ? "var(--signal)" : "var(--border-med)",
                      cursor: deleteInput === "DELETE" ? "pointer" : "not-allowed",
                      opacity: deleteInput === "DELETE" ? 1 : 0.6,
                    }}
                  >
                    {deleteSaving ? "Deleting…" : "Yes, delete my account"}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                    style={cancelBtnStyle}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{
        textAlign: "center", padding: "20px", fontSize: "11.5px",
        color: "var(--muted-light)", lineHeight: 1.8,
      }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice.{" "}
        © RawIntel LLC
      </footer>

      <Toast toast={toast} />
    </div>
  );
}
