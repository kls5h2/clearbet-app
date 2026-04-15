import { NextRequest, NextResponse } from "next/server";
import { getGamesForDate, getTeamStats, getRecentForm, getInjuryReport, getPlayoffContext, getH2HRecord } from "@/lib/tank01";
import { fetchNBAOdds, buildMatchupKey, fetchMLBOdds, type OddsMatchup } from "@/lib/odds-api";
import { generateBreakdown } from "@/lib/claude";
import {
  getMLBGamesForDate,
  getMLBTeamStats,
  getMLBRecentForm,
  getMLBInjuryReport,
  getMLBStartingPitcher,
  getMLBH2HRecord,
} from "@/lib/tank01-mlb";
import {
  fetchMLBProbableStarters,
  getMLBPlayoffContext,
  getMLBBullpenStats,
  getMLBUmpire,
} from "@/lib/mlb-stats-api";
import { generateMLBBreakdown } from "@/lib/claude-mlb";
import { supabase } from "@/lib/supabase";
import { recordOpeningLine, getOpeningLine, calcLineMovement } from "@/lib/opening-lines";
import type {
  GameDetailData,
  MLBGameDetailData,
  NBAGame,
  MLBGame,
  MLBParkFactor,
  BreakdownApiResponse,
  Sport,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  let gameId: string;
  let sport: Sport;
  let regenerate: boolean;

  try {
    const body = await req.json();
    gameId = body?.gameId;
    sport = (body?.sport ?? "NBA") as Sport;
    regenerate = body?.regenerate === true;
    if (!gameId || typeof gameId !== "string") {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Cache check — serve from Supabase if a breakdown exists and regenerate not requested
  if (!regenerate) {
    const cached = await getCachedBreakdown(gameId);
    if (cached) {
      console.log(`[breakdown] serving from cache: gameId=${gameId}`);
      return NextResponse.json(cached);
    }
  }

  if (sport === "MLB") {
    return handleMLBBreakdown(gameId);
  }
  return handleNBABreakdown(gameId);
}

/**
 * Check Supabase for an existing breakdown for this game.
 * Returns the full BreakdownApiResponse if found, null otherwise.
 */
async function getCachedBreakdown(gameId: string): Promise<BreakdownApiResponse | null> {
  try {
    const { data, error } = await supabase
      .from("breakdowns")
      .select("breakdown_content, sport, home_team, away_team, game_date, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const content = data.breakdown_content as import("@/lib/types").BreakdownResult;
    if (!content) return null;

    // Reconstruct a minimal game object from what we have stored
    const sport = (data.sport ?? "NBA") as Sport;
    const today = getTodayDateString();
    const game: import("@/lib/types").AnyGame = sport === "MLB"
      ? {
          sport: "MLB",
          gameId,
          gameDate: data.game_date ?? today,
          gameTime: "",
          gameStatus: "scheduled",
          homeTeam: { teamId: data.home_team, teamAbv: data.home_team, teamName: data.home_team, teamCity: "" },
          awayTeam: { teamId: data.away_team, teamAbv: data.away_team, teamName: data.away_team, teamCity: "" },
          odds: null,
          homePitcher: null,
          awayPitcher: null,
        }
      : {
          sport: "NBA",
          gameId,
          gameDate: data.game_date ?? today,
          gameTime: "",
          gameStatus: "scheduled",
          homeTeam: { teamId: data.home_team, teamAbv: data.home_team, teamName: data.home_team, teamCity: "" },
          awayTeam: { teamId: data.away_team, teamAbv: data.away_team, teamName: data.away_team, teamCity: "" },
          odds: null,
        };

    return {
      breakdown: content,
      game,
      sport,
      fromCache: true,
      generatedAt: data.created_at ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Detect whether Tank01's home/away disagrees with The Odds API.
 * The Odds API is authoritative for Play-In and Playoff home court.
 * Returns true when the Odds API's home team matches Tank01's *away* team.
 */
function isHomeAwayFlipped(tank01HomeName: string, tank01AwayName: string, oddsMatchup: OddsMatchup): boolean {
  const oddsHome = oddsMatchup.homeTeam.toLowerCase();
  const t01Home = tank01HomeName.toLowerCase();
  const t01Away = tank01AwayName.toLowerCase();

  // Direct full-name match
  if (oddsHome === t01Home) return false;
  if (oddsHome === t01Away) return true;

  // Nickname fallback (handles "LA Clippers" vs "Los Angeles Clippers")
  const nick = (name: string) => name.split(" ").pop()?.toLowerCase() ?? "";
  if (nick(oddsMatchup.homeTeam) === nick(tank01HomeName)) return false;
  if (nick(oddsMatchup.homeTeam) === nick(tank01AwayName)) return true;

  return false; // indeterminate — trust Tank01
}

async function handleNBABreakdown(gameId: string): Promise<NextResponse> {
  try {
    const today = getTodayDateString();
    console.log(`[breakdown:NBA] gameId=${gameId} date=${today}`);

    const allGames = await getGamesForDate(today);
    const rawGame = allGames.find((g) => g.gameId === gameId);
    if (!rawGame) {
      console.error(`[breakdown:NBA] game not found: ${gameId}`);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Tank01's home/away — may be wrong for Play-In / Playoff games
    const t01Home = rawGame.homeTeam;
    const t01Away = rawGame.awayTeam;

    // Fetch all data in parallel using Tank01's designations
    const [t01HomeStats, t01AwayStats, t01HomeForm, t01AwayForm, t01Injuries, oddsMap, t01Playoff, t01H2H] = await Promise.all([
      getTeamStats(t01Home.teamAbv),
      getTeamStats(t01Away.teamAbv),
      getRecentForm(t01Home.teamAbv),
      getRecentForm(t01Away.teamAbv),
      getInjuryReport(t01Home.teamAbv, t01Away.teamAbv),
      fetchNBAOdds().catch(() => new Map()),
      getPlayoffContext(t01Home.teamAbv, t01Away.teamAbv).catch(() => ({ home: null, away: null })),
      getH2HRecord(t01Home.teamAbv, t01Away.teamAbv).catch(() => null),
    ]);

    // Cross-validate home/away with The Odds API (authoritative for Play-In / Playoff)
    const oddsKey = buildMatchupKey(t01Home.teamName, t01Away.teamName);
    const oddsMatchup = oddsMap.get(oddsKey) ?? null;
    const odds = oddsMatchup?.odds ?? null;

    const flipped = oddsMatchup ? isHomeAwayFlipped(t01Home.teamName, t01Away.teamName, oddsMatchup) : false;
    if (flipped) {
      console.log(`[breakdown:NBA] HOME/AWAY FLIP: Odds API says "${oddsMatchup!.homeTeam}" is home, Tank01 had "${t01Home.teamName}"`);
    }

    // Assign to correct home/away slots — swap everything when Odds API disagrees
    const homeTeam      = flipped ? t01Away : t01Home;
    const awayTeam      = flipped ? t01Home : t01Away;
    const homeStats     = flipped ? t01AwayStats : t01HomeStats;
    const awayStats     = flipped ? t01HomeStats : t01AwayStats;
    const homeForm      = flipped ? t01AwayForm : t01HomeForm;
    const awayForm      = flipped ? t01HomeForm : t01AwayForm;
    const injuries      = flipped
      ? { homeInjuries: t01Injuries.awayInjuries, awayInjuries: t01Injuries.homeInjuries }
      : t01Injuries;
    const playoffCtx    = flipped
      ? { home: t01Playoff.away, away: t01Playoff.home }
      : t01Playoff;
    const h2h           = flipped && t01H2H
      ? { wins: t01H2H.losses, losses: t01H2H.wins, games: t01H2H.games, avgMarginFor: t01H2H.avgMarginAgainst, avgMarginAgainst: t01H2H.avgMarginFor }
      : t01H2H;

    // Record opening line (insert-only, non-blocking) then fetch it for movement calc
    recordOpeningLine(
      gameId, today,
      homeTeam.teamAbv, awayTeam.teamAbv, "NBA",
      odds?.spread ?? null,
      odds?.total ?? null,
      odds?.homeMoneyline ?? null,
      odds?.awayMoneyline ?? null,
    );
    const openingLine = await getOpeningLine(gameId);
    const lineMovement = calcLineMovement(
      openingLine,
      odds?.spread ?? null,
      odds?.total ?? null,
      odds?.homeMoneyline ?? null,
      odds?.awayMoneyline ?? null,
    );

    const game: NBAGame = {
      sport: "NBA",
      gameId: rawGame.gameId,
      gameDate: rawGame.gameDate,
      gameTime: rawGame.gameTime,
      gameStatus: rawGame.gameStatus,
      homeTeam,
      awayTeam,
      odds,
    };

    const detailData: GameDetailData = {
      game,
      homeTeamStats: homeStats,
      awayTeamStats: awayStats,
      homeRecentForm: homeForm,
      awayRecentForm: awayForm,
      injuries,
      homePlayoffContext: playoffCtx.home,
      awayPlayoffContext: playoffCtx.away,
      h2h,
      lineMovement,
    };

    console.log("[breakdown:NBA] calling Claude...");
    const breakdown = await generateBreakdown(detailData);
    console.log(`[breakdown:NBA] confidenceLevel=${breakdown.confidenceLevel}`);

    // Archive (non-blocking)
    supabase
      .from("breakdowns")
      .upsert(
        {
          game_id: game.gameId,
          game_date: today,
          home_team: homeTeam.teamAbv,
          away_team: awayTeam.teamAbv,
          sport: "NBA",
          breakdown_content: breakdown,
          confidence_level: breakdown.confidenceLevel,
          confidence_label: breakdown.confidenceLabel,
          user_id: null, // TODO: pass real user ID when Auth is live
        },
        { onConflict: "game_id" }
      )
      .then(({ error }) => {
        if (error) console.error("[breakdown:NBA] supabase upsert failed:", error.message);
        else console.log("[breakdown:NBA] archived to supabase");
      });

    const generatedAt = new Date().toISOString();
    const response: BreakdownApiResponse = { breakdown, game, sport: "NBA", fromCache: false, generatedAt };
    return NextResponse.json(response);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[breakdown:NBA] FAILED:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to generate breakdown" }, { status: 500 });
  }
}

async function handleMLBBreakdown(gameId: string): Promise<NextResponse> {
  try {
    const today = getTodayDateString();
    console.log(`[breakdown:MLB] gameId=${gameId} date=${today}`);

    const allGames = await getMLBGamesForDate(today);
    const rawGame = allGames.find((g) => g.gameId === gameId);
    if (!rawGame) {
      console.error(`[breakdown:MLB] game not found: ${gameId}`);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { homeTeam, awayTeam } = rawGame;
    const [
      homeStats, awayStats, homeForm, awayForm, injuryReport, oddsMap,
      mlbStatsPitchers, playoffCtx, h2h, homeBullpen, awayBullpen, umpire,
    ] = await Promise.all([
      getMLBTeamStats(homeTeam.teamAbv),
      getMLBTeamStats(awayTeam.teamAbv),
      getMLBRecentForm(homeTeam.teamAbv),
      getMLBRecentForm(awayTeam.teamAbv),
      getMLBInjuryReport(homeTeam.teamAbv, awayTeam.teamAbv),
      fetchMLBOdds().catch(() => new Map()),
      fetchMLBProbableStarters(today).catch(() => new Map()),
      getMLBPlayoffContext(homeTeam.teamAbv, awayTeam.teamAbv).catch(() => ({ home: null, away: null })),
      getMLBH2HRecord(homeTeam.teamAbv, awayTeam.teamAbv).catch(() => null),
      getMLBBullpenStats(homeTeam.teamAbv).catch(() => null),
      getMLBBullpenStats(awayTeam.teamAbv).catch(() => null),
      getMLBUmpire(today, homeTeam.teamAbv).catch(() => null),
    ]);

    const statsEntry =
      mlbStatsPitchers.get(homeTeam.teamAbv) ??
      mlbStatsPitchers.get(awayTeam.teamAbv) ??
      null;

    const homePitcher =
      statsEntry?.home ??
      (await getMLBStartingPitcher(rawGame.probableStarterHomeId, homeTeam.teamAbv).catch(() => null));
    const awayPitcher =
      statsEntry?.away ??
      (await getMLBStartingPitcher(rawGame.probableStarterAwayId, awayTeam.teamAbv).catch(() => null));

    const MLB_PARK_FACTORS: Record<string, MLBParkFactor> = {
      COL: { parkName: "Coors Field", factor: "high" },
      SD:  { parkName: "Petco Park", factor: "low" },
      SF:  { parkName: "Oracle Park", factor: "low" },
      CIN: { parkName: "Great American Ball Park", factor: "high" },
    };
    const parkFactor = MLB_PARK_FACTORS[homeTeam.teamAbv] ?? null;

    const oddsKey = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
    const mlbOdds = oddsMap.get(oddsKey)?.mlbOdds ?? null;

    // Record opening line (insert-only, non-blocking) then fetch it for movement calc
    recordOpeningLine(
      gameId, today,
      homeTeam.teamAbv, awayTeam.teamAbv, "MLB",
      mlbOdds?.runLine ?? null,
      mlbOdds?.total ?? null,
      mlbOdds?.homeMoneyline ?? null,
      mlbOdds?.awayMoneyline ?? null,
    );
    const openingLine = await getOpeningLine(gameId);
    const lineMovement = calcLineMovement(
      openingLine,
      mlbOdds?.runLine ?? null,
      mlbOdds?.total ?? null,
      mlbOdds?.homeMoneyline ?? null,
      mlbOdds?.awayMoneyline ?? null,
    );

    const game: MLBGame = {
      sport: "MLB",
      gameId: rawGame.gameId,
      gameDate: rawGame.gameDate,
      gameTime: rawGame.gameTime,
      gameStatus: rawGame.gameStatus,
      homeTeam,
      awayTeam,
      odds: mlbOdds,
      homePitcher,
      awayPitcher,
    };

    const detailData: MLBGameDetailData = {
      game,
      homeTeamStats: homeStats,
      awayTeamStats: awayStats,
      homeRecentForm: homeForm,
      awayRecentForm: awayForm,
      injuries: injuryReport,
      homePlayoffContext: playoffCtx.home,
      awayPlayoffContext: playoffCtx.away,
      homeBullpen,
      awayBullpen,
      h2h,
      parkFactor,
      umpire,
      lineMovement,
    };

    console.log("[breakdown:MLB] calling Claude...");
    const breakdown = await generateMLBBreakdown(detailData);
    console.log(`[breakdown:MLB] confidenceLevel=${breakdown.confidenceLevel}`);

    // Archive (non-blocking)
    supabase
      .from("breakdowns")
      .upsert(
        {
          game_id: game.gameId,
          game_date: today,
          home_team: homeTeam.teamAbv,
          away_team: awayTeam.teamAbv,
          sport: "MLB",
          breakdown_content: breakdown,
          confidence_level: breakdown.confidenceLevel,
          confidence_label: breakdown.confidenceLabel,
          user_id: null, // TODO: pass real user ID when Auth is live
        },
        { onConflict: "game_id" }
      )
      .then(({ error }) => {
        if (error) console.error("[breakdown:MLB] supabase upsert failed:", error.message);
        else console.log("[breakdown:MLB] archived to supabase");
      });

    const generatedAt = new Date().toISOString();
    const response: BreakdownApiResponse = { breakdown, game, sport: "MLB", fromCache: false, generatedAt };
    return NextResponse.json(response);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[breakdown:MLB] FAILED:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to generate breakdown" }, { status: 500 });
  }
}

function getTodayDateString(): string {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}
