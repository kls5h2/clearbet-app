"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import type { Tier } from "@/lib/tier";

function getTodayDateString(): string {
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setEmail(data.user.email ?? null);

      const { data: profile } = await client
        .from("profiles")
        .select("tier")
        .eq("id", data.user.id)
        .maybeSingle();
      const t = (profile?.tier as Tier) ?? "free";
      setTier(t);

      if (t === "free") {
        const todayStr = getTodayDateString();
        const { count } = await client
          .from("breakdowns")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id)
          .eq("game_date", todayStr);
        setDailyUsed(count ?? 0);
      }

      setLoading(false);
    });
  }, [router]);

  async function handleLogout() {
    const client = createClient();
    await client.auth.signOut();
    router.push("/");
    router.refresh();
  }

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
            borderRadius: "10px", padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: "8px",
            }}>Email</div>
            <div style={{ fontSize: "15px", color: "var(--ink)", fontWeight: 500 }}>{email}</div>
          </div>

          {/* Plan */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-med)",
            borderRadius: "10px", padding: "20px 24px",
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
                    padding: "3px 10px", borderRadius: "100px",
                    background: "rgba(201,53,42,0.08)", color: "var(--signal)",
                  }}>PRO</span>
                )}
              </div>
              {tier === "free" && (
                <Link href="/login?mode=signup" style={{
                  fontSize: "13px", fontWeight: 600, color: "var(--signal)", textDecoration: "none",
                }}>
                  Upgrade →
                </Link>
              )}
            </div>
          </div>

          {/* Today's usage — free only */}
          {tier === "free" && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-med)",
              borderRadius: "10px", padding: "20px 24px",
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

          {/* My Breakdowns — pro only */}
          {tier === "pro" && (
            <Link href="/my-breakdowns" style={{
              background: "var(--surface)", border: "1px solid var(--border-med)",
              borderRadius: "10px", padding: "20px 24px",
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
            </Link>
          )}

          {/* Back to slate */}
          <Link href="/intel" style={{
            background: "var(--surface)", border: "1px solid var(--border-med)",
            borderRadius: "10px", padding: "20px 24px",
            textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
            color: "var(--ink)",
          }}>
            <div style={{ fontSize: "15px", fontWeight: 500 }}>Today&apos;s Intel</div>
            <span style={{ fontSize: "18px", color: "var(--muted)" }}>→</span>
          </Link>

          {/* Log out */}
          <button
            onClick={handleLogout}
            style={{
              background: "var(--surface)", border: "1px solid var(--border-med)",
              borderRadius: "10px", padding: "18px 24px",
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
      </div>

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
