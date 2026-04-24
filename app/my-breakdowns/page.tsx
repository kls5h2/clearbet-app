/**
 * My Breakdowns — every breakdown the logged-in user has generated, filtered
 * by user_id from the Supabase session. Protected by middleware; if someone
 * hits this unauthenticated, they're redirected to /login?next=/my-breakdowns.
 */

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

const stripColor = "var(--signal, #D93B3A)";
const badgeStyleDefault = { bg: "rgba(14,14,14,0.06)", color: "var(--ink, #0E0E0E)" };

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return `${months[m - 1]} ${d}, ${y}`;
  }
  return dateStr;
}

function groupByDate(rows: BreakdownRow[]): Map<string, BreakdownRow[]> {
  const groups = new Map<string, BreakdownRow[]>();
  for (const row of rows) {
    const key = row.game_date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
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

function FilterRow({
  label,
  options,
  active,
}: {
  label: string;
  options: { value: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      <span style={{
        fontFamily: "var(--sans)", fontSize: "10px",
        fontWeight: 500, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--muted)",
        width: "60px", flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {options.map((opt) => {
          const isActive = active === opt.value;
          return (
            <Link
              key={opt.value}
              href={opt.href}
              style={{
                fontFamily: "var(--sans)", fontSize: "12px",
                fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "6px 12px",
                background: isActive ? "var(--ink)" : "transparent",
                color: isActive ? "#FAFAFA" : "var(--muted)",
                border: `0.5px solid ${isActive ? "var(--ink)" : "var(--border)"}`,
                borderRadius: "4px",
                textDecoration: "none",
                transition: "background 150ms ease, color 150ms ease",
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-breakdowns");

  const tier = await getTierForUser(supabase, user.id);
  if (tier !== "pro") {
    return (
      <div style={{ background: "var(--canvas, #FAFAFA)", minHeight: "100vh", paddingBottom: "5rem" }}>
        <Nav activePage="my-breakdowns" />
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.5rem 0" }}>
          <ProUpsellPanel
            heading="Your breakdown archive is behind Pro."
            body="Pro keeps a complete record of every breakdown you run — filterable by sport, date, and outcome, with a card summary on each one."
          />
        </div>
      </div>
    );
  }

  // Single query scoped to sport + date. Outcome filter is applied in-memory
  // so the summary counts stay stable while the user drills into one outcome.
  let query = supabase
    .from("breakdowns")
    .select("id, game_id, game_date, home_team, away_team, sport, confidence_level, confidence_label, created_at, card_summary, outcome")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (sport !== "all") query = query.eq("sport", sport);
  if (days !== "all") {
    const cutoff = new Date(Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", cutoff);
  }

  const { data, error } = await query;
  const allScopedRows: BreakdownRow[] = data ?? [];

  // Summary counts — computed over sport+date-scoped rows (NOT the outcome
  // filter) so the row reads as context, not a mirror of the current view.
  const counts = {
    won:       allScopedRows.filter((r) => r.outcome === "won").length,
    lost:      allScopedRows.filter((r) => r.outcome === "lost").length,
    push:      allScopedRows.filter((r) => r.outcome === "push").length,
    no_action: allScopedRows.filter((r) => r.outcome === "no_action").length,
  };

  const rows = outcome === "all"
    ? allScopedRows
    : allScopedRows.filter((r) => r.outcome === outcome);
  const groups = groupByDate(rows);
  const dateKeys = Array.from(groups.keys());
  const summaryItems: { label: string; value: number; color: string }[] = [
    { label: "Won",       value: counts.won,       color: "#0E8A5F" },
    { label: "Lost",      value: counts.lost,      color: "#D93B3A" },
    { label: "Push",      value: counts.push,      color: "#2E6CA9" },
    { label: "No Action", value: counts.no_action, color: "#0E0E0E" },
  ];

  return (
    <div style={{ background: "var(--canvas, #FAFAFA)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav activePage="my-breakdowns" />

      {/* Dark hero — matches standardized pattern */}
      <div style={{ background: "var(--ink)", minHeight: "240px", padding: "64px 24px 56px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "14px" }}>
            My Breakdowns
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>
            Every breakdown you've run.
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "15px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "14px", marginBottom: 0 }}>
            Your complete breakdown history. Filter by sport, date, or outcome.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.75rem 1.5rem 0" }}>
        {/* Outcome summary — counts only, no percentages */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "20px",
          padding: "14px 18px", marginBottom: "1.25rem",
          background: "var(--paper, #F7F5F0)",
          border: "0.5px solid var(--border, rgba(14,14,14,0.10))",
          borderRadius: "6px",
        }}>
          {summaryItems.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span aria-hidden="true" style={{
                display: "inline-block", width: "8px", height: "8px",
                borderRadius: "999px", background: item.color,
              }} />
              <span style={{
                fontFamily: "var(--sans)", fontSize: "13px",
                fontWeight: 500, color: "var(--ink)",
              }}>
                {item.value}
              </span>
              <span style={{
                fontFamily: "var(--sans)", fontSize: "11px",
                fontWeight: 500, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--muted)",
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Filters — sport, date, outcome */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.25rem" }}>
          <FilterRow
            label="Sport"
            options={[
              { value: "all", label: "All",   href: buildHref({ sport: "all", outcome, days }) },
              { value: "NBA", label: "NBA",   href: buildHref({ sport: "NBA", outcome, days }) },
              { value: "MLB", label: "MLB",   href: buildHref({ sport: "MLB", outcome, days }) },
            ]}
            active={sport}
          />
          <FilterRow
            label="Date"
            options={[
              { value: "all", label: "All time",    href: buildHref({ sport, outcome, days: "all" }) },
              { value: "30",  label: "30 days",     href: buildHref({ sport, outcome, days: "30" }) },
              { value: "7",   label: "7 days",      href: buildHref({ sport, outcome, days: "7" }) },
            ]}
            active={days}
          />
          <FilterRow
            label="Outcome"
            options={[
              { value: "all",       label: "All",       href: buildHref({ sport, outcome: "all",       days }) },
              { value: "won",       label: "Won",       href: buildHref({ sport, outcome: "won",       days }) },
              { value: "lost",      label: "Lost",      href: buildHref({ sport, outcome: "lost",      days }) },
              { value: "push",      label: "Push",      href: buildHref({ sport, outcome: "push",      days }) },
              { value: "no_action", label: "No Action", href: buildHref({ sport, outcome: "no_action", days }) },
            ]}
            active={outcome}
          />
        </div>

        <p style={{ fontSize: "12px", color: "var(--muted, #8A8A86)", marginBottom: "1.5rem" }}>
          {rows.length} breakdown{rows.length !== 1 ? "s" : ""}
          {sport !== "all" ? ` · ${sport}` : ""}
          {days !== "all" ? ` · last ${days} days` : ""}
          {outcome !== "all" ? ` · ${outcome.replace("_", " ")}` : ""}
        </p>

        {error && (
          <div style={{ background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "6px", padding: "10px 14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", color: "var(--signal, #D93B3A)" }}>{error.message}</p>
          </div>
        )}

        {rows.length === 0 && !error && (
          <div style={{ background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "6px", padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--sans)", fontSize: "14px", color: "var(--muted, #8A8A86)", marginBottom: "14px" }}>
              {sport === "all" && days === "all" && outcome === "all"
                ? "No breakdowns yet. Start with today's slate."
                : "Nothing matches these filters yet."}
            </p>
            <Link
              href={sport === "all" && days === "all" && outcome === "all" ? "/" : "/my-breakdowns"}
              style={{
                display: "inline-block",
                background: "var(--signal)", color: "#FAFAFA",
                fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                letterSpacing: "0.04em", textDecoration: "none",
                padding: "10px 20px", borderRadius: "4px",
              }}
            >
              {sport === "all" && days === "all" && outcome === "all"
                ? "View today's slate"
                : "Clear filters"}
            </Link>
          </div>
        )}

        {/* Date groups */}
        {dateKeys.map((dateKey) => {
          const dateRows = groups.get(dateKey)!;
          return (
            <div key={dateKey} style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted, #8A8A86)", marginBottom: "10px", paddingBottom: "6px", borderBottom: "0.5px solid var(--border, rgba(14,14,14,0.10))" }}>
                {formatDate(dateKey)}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {dateRows.map((row) => (
                  <div key={row.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <ArchiveCard
                      gameId={row.game_id}
                      homeTeam={row.home_team}
                      awayTeam={row.away_team}
                      sport={row.sport}
                      gameDate={row.game_date}
                      confidenceLevel={row.confidence_level}
                      confidenceLabel={row.confidence_label}
                      peek={row.card_summary}
                      stripColor={stripColor}
                      badgeBg={badgeStyleDefault.bg}
                      badgeColor={badgeStyleDefault.color}
                      formattedDate={formatDate(row.game_date)}
                    />
                    <div style={{ paddingLeft: "14px" }}>
                      <OutcomePills gameId={row.game_id} initialOutcome={row.outcome} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
