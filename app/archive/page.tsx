import { createClient } from "@supabase/supabase-js";
import Nav from "@/components/Nav";
import ArchiveCard from "@/components/ArchiveCard";

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
  1: "var(--signal, #D93B3A)",
  2: "var(--signal, #D93B3A)",
  3: "var(--signal, #D93B3A)",
  4: "var(--signal, #D93B3A)",
};

const badgeStyle: Record<number, { bg: string; color: string }> = {
  1: { bg: "rgba(14,14,14,0.06)", color: "var(--ink, #0E0E0E)" },
  2: { bg: "rgba(14,14,14,0.06)", color: "var(--ink, #0E0E0E)" },
  3: { bg: "rgba(14,14,14,0.06)", color: "var(--ink, #0E0E0E)" },
  4: { bg: "rgba(14,14,14,0.06)", color: "var(--ink, #0E0E0E)" },
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
    <div style={{ background: "var(--canvas, #FAFAFA)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.75rem 1.5rem 0" }}>
        {/* Header */}
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--signal, #D93B3A)", marginBottom: "6px" }}>
          Archive
        </p>
        <h1 style={{ fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: 500, color: "var(--ink, #0E0E0E)", letterSpacing: "-0.03em", marginBottom: "4px" }}>
          Past Breakdowns
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted, #8A8A86)", lineHeight: 1.6, marginBottom: "1rem" }}>
          Every breakdown saved from tip-off.
        </p>
        <p style={{ fontSize: "12px", color: "var(--muted, #8A8A86)", marginBottom: "1.75rem" }}>
          {rows.length} breakdown{rows.length !== 1 ? "s" : ""} saved
        </p>

        {error && (
          <div style={{ background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "6px", padding: "10px 14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", color: "var(--signal, #D93B3A)" }}>{error.message}</p>
          </div>
        )}

        {rows.length === 0 && !error && (
          <div style={{ background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "6px", padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--muted, #8A8A86)" }}>
              No breakdowns saved yet. Generate your first breakdown from the slate.
            </p>
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

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dateRows.map((row) => {
                  const strip = stripColor[row.confidence_level] ?? stripColor[4];
                  const b = badgeStyle[row.confidence_level] ?? badgeStyle[4];
                  const peek = row.breakdown_content?.gameShape ?? null;

                  return (
                    <ArchiveCard
                      key={row.id}
                      gameId={row.game_id}
                      homeTeam={row.home_team}
                      awayTeam={row.away_team}
                      sport={row.sport}
                      gameDate={row.game_date}
                      confidenceLevel={row.confidence_level}
                      confidenceLabel={row.confidence_label}
                      peek={peek}
                      stripColor={strip}
                      badgeBg={b.bg}
                      badgeColor={b.color}
                      formattedDate={formatDate(row.game_date)}
                    />
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
