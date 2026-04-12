import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Nav from "@/components/Nav";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ArchiveRow {
  id: number;
  game_id: string;
  game_date: string;
  home_team: string;
  away_team: string;
  sport: string;
  confidence_level: number;
  confidence_label: string;
  created_at: string;
  breakdown_content: { gameShape?: string } | null;
}

const stripColor: Record<number, string> = {
  1: "#16A34A",
  2: "#0A7A6C",
  3: "#F59E0B",
  4: "#C9D2DE",
};

const badgeStyle: Record<number, { bg: string; color: string }> = {
  1: { bg: "#DCFCE7", color: "#166534" },
  2: { bg: "#E6F4F2", color: "#0A7A6C" },
  3: { bg: "#FEF3C7", color: "#92400E" },
  4: { bg: "#F1F4F8", color: "#64748B" },
};

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

function groupByDate(rows: ArchiveRow[]): Map<string, ArchiveRow[]> {
  const groups = new Map<string, ArchiveRow[]>();
  for (const row of rows) {
    const key = row.game_date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return groups;
}

export default async function ArchivePage() {
  const { data, error } = await supabase
    .from("breakdowns")
    .select("id, game_id, game_date, home_team, away_team, sport, confidence_level, confidence_label, created_at, breakdown_content")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: ArchiveRow[] = data ?? [];
  const groups = groupByDate(rows);
  const dateKeys = Array.from(groups.keys());

  return (
    <div style={{ background: "#F0F3F7", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1.75rem 1.5rem 0" }}>
        {/* Header */}
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "6px" }}>
          Archive
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.03em", marginBottom: "4px" }}>
          Past Breakdowns
        </h1>
        <p style={{ fontSize: "13px", color: "#9FADBF", fontWeight: 500, marginBottom: "1rem" }}>
          Every breakdown saved from tip-off.
        </p>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#9FADBF", marginBottom: "1.75rem" }}>
          {rows.length} breakdown{rows.length !== 1 ? "s" : ""} saved
        </p>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", color: "#D0342C" }}>{error.message}</p>
          </div>
        )}

        {rows.length === 0 && !error && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8ECF2", borderRadius: "14px", padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#637A96" }}>
              No breakdowns saved yet. Generate your first breakdown from the slate.
            </p>
          </div>
        )}

        {/* Date groups */}
        {dateKeys.map((dateKey) => {
          const dateRows = groups.get(dateKey)!;
          const badge = badgeStyle;
          return (
            <div key={dateKey} style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9FADBF", marginBottom: "10px" }}>
                {formatDate(dateKey)}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dateRows.map((row) => {
                  const strip = stripColor[row.confidence_level] ?? stripColor[4];
                  const b = badge[row.confidence_level] ?? badge[4];
                  const peek = row.breakdown_content?.gameShape ?? null;

                  return (
                    <Link
                      key={row.id}
                      href={`/archive/${encodeURIComponent(row.game_id)}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{
                        background: "#FFFFFF", borderRadius: "14px", border: "1px solid #E8ECF2",
                        padding: "16px 18px", display: "flex", gap: "14px", alignItems: "stretch",
                        boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#B0BAC9";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 12px rgba(13,27,46,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#E8ECF2";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(13,27,46,0.05)";
                      }}
                      >
                        {/* Left confidence strip */}
                        <div style={{ width: "3px", borderRadius: "3px", flexShrink: 0, alignSelf: "stretch", background: strip }} />

                        {/* Body */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Top row: matchup + badge */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                            <p style={{ fontSize: "18px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.025em", lineHeight: 1 }}>
                              {row.away_team} @ {row.home_team}
                            </p>
                            <span style={{
                              fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em",
                              textTransform: "uppercase", padding: "3px 10px", borderRadius: "999px",
                              flexShrink: 0, marginLeft: "8px",
                              background: b.bg, color: b.color,
                            }}>
                              {row.confidence_label}
                            </span>
                          </div>

                          {/* Meta */}
                          <p style={{ fontSize: "11px", fontWeight: 600, color: "#B0BAC9", letterSpacing: "0.04em", marginBottom: peek ? "10px" : "10px" }}>
                            {row.sport} · {formatDate(row.game_date)}
                          </p>

                          {/* Peek text */}
                          {peek && (
                            <>
                              <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "4px" }}>
                                The Read
                              </p>
                              <p style={{
                                fontSize: "12px", fontWeight: 600, color: "#637A96", lineHeight: 1.5,
                                paddingTop: "10px", borderTop: "1px solid #F0F3F7",
                                display: "-webkit-box", WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                              }}>
                                {peek}
                              </p>
                            </>
                          )}

                          {/* CTA */}
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0A7A6C" }}>
                              View breakdown →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
