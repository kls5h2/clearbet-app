import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Server component — fetches directly from Supabase
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

const confidenceColors: Record<number, { dot: string; text: string }> = {
  1: { dot: "bg-[#0A7A6C]", text: "text-[#0A7A6C]" },
  2: { dot: "bg-[#1D4ED8]", text: "text-[#1D4ED8]" },
  3: { dot: "bg-[#B45309]", text: "text-[#B45309]" },
  4: { dot: "bg-[#D0342C]", text: "text-[#D0342C]" },
};

function formatDate(dateStr: string): string {
  // dateStr is YYYYMMDD — avoid UTC midnight parsing by building manually
  if (dateStr.length === 8) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[m - 1]} ${d}, ${y}`;
  }
  return dateStr;
}

export default async function ArchivePage() {
  const { data, error } = await supabase
    .from("breakdowns")
    .select("id, game_id, game_date, home_team, away_team, sport, confidence_level, confidence_label, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: ArchiveRow[] = data ?? [];

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[#0A7A6C] tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-heading text-3xl font-extrabold text-[#0D1B2E]">
            Breakdown Archive
          </h1>
          <p className="text-sm text-[#6B7A90] mt-1">
            {rows.length} breakdown{rows.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 mb-6">
            <p className="font-mono text-xs text-red-600">{error.message}</p>
          </div>
        )}

        {rows.length === 0 && !error && (
          <div className="bg-white border border-[#E0E5EE] rounded-xl px-5 py-8 text-center">
            <p className="text-[#6B7A90]">No breakdowns saved yet. Generate your first breakdown from the slate.</p>
          </div>
        )}

        <div className="space-y-3">
          {rows.map((row) => {
            const colors = confidenceColors[row.confidence_level] ?? confidenceColors[4];
            return (
              <Link
                key={row.id}
                href={`/archive/${encodeURIComponent(row.game_id)}`}
                className="block bg-white border border-[#E0E5EE] rounded-xl px-5 py-4 hover:border-[#0A7A6C] hover:shadow-sm transition-all duration-150"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-heading text-base font-bold text-[#0D1B2E]">
                      {row.away_team} @ {row.home_team}
                    </p>
                    <p className="font-mono text-xs text-[#6B7A90] mt-0.5">
                      {formatDate(row.game_date)} · {row.sport}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className={`font-mono text-xs font-semibold ${colors.text}`}>
                      {row.confidence_label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
