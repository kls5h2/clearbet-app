import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ArchiveCard from "@/components/ArchiveCard";
import OutcomePills, { type Outcome } from "@/components/OutcomePills";
import ProUpsellPanel from "@/components/ProUpsellPanel";
import { createClient } from "@/lib/supabase/server";
import { getTierForUser } from "@/lib/tier";

interface BreakdownRow {
  id: number;
  game_id: string;
  game_date: string;
  home_team: string;
  away_team: string;
  sport: string;
  confidence_level: number;
  confidence_label: string;
  created_at: string;
  card_summary: string | null;
  outcome: Outcome;
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${months[m - 1]} ${d}, ${y}`;
  }
  return dateStr;
}

function groupByDate(rows: BreakdownRow[]): Map<string, BreakdownRow[]> {
  const groups = new Map<string, BreakdownRow[]>();
  for (const row of rows) {
    if (!groups.has(row.game_date)) groups.set(row.game_date, []);
    groups.get(row.game_date)!.push(row);
  }
  return groups;
}

type SportFilter = "all" | "NBA" | "MLB";
type OutcomeFilter = "all" | "won" | "lost" | "push" | "no_action";
type DaysFilter = "all" | "30" | "7";

function parseSport(raw: string | string[] | undefined): SportFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v?.toLowerCase() === "nba") return "NBA";
  if (v?.toLowerCase() === "mlb") return "MLB";
  return "all";
}

function parseOutcome(raw: string | string[] | undefined): OutcomeFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "won" || v === "lost" || v === "push" || v === "no_action") return v;
  return "all";
}

function parseDays(raw: string | string[] | undefined): DaysFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "30" || v === "7") return v;
  return "all";
}

function buildHref(params: { sport: SportFilter; outcome: OutcomeFilter; days: DaysFilter }): string {
  const sp = new URLSearchParams();
  if (params.sport !== "all") sp.set("sport", params.sport.toLowerCase());
  if (params.outcome !== "all") sp.set("outcome", params.outcome);
  if (params.days !== "all") sp.set("days", params.days);
  const qs = sp.toString();
  return qs ? `/my-breakdowns?${qs}` : "/my-breakdowns";
}

function FilterGroup({
  label,
  options,
  active,
}: {
  label: string;
  options: { value: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted-light)",
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map((opt) => {
          const isActive = active === opt.value;
          return (
            <Link
              key={opt.value}
              href={opt.href}
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isActive ? "#fff" : "var(--muted)",
                background: isActive ? "var(--ink)" : "transparent",
                border: `1px solid ${isActive ? "var(--ink)" : "var(--border-med)"}`,
                padding: "4px 12px",
                borderRadius: 0,
                textDecoration: "none",
                transition: "all 0.12s",
                fontFamily: "var(--sans)",
              }}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function MyBreakdownsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; outcome?: string; days?: string }>;
}) {
  const sp = await searchParams;
  const sport = parseSport(sp.sport);
  const outcome = parseOutcome(sp.outcome);
  const days = parseDays(sp.days);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-breakdowns");

  const tier = await getTierForUser(supabase, user.id);
  if (tier !== "pro") {
    return (
      <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
        <Nav activePage="my-breakdowns" />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem 0" }}>
          <ProUpsellPanel
            heading="Your breakdown archive is behind Pro."
            body="Pro keeps a complete record of every breakdown you run — filterable by sport, date, and outcome, with a card summary on each one."
          />
        </div>
      </div>
    );
  }

  let query = supabase
    .from("breakdowns")
    .select(
      "id, game_id, game_date, home_team, away_team, sport, confidence_level, confidence_label, created_at, card_summary, outcome"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (sport !== "all") query = query.eq("sport", sport);
  if (days !== "all") {
    const cutoff = new Date(
      Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte("created_at", cutoff);
  }

  const { data, error } = await query;
  const allScopedRows: BreakdownRow[] = data ?? [];

  const counts = {
    total: allScopedRows.length,
    won: allScopedRows.filter((r) => r.outcome === "won").length,
    lost: allScopedRows.filter((r) => r.outcome === "lost").length,
    push: allScopedRows.filter((r) => r.outcome === "push").length,
    no_action: allScopedRows.filter((r) => r.outcome === "no_action").length,
  };

  const rows =
    outcome === "all"
      ? allScopedRows
      : allScopedRows.filter((r) => r.outcome === outcome);
  const groups = groupByDate(rows);
  const dateKeys = Array.from(groups.keys());

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav activePage="my-breakdowns" />

      {/* HERO */}
      <div
        className="f2"
        style={{
          background: "var(--ink)",
          padding: "32px clamp(16px, 4vw, 40px)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-2%",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "clamp(140px, 22vw, 260px)",
            fontWeight: 900,
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

        {/* Left */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 20,
                height: 1,
                background: "var(--signal)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            My Breakdowns
          </div>
          <div
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Every breakdown
            <br />
            you've ever run.
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              marginTop: 6,
            }}
          >
            Your complete history. Filter by sport, date, or outcome.
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 24,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {counts.total}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginTop: 2,
              }}
            >
              Total
            </div>
          </div>
          <div
            style={{
              width: 1,
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 22,
                fontWeight: 600,
                color: "#4ade80",
                letterSpacing: "-0.02em",
              }}
            >
              {counts.won}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginTop: 2,
              }}
            >
              Won
            </div>
          </div>
          <div
            style={{
              width: 1,
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 22,
                fontWeight: 600,
                color: "#f87171",
                letterSpacing: "-0.02em",
              }}
            >
              {counts.lost}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginTop: 2,
              }}
            >
              Lost
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        className="f2"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-med)",
          padding: "14px clamp(16px, 4vw, 40px)",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          position: "sticky",
          top: 54,
          zIndex: 90,
          boxShadow: "0 2px 8px rgba(17,17,16,0.03)",
        }}
      >
        <FilterGroup
          label="Sport"
          options={[
            { value: "all", label: "All", href: buildHref({ sport: "all", outcome, days }) },
            { value: "NBA", label: "NBA", href: buildHref({ sport: "NBA", outcome, days }) },
            { value: "MLB", label: "MLB", href: buildHref({ sport: "MLB", outcome, days }) },
          ]}
          active={sport}
        />
        <div style={{ width: 1, height: 20, background: "var(--border-med)" }} />
        <FilterGroup
          label="Date"
          options={[
            { value: "all", label: "All time", href: buildHref({ sport, outcome, days: "all" }) },
            { value: "7", label: "7 days", href: buildHref({ sport, outcome, days: "7" }) },
            { value: "30", label: "30 days", href: buildHref({ sport, outcome, days: "30" }) },
          ]}
          active={days}
        />
        <div style={{ width: 1, height: 20, background: "var(--border-med)" }} />
        <FilterGroup
          label="Outcome"
          options={[
            { value: "all", label: "All", href: buildHref({ sport, outcome: "all", days }) },
            { value: "won", label: "Won", href: buildHref({ sport, outcome: "won", days }) },
            { value: "lost", label: "Lost", href: buildHref({ sport, outcome: "lost", days }) },
            { value: "push", label: "Push", href: buildHref({ sport, outcome: "push", days }) },
            { value: "no_action", label: "No action", href: buildHref({ sport, outcome: "no_action", days }) },
          ]}
          active={outcome}
        />
      </div>

      {/* PAGE CONTENT */}
      <div
        className="f3"
        style={{ maxWidth: 860, margin: "0 auto", padding: "32px clamp(16px, 4vw, 40px) 80px" }}
      >
        {error && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-med)",
              borderRadius: 0,
              padding: "10px 14px",
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--signal)" }}>
              {error.message}
            </p>
          </div>
        )}

        {rows.length === 0 && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "80px clamp(16px, 4vw, 40px)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.4 }}>
              📋
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              {sport === "all" && days === "all" && outcome === "all"
                ? "No breakdowns yet."
                : "Nothing matches these filters."}
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.6,
                maxWidth: 320,
                margin: "0 auto 28px",
              }}
            >
              {sport === "all" && days === "all" && outcome === "all"
                ? "Start with today's slate to build your history."
                : "Try adjusting or clearing your filters."}
            </p>
            <Link
              href={
                sport === "all" && days === "all" && outcome === "all"
                  ? "/"
                  : "/my-breakdowns"
              }
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#fff",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: 0,
                background: "var(--signal)",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                boxShadow: "0 2px 8px rgba(201,53,42,0.25)",
              }}
            >
              {sport === "all" && days === "all" && outcome === "all"
                ? "View today's slate →"
                : "Clear filters →"}
            </Link>
          </div>
        )}

        {/* DATE GROUPS */}
        {dateKeys.map((dateKey) => {
          const dateRows = groups.get(dateKey)!;
          return (
            <div key={dateKey} style={{ marginBottom: 6 }}>
              {/* date label with extending line */}
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted-light)",
                  padding: "16px 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {formatDate(dateKey)}
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--border)",
                    display: "block",
                  }}
                />
              </div>

              {/* Cards */}
              {dateRows.map((row) => (
                <div key={row.id} style={{ marginBottom: 8 }}>
                  <ArchiveCard
                    gameId={row.game_id}
                    homeTeam={row.home_team}
                    awayTeam={row.away_team}
                    sport={row.sport}
                    confidenceLabel={row.confidence_label}
                    peek={row.card_summary}
                    formattedDate={formatDate(row.game_date)}
                  />
                  <OutcomePills
                    gameId={row.game_id}
                    initialOutcome={row.outcome}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "20px clamp(16px, 4vw, 40px)",
          fontSize: 11.5,
          color: "var(--muted-light)",
          lineHeight: 1.8,
        }}
      >
        For informational purposes only. RawIntel does not provide financial,
        betting, or investment advice. Bet responsibly.
        <br />
        <a
          href="https://ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          ncpgambling.org
        </a>
        {" · "}
        <Link
          href="/terms"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Terms of Service
        </Link>
        {" · "}
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
        {" · "}© RawIntel LLC
      </footer>
    </div>
  );
}
