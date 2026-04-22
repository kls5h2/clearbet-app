import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const params = await searchParams;
  const upgraded = params.upgraded === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("email, tier, subscription_status").eq("id", user.id).maybeSingle()
    : { data: null };

  // Usage this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: usageCount } = user
    ? await supabase.from("breakdown_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", oneWeekAgo)
    : { count: 0 };

  const tier = profile?.tier ?? "free";
  const email = profile?.email ?? user?.email ?? "";

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
            Dashboard
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0 }}>
            {upgraded ? "Welcome to Pro." : "Your account."}
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            {email}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 0" }}>
        <div style={{ background: "var(--paper)", border: "0.5px solid var(--border)", borderRadius: "6px", padding: "22px 24px", marginBottom: "16px" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px" }}>
            Plan
          </p>
          <p style={{ fontFamily: "var(--serif)", fontSize: "24px", fontWeight: 500, color: "var(--ink)", margin: 0, marginBottom: "10px" }}>
            {tier === "pro" ? "Pro" : "Free"}
          </p>
          {tier === "free" ? (
            <>
              <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0, marginBottom: "16px" }}>
                {usageCount ?? 0} of 3 breakdowns used this week.
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  background: "var(--signal)", color: "#FAFAFA",
                  fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.04em", padding: "12px 24px",
                  borderRadius: "4px", textDecoration: "none",
                }}
              >
                Upgrade to Pro →
              </Link>
            </>
          ) : (
            <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Unlimited breakdowns. Status: {profile?.subscription_status ?? "active"}.
            </p>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <Link href="/" style={{ fontFamily: "var(--sans)", fontSize: "13px", color: "var(--signal)", textDecoration: "none" }}>
            ← Back to today&#8217;s slate
          </Link>
        </div>
      </div>
    </div>
  );
}
