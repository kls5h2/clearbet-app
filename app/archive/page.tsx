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
}

const confidenceStyles: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-[#DCFCE7]", text: "text-[#166534]", label: "CLEAR" },
  2: { bg: "bg-[#E6F4F2]", text: "text-[#0A7A6C]", label: "LEAN" },
  3: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "FRAGILE" },
  4: { bg: "bg-[#F1F4F8]", text: "text-[#64748B]", label: "PASS" },
};

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
    .select("id, game_id, game_date, home_team, away_team, sport, confidence_level, confidence_label, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: ArchiveRow[] = data ?? [];
  const groups = groupByDate(rows);
  const dateKeys = Array.from(groups.keys());

  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      <Nav backHref="/" backLabel="← Home" />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-[26px] font-extrabold text-[#0D1B2E] leading-tight">
            Archive
          </h1>
          <p className="mt-1 font-mono text-[11px] font-medium text-[#9FADBF] tracking-wide">
            {rows.length} breakdown{rows.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-5 py-4 mb-5">
            <p className="font-mono text-[11px] text-[#D0342C]">{error.message}</p>
          </div>
        )}

        {rows.length === 0 && !error && (
          <div className="bg-white border border-[#E8ECF2] rounded-xl px-5 py-10 text-center shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
            <p className="text-[14px] text-[#637A96]">
              No breakdowns saved yet. Generate your first breakdown from the slate.
            </p>
          </div>
        )}

        {/* Date groups */}
        <div className="space-y-8">
          {dateKeys.map((dateKey) => {
            const dateRows = groups.get(dateKey)!;
            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="font-mono text-[10px] font-bold text-[#9FADBF] tracking-[0.1em] uppercase whitespace-nowrap">
                    {formatDate(dateKey)}
                  </p>
                  <div className="flex-1 h-px bg-[#E8ECF2]" />
                </div>

                {/* Strip cards */}
                <div className="bg-white border border-[#E8ECF2] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
                  {dateRows.map((row, idx) => {
                    const style = confidenceStyles[row.confidence_level] ?? confidenceStyles[4];
                    const isLast = idx === dateRows.length - 1;
                    return (
                      <Link
                        key={row.id}
                        href={`/archive/${encodeURIComponent(row.game_id)}`}
                        className={`flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#F7F9FC] transition-colors duration-150 group ${
                          !isLast ? "border-b border-[#EEF1F5]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Sport pill */}
                          <span className="font-mono text-[9px] font-bold text-[#9FADBF] tracking-[0.1em] uppercase shrink-0">
                            {row.sport}
                          </span>
                          {/* Matchup */}
                          <p className="font-heading text-[15px] font-bold text-[#0D1B2E] truncate">
                            {row.away_team} @ {row.home_team}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Confidence badge */}
                          <span className={`inline-flex items-center px-[8px] py-[2px] rounded-full font-mono text-[9px] font-extrabold uppercase tracking-widest ${style.bg} ${style.text}`}>
                            {row.confidence_label}
                          </span>
                          {/* Arrow */}
                          <span className="font-mono text-[11px] text-[#B0BAC9] group-hover:text-[#0A7A6C] transition-colors">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
