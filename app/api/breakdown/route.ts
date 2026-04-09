import { NextRequest, NextResponse } from "next/server";
import { getGamesForDate, getTeamStats, getRecentForm, getInjuryReport } from "@/lib/tank01";
import { fetchNBAOdds, buildMatchupKey, fetchMLBOdds } from "@/lib/odds-api";
import { generateBreakdown } from "@/lib/claude";
import {
  getMLBGamesForDate,
  getMLBTeamStats,
  getMLBRecentForm,
  getMLBInjuryReport,
  getMLBStartingPitcher,
} from "@/lib/tank01-mlb";
import { generateMLBBreakdown } from "@/lib/claude-mlb";
import { supabase } from "@/lib/supabase";
import type {
  GameDetailData,
  MLBGameDetailData,
  NBAGame,
  MLBGame,
  BreakdownApiResponse,
  Sport,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  let gameId: string;
  let sport: Sport;

  try {
    const body = await req.json();
    gameId = body?.gameId;
    sport = (body?.sport ?? "NBA") as Sport;
    if (!gameId || typeof gameId !== "string") {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (sport === "MLB") {
    return handleMLBBreakdown(gameId);
  }
  return handleNBABreakdown(gameId);
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

    const { homeTeam, awayTeam } = rawGame;
    const [homeStats, awayStats, homeForm, awayForm, injuryReport, oddsMap] = await Promise.all([
      getTeamStats(homeTeam.teamAbv),
      getTeamStats(awayTeam.teamAbv),
      getRecentForm(homeTeam.teamAbv),
      getRecentForm(awayTeam.teamAbv),
      getInjuryReport(homeTeam.teamAbv, awayTeam.teamAbv),
      fetchNBAOdds().catch(() => new Map()),
    ]);

    const oddsKey = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
    const odds = oddsMap.get(oddsKey)?.odds ?? null;

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
      injuries: injuryReport,
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
        },
        { onConflict: "game_id" }
      )
      .then(({ error }) => {
        if (error) console.error("[breakdown:NBA] supabase upsert failed:", error.message);
        else console.log("[breakdown:NBA] archived to supabase");
      });

    const response: BreakdownApiResponse = { breakdown, game, sport: "NBA" };
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
    const [homeStats, awayStats, homeForm, awayForm, injuryReport, oddsMap, homePitcher, awayPitcher] =
      await Promise.all([
        getMLBTeamStats(homeTeam.teamAbv),
        getMLBTeamStats(awayTeam.teamAbv),
        getMLBRecentForm(homeTeam.teamAbv),
        getMLBRecentForm(awayTeam.teamAbv),
        getMLBInjuryReport(homeTeam.teamAbv, awayTeam.teamAbv),
        fetchMLBOdds().catch(() => new Map()),
        getMLBStartingPitcher(rawGame.probableStarterHomeId, homeTeam.teamAbv).catch(() => null),
        getMLBStartingPitcher(rawGame.probableStarterAwayId, awayTeam.teamAbv).catch(() => null),
      ]);

    const oddsKey = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
    const mlbOdds = oddsMap.get(oddsKey)?.mlbOdds ?? null;

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
        },
        { onConflict: "game_id" }
      )
      .then(({ error }) => {
        if (error) console.error("[breakdown:MLB] supabase upsert failed:", error.message);
        else console.log("[breakdown:MLB] archived to supabase");
      });

    const response: BreakdownApiResponse = { breakdown, game, sport: "MLB" };
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
