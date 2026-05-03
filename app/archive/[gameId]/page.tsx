import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import BreakdownView from "@/components/BreakdownView";
import Nav from "@/components/Nav";
import type { BreakdownResult, AnyGame } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ArchiveDetailRow {
  game_id: string;
  game_date: string;
  home_team: string;
  away_team: string;
  sport: string;
  breakdown_content: BreakdownResult;
  confidence_level: number;
  confidence_label: string;
  created_at: string;
  game_snapshot: AnyGame | null;
}

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

const NBA_TEAM_NAMES: Record<string, string> = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets",
  CHA: "Charlotte Hornets", CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks", DEN: "Denver Nuggets", DET: "Detroit Pistons",
  GS: "Golden State Warriors", GSW: "Golden State Warriors", HOU: "Houston Rockets",
  IND: "Indiana Pacers", LAC: "LA Clippers", LAL: "Los Angeles Lakers",
  MEM: "Memphis Grizzlies", MIA: "Miami Heat", MIL: "Milwaukee Bucks",
  MIN: "Minnesota Timberwolves", NO: "New Orleans Pelicans", NOP: "New Orleans Pelicans",
  NY: "New York Knicks", NYK: "New York Knicks", OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SA: "San Antonio Spurs",
  SAS: "San Antonio Spurs", TOR: "Toronto Raptors", UTA: "Utah Jazz",
  WAS: "Washington Wizards",
};

const MLB_TEAM_NAMES: Record<string, string> = {
  ARI: "Arizona Diamondbacks", ATL: "Atlanta Braves", BAL: "Baltimore Orioles",
  BOS: "Boston Red Sox", CHC: "Chicago Cubs", CWS: "Chicago White Sox",
  CIN: "Cincinnati Reds", CLE: "Cleveland Guardians", COL: "Colorado Rockies",
  DET: "Detroit Tigers", HOU: "Houston Astros", KC: "Kansas City Royals",
  LAA: "Los Angeles Angels", LAD: "Los Angeles Dodgers", MIA: "Miami Marlins",
  MIL: "Milwaukee Brewers", MIN: "Minnesota Twins", NYM: "New York Mets",
  NYY: "New York Yankees", OAK: "Oakland Athletics", ATH: "Athletics", SAC: "Athletics",
  PHI: "Philadelphia Phillies", PIT: "Pittsburgh Pirates", SD: "San Diego Padres",
  SF: "San Francisco Giants", SEA: "Seattle Mariners", STL: "St. Louis Cardinals",
  TB: "Tampa Bay Rays", TEX: "Texas Rangers", TOR: "Toronto Blue Jays",
  WSH: "Washington Nationals",
};

function getTeamName(abv: string, sport: string): string {
  const map = sport === "MLB" ? MLB_TEAM_NAMES : NBA_TEAM_NAMES;
  return map[abv] ?? abv;
}

function buildGameShell(row: ArchiveDetailRow): AnyGame {
  // Prefer the snapshot stored at generation time — it has the correct gameStatus,
  // real team names, game time, and pitcher data.
  if (row.game_snapshot) return row.game_snapshot;

  // Legacy fallback for rows that predate the game_snapshot column.
  // Use "scheduled" — we cannot determine the true status from row data alone,
  // and "final" would be wrong for any breakdown generated before game end.
  const homeName = getTeamName(row.home_team, row.sport);
  const awayName = getTeamName(row.away_team, row.sport);
  const homeTeam = {
    teamId: row.home_team, teamAbv: row.home_team, teamName: homeName,
    teamCity: homeName.split(" ").slice(0, -1).join(" "),
  };
  const awayTeam = {
    teamId: row.away_team, teamAbv: row.away_team, teamName: awayName,
    teamCity: awayName.split(" ").slice(0, -1).join(" "),
  };
  if (row.sport === "MLB") {
    return { sport: "MLB", gameId: row.game_id, gameDate: row.game_date, gameTime: "", gameStatus: "scheduled", homeTeam, awayTeam, odds: null, homePitcher: null, awayPitcher: null };
  }
  return { sport: "NBA", gameId: row.game_id, gameDate: row.game_date, gameTime: "", gameStatus: "scheduled", homeTeam, awayTeam, odds: null };
}

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId: rawGameId } = await params;
  const gameId = decodeURIComponent(rawGameId);

  const { data, error } = await supabase
    .from("breakdowns")
    .select("game_id, game_date, home_team, away_team, sport, breakdown_content, confidence_level, confidence_label, created_at, game_snapshot")
    .eq("game_id", gameId)
    .maybeSingle();

  if (error || !data) notFound();

  const row = data as ArchiveDetailRow;
  const game = buildGameShell(row);
  const breakdown = row.breakdown_content;

  const savedDate = formatDate(row.game_date);
  const savedAt = new Date(row.created_at).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div style={{ background: "var(--canvas, #FAFAFA)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav backHref="/archive" backLabel="Archive" />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        {/* Snapshot banner */}
        <div style={{ background: "#FEF3F3", border: "0.5px solid rgba(217,59,58,0.2)", borderLeft: "3px solid var(--signal, #D93B3A)", borderRadius: 0, padding: "10px 14px", fontSize: "12px", color: "var(--ink, #0E0E0E)", marginBottom: "16px", lineHeight: 1.5 }}>
          Saved {savedDate} before {row.sport === "MLB" ? "first pitch" : "tip-off"}. Lines and injury data reflect conditions at time of generation.
        </div>

        <BreakdownView breakdown={breakdown} game={game} />

        <div style={{ textAlign: "center", paddingTop: "1.5rem" }}>
          <p style={{ fontSize: "12px", fontFamily: "Georgia, serif", fontStyle: "italic", color: "var(--muted, #8A8A86)" }}>
            What the data says. Your decision to make.
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted, #8A8A86)", marginTop: "4px" }}>
            Saved {savedAt} ET
          </p>
        </div>
      </div>
    </div>
  );
}
