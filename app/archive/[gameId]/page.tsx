import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import BreakdownView from "@/components/BreakdownView";
import type { BreakdownResult, AnyGame } from "@/lib/types";

// Server component — reads saved snapshot from Supabase, no live API calls
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

// Full team name lookup — avoids live API calls for display purposes
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
  NYY: "New York Yankees", OAK: "Oakland Athletics", PHI: "Philadelphia Phillies",
  PIT: "Pittsburgh Pirates", SD: "San Diego Padres", SF: "San Francisco Giants",
  SEA: "Seattle Mariners", STL: "St. Louis Cardinals", TB: "Tampa Bay Rays",
  TEX: "Texas Rangers", TOR: "Toronto Blue Jays", WSH: "Washington Nationals",
};

function getTeamName(abv: string, sport: string): string {
  const map = sport === "MLB" ? MLB_TEAM_NAMES : NBA_TEAM_NAMES;
  return map[abv] ?? abv;
}

/**
 * Build a minimal AnyGame shell from the archived row so BreakdownView renders correctly.
 * Odds are set to null since they were captured at generation time but not stored separately.
 * gameStatus is "final" for all archived games.
 */
function buildGameShell(row: ArchiveDetailRow): AnyGame {
  const homeName = getTeamName(row.home_team, row.sport);
  const awayName = getTeamName(row.away_team, row.sport);

  const homeTeam = {
    teamId: row.home_team,
    teamAbv: row.home_team,
    teamName: homeName,
    teamCity: homeName.split(" ").slice(0, -1).join(" "),
  };
  const awayTeam = {
    teamId: row.away_team,
    teamAbv: row.away_team,
    teamName: awayName,
    teamCity: awayName.split(" ").slice(0, -1).join(" "),
  };

  if (row.sport === "MLB") {
    return {
      sport: "MLB",
      gameId: row.game_id,
      gameDate: row.game_date,
      gameTime: "",
      gameStatus: "final",
      homeTeam,
      awayTeam,
      odds: null,
      homePitcher: null,
      awayPitcher: null,
    };
  }

  return {
    sport: "NBA",
    gameId: row.game_id,
    gameDate: row.game_date,
    gameTime: "",
    gameStatus: "final",
    homeTeam,
    awayTeam,
    odds: null,
  };
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
    .select("game_id, game_date, home_team, away_team, sport, breakdown_content, confidence_level, confidence_label, created_at")
    .eq("game_id", gameId)
    .single();

  if (error || !data) {
    notFound();
  }

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
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Nav — fixed so it never scrolls with content */}
      <header className="border-b border-[#E0E5EE] bg-white fixed top-0 left-0 right-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/archive"
            className="font-mono text-xs text-[#6B7A90] hover:text-[#0A7A6C] transition-colors"
          >
            ← Archive
          </Link>
          <span className="text-[#E0E5EE]">|</span>
          <span className="font-heading text-base font-bold text-[#0D1B2E]">Clearbet</span>
          <span className="font-mono text-xs text-[#0A7A6C] tracking-widest uppercase">{row.sport}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        {/* Saved snapshot banner */}
        <div className="bg-[#F4F6F9] border border-[#E0E5EE] rounded-xl px-5 py-3 mb-4">
          <p className="font-mono text-[10px] text-[#6B7A90] leading-relaxed">
            This breakdown was saved on {savedDate} before tip-off. Lines and injury data reflect conditions at time of generation.
          </p>
        </div>

        <BreakdownView breakdown={breakdown} game={game} />

        <p className="mt-10 text-center font-mono text-xs text-[#6B7A90]">
          Saved {savedAt} ET
        </p>
      </main>
    </div>
  );
}
