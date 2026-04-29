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
import { fetchESPNNBAInjuries } from "@/lib/espn-nba-injuries";
import { fetchESPNNBASeries } from "@/lib/espn-nba-series";
import { generateMLBBreakdown } from "@/lib/claude-mlb";
import { supabase } from "@/lib/supabase";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { recordOpeningLine, getOpeningLine, calcLineMovement } from "@/lib/opening-lines";
import { getStartOfDayET } from "@/lib/usage-window";
import { buildLightGame } from "@/lib/light-game";
import type {
  GameDetailData,
  MLBGameDetailData,
  NBAGame,
  MLBGame,
  MLBParkFactor,
  BreakdownApiResponse,
  Sport,
} from "@/lib/types";

/**
 * Upsert a breakdown into Supabase with full diagnostic logging.
 * Runs 3 queries: a pre-check (insert vs update), the upsert itself, and a
 * read-back to confirm what actually landed in the card_summary column.
 *
 * Intentionally awaited (not fire-and-forget) so the diagnostics complete
 * before the request's log stream closes. The HTTP response to the client
 * has already been sent by the caller — this runs in the background of the
 * request lifecycle.
 */
async function archiveBreakdown(params: {
  sport: Sport;
  gameId: string;
  gameDate: string;
  homeAbv: string;
  awayAbv: string;
  breakdown: import("@/lib/types").BreakdownResult;
  game: import("@/lib/types").AnyGame; // full matchup object for cache-hit rehydration
  userId: string | null;
}): Promise<void> {
  const { sport, gameId, gameDate, homeAbv, awayAbv, breakdown, game, userId } = params;
  const tag = `[breakdown:${sport}:archive]`;
  // Service-role client bypasses RLS — breakdowns has no INSERT/UPDATE policies
  // for the anon role, so writes from the anon client would fail post-RLS.
  const sb = createServiceClient();

  // 1. Pre-check: does a row already exist? (insert vs update classification)
  const { data: pre, error: preErr } = await sb
    .from("breakdowns")
    .select("created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1);
  const wasExisting = !preErr && Array.isArray(pre) && pre.length > 0;
  const preCreatedAt = wasExisting ? pre![0].created_at : null;

  const incomingSummary = breakdown.cardSummary || "";
  console.log(`${tag} game_id=${gameId} — ${wasExisting ? `UPDATE (existing row from ${preCreatedAt})` : "INSERT (new row)"}`);
  console.log(`${tag} card_summary being written: "${incomingSummary.slice(0, 120)}${incomingSummary.length > 120 ? "…" : ""}"`);

  // 2. Upsert
  // NOTE: we overwrite created_at on every write so it always reflects the
  // time of the CURRENTLY-STORED content. On regeneration the upsert takes
  // the UPDATE path; without this explicit value Supabase preserves the
  // original INSERT timestamp and the "Breakdown generated at …" banner on
  // cache-hit page loads would continue showing the stale first-gen time.
  const now = new Date().toISOString();
  const { error: upsertErr } = await sb
    .from("breakdowns")
    .upsert(
      {
        game_id: gameId,
        game_date: gameDate,
        home_team: homeAbv,
        away_team: awayAbv,
        sport,
        breakdown_content: breakdown,
        game_snapshot: game,                    // full game object at time of generation
        card_summary: breakdown.cardSummary || null,
        share_hook: breakdown.shareHook || null,
        confidence_level: breakdown.confidenceLevel,
        confidence_label: breakdown.confidenceLabel,
        user_id: userId,
        created_at: now,
      },
      { onConflict: "game_id" }
    );

  if (upsertErr) {
    console.error(`${tag} upsert FAILED for ${gameId}:`, upsertErr.message);
    return;
  }
  console.log(`${tag} upsert completed for ${gameId}`);

  // 3. Read-back: what actually got stored?
  const { data: post, error: postErr } = await sb
    .from("breakdowns")
    .select("card_summary, share_hook, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (postErr || !post || post.length === 0) {
    console.error(`${tag} READBACK FAILED for ${gameId}:`, postErr?.message ?? "no rows");
    return;
  }
  const stored = post[0];
  const storedSummary = stored.card_summary ?? "";
  const match = storedSummary === incomingSummary;
  console.log(
    `${tag} readback for ${gameId}: ` +
    `card_summary="${storedSummary.slice(0, 120)}${storedSummary.length > 120 ? "…" : ""}" ` +
    `(row created ${stored.created_at}) — ${match ? "MATCH" : "MISMATCH with incoming"}`
  );
  if (!match) {
    console.warn(`${tag} !! stored value differs from incoming — another write may have raced, or onConflict failed (missing UNIQUE constraint on game_id?)`);
  }
}

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

  // Auth check — breakdown access requires a logged-in user.
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to generate breakdowns" },
      { status: 401 }
    );
  }

  // Tier lookup up front — needed for the MLB Pro gate, which applies to
  // both cache hits and fresh generation. One extra query per request, but
  // we also use the profile row for the diagnostic log below.
  const { data: profile, error: profileErr } = await authClient
    .from("profiles")
    .select("tier, email, stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.error(`[breakdown] profile lookup FAILED for user=${user.id}:`, profileErr.message);
  }
  if (!profile) {
    console.warn(`[breakdown] no profile row for user=${user.id} — defaulting to free tier. Check that handle_new_user trigger fired on signup.`);
  }

  const tier = (profile?.tier ?? "free") as "free" | "pro";
  console.log(
    `[breakdown] gating: user=${user.id} email=${profile?.email ?? "unknown"} ` +
    `tier=${tier} sport=${sport} stripe_customer_id=${profile?.stripe_customer_id ?? "null"} ` +
    `subscription_status=${profile?.subscription_status ?? "null"}`
  );

  // MLB is a Pro-only sport. Gate applies to cached and fresh alike.
  // Soft gate — return game context so the page shows header + odds with a
  // blurred body + upsell, instead of a redirect or bare 403.
  if (sport === "MLB" && tier === "free") {
    console.warn(`[breakdown] soft gate (MLB) for user=${user.id}`);
    const game = await buildLightGame(gameId, "MLB");
    if (!game) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }
    return NextResponse.json({
      breakdown: null,
      game,
      sport: "MLB",
      fromCache: false,
      generatedAt: null,
      tier,
      gated: "mlb",
    });
  }

  // Cache check — serves cached breakdowns without counting toward usage.
  if (!regenerate) {
    const cached = await getCachedBreakdown(gameId);
    if (cached) {
      console.log(`[breakdown] serving from cache: gameId=${gameId} user=${user.id}`);
      return NextResponse.json({ ...cached, tier });
    }
  }

  // Fresh generation — 1/day cap for free tier. Window is the current ET
  // calendar day (midnight-to-midnight ET), NOT a rolling 24h. Resets at 00:00 ET.
  if (tier === "free") {
    const startOfDayET = getStartOfDayET();
    const { count } = await authClient
      .from("breakdown_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfDayET);
    const used = count ?? 0;
    if (used >= 1) {
      console.warn(`[breakdown] soft gate (cap) for user=${user.id}: ${used}/1 used since ${startOfDayET}`);
      const game = await buildLightGame(gameId, sport);
      if (!game) {
        return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
      }
      return NextResponse.json({
        breakdown: null,
        game,
        sport,
        fromCache: false,
        generatedAt: null,
        tier,
        gated: "cap",
      });
    }
    console.log(`[breakdown] free-tier usage: ${used}/1 since ${startOfDayET} for user=${user.id}`);
  }

  const response = sport === "MLB"
    ? await handleMLBBreakdown(gameId, user.id)
    : await handleNBABreakdown(gameId, user.id);

  if (response.status !== 200) return response;

  // Record usage and re-wrap body so the client gets `tier` alongside the
  // generated breakdown — the UI uses it to gate Share / Regenerate.
  authClient
    .from("breakdown_usage")
    .insert({ user_id: user.id })
    .then(({ error }) => {
      if (error) console.error("[breakdown] usage insert failed:", error.message);
    });

  const bodyJson = await response.json();
  return NextResponse.json({ ...bodyJson, tier });
}

/**
 * Check Supabase for an existing breakdown for this game.
 * Returns the full BreakdownApiResponse if found, null otherwise.
 */
async function getCachedBreakdown(gameId: string): Promise<BreakdownApiResponse | null> {
  try {
    // NOTE: we deliberately DO NOT use .single() here — it errors when the
    // result set is 0 rows, which silently triggers regeneration on first
    // visit and masks real problems. Take the first element of the array.
    const { data, error } = await supabase
      .from("breakdowns")
      .select("breakdown_content, game_snapshot, sport, home_team, away_team, game_date, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(`[breakdown] cache lookup error for ${gameId}:`, error.message);
      return null;
    }
    if (!data || data.length === 0) {
      console.log(`[breakdown] cache miss: no row for ${gameId}`);
      return null;
    }
    const row = data[0];

    const content = row.breakdown_content as import("@/lib/types").BreakdownResult;
    if (!content) {
      console.warn(`[breakdown] row exists for ${gameId} but breakdown_content is null — treating as miss`);
      return null;
    }

    const sport = (row.sport ?? "NBA") as Sport;
    const today = getTodayDateString();

    // Prefer the full game snapshot stored at save time — it has real team
    // names, game time, and MLB pitcher data. Fall back to the minimal
    // reconstruction only for legacy rows generated before the column existed.
    const snapshot = row.game_snapshot as import("@/lib/types").AnyGame | null;
    const game: import("@/lib/types").AnyGame = snapshot
      ? snapshot
      : sport === "MLB"
      ? {
          sport: "MLB",
          gameId,
          gameDate: row.game_date ?? today,
          gameTime: "",
          gameStatus: "scheduled",
          homeTeam: { teamId: row.home_team, teamAbv: row.home_team, teamName: row.home_team, teamCity: "" },
          awayTeam: { teamId: row.away_team, teamAbv: row.away_team, teamName: row.away_team, teamCity: "" },
          odds: null,
          homePitcher: null,
          awayPitcher: null,
        }
      : {
          sport: "NBA",
          gameId,
          gameDate: row.game_date ?? today,
          gameTime: "",
          gameStatus: "scheduled",
          homeTeam: { teamId: row.home_team, teamAbv: row.home_team, teamName: row.home_team, teamCity: "" },
          awayTeam: { teamId: row.away_team, teamAbv: row.away_team, teamName: row.away_team, teamCity: "" },
          odds: null,
        };

    console.log(`[breakdown] cache HIT for ${gameId} (created ${row.created_at})`);
    return {
      breakdown: content,
      game,
      sport,
      fromCache: true,
      generatedAt: row.created_at ?? null,
    };
  } catch (err) {
    console.error(`[breakdown] cache lookup threw for ${gameId}:`, err instanceof Error ? err.message : err);
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

async function handleNBABreakdown(gameId: string, userId: string | null = null): Promise<NextResponse> {
  try {
    const today = getTodayDateString();
    console.log(`[breakdown:NBA] gameId=${gameId} date=${today}`);

    const allGames = await getGamesForDate(today);
    const rawGame = allGames.find((g) => g.gameId === gameId);
    if (!rawGame) {
      console.error(`[breakdown:NBA] game not found in today's slate: ${gameId} — likely already played`);
      return NextResponse.json({ error: "Game not found", gameStarted: true }, { status: 404 });
    }
    if (rawGame.gameStatus === "live" || rawGame.gameStatus === "final") {
      console.warn(`[breakdown:NBA] game already started: ${gameId} status=${rawGame.gameStatus}`);
      return NextResponse.json({ error: "Game already started", gameStarted: true }, { status: 409 });
    }

    // Tank01's home/away — may be wrong for Play-In / Playoff games
    const t01Home = rawGame.homeTeam;
    const t01Away = rawGame.awayTeam;

    // Fetch all data in parallel using Tank01's designations.
    // ESPN injuries + series score are authoritative real-time sources.
    const [t01HomeStats, t01AwayStats, t01HomeForm, t01AwayForm, t01Injuries, oddsMap, t01Playoff, t01H2H, espnInjuries, espnSeries] = await Promise.all([
      getTeamStats(t01Home.teamAbv),
      getTeamStats(t01Away.teamAbv),
      getRecentForm(t01Home.teamAbv),
      getRecentForm(t01Away.teamAbv),
      getInjuryReport(t01Home.teamAbv, t01Away.teamAbv),
      fetchNBAOdds().catch(() => new Map()),
      getPlayoffContext(t01Home.teamAbv, t01Away.teamAbv).catch(() => ({ home: null, away: null })),
      getH2HRecord(t01Home.teamAbv, t01Away.teamAbv).catch(() => null),
      fetchESPNNBAInjuries(t01Home.teamAbv, t01Away.teamAbv, t01Home.teamName, t01Away.teamName),
      fetchESPNNBASeries(t01Home.teamAbv, t01Away.teamAbv, t01Home.teamName, t01Away.teamName),
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
    const espnInjuriesFinal = flipped && espnInjuries.ok
      ? { ok: true as const, fetchedAt: espnInjuries.fetchedAt,
          homeInjuries: espnInjuries.awayInjuries, awayInjuries: espnInjuries.homeInjuries }
      : espnInjuries;
    if (espnInjuriesFinal.ok) {
      console.log(
        `[breakdown:NBA] ESPN injuries: home=${espnInjuriesFinal.homeInjuries.length}, ` +
        `away=${espnInjuriesFinal.awayInjuries.length} (fetched ${espnInjuriesFinal.fetchedAt})`
      );
    } else {
      console.warn("[breakdown:NBA] ESPN injuries UNAVAILABLE — prompt will flag as such");
    }

    // Swap home/away in the series data when the Odds API disagreed with Tank01.
    // ESPN's own home/away resolution can stay — we just relabel the "home"/"away" sides.
    const espnSeriesFinal = flipped && espnSeries.ok
      ? {
          ok: true as const,
          fetchedAt: espnSeries.fetchedAt,
          series: {
            ...espnSeries.series,
            homeAbv: espnSeries.series.awayAbv,
            awayAbv: espnSeries.series.homeAbv,
            homeWins: espnSeries.series.awayWins,
            awayWins: espnSeries.series.homeWins,
          },
        }
      : espnSeries;
    if (espnSeriesFinal.ok) {
      const s = espnSeriesFinal.series;
      console.log(`[breakdown:NBA] series: Game ${s.gameNumber ?? "?"} — ${s.summary}`);
    } else {
      console.warn("[breakdown:NBA] ESPN series UNAVAILABLE — prompt will flag as such");
    }
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
      espnInjuries: espnInjuriesFinal,
      espnSeries: espnSeriesFinal,
      homePlayoffContext: playoffCtx.home,
      awayPlayoffContext: playoffCtx.away,
      h2h,
      lineMovement,
    };

    console.log("[breakdown:NBA] calling Claude...");
    const breakdown = await generateBreakdown(detailData);
    console.log(`[breakdown:NBA] confidenceLevel=${breakdown.confidenceLevel}`);

    // Archive (non-blocking)
    archiveBreakdown({
      sport: "NBA",
      gameId: game.gameId,
      gameDate: today,
      homeAbv: homeTeam.teamAbv,
      awayAbv: awayTeam.teamAbv,
      breakdown,
      game,
      userId,
    }).catch((err) => console.error("[breakdown:NBA:archive] threw:", err instanceof Error ? err.message : err));

    const generatedAt = new Date().toISOString();
    const response: BreakdownApiResponse = { breakdown, game, sport: "NBA", fromCache: false, generatedAt };
    return NextResponse.json(response);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[breakdown:NBA] FAILED:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to generate breakdown" }, { status: 500 });
  }
}

async function handleMLBBreakdown(gameId: string, userId: string | null = null): Promise<NextResponse> {
  try {
    const today = getTodayDateString();
    console.log(`[breakdown:MLB] gameId=${gameId} date=${today}`);

    const allGames = await getMLBGamesForDate(today);
    const rawGame = allGames.find((g) => g.gameId === gameId);
    if (!rawGame) {
      console.error(`[breakdown:MLB] game not found in today's slate: ${gameId} — likely already played`);
      return NextResponse.json({ error: "Game not found", gameStarted: true }, { status: 404 });
    }
    if (rawGame.gameStatus === "live" || rawGame.gameStatus === "final") {
      console.warn(`[breakdown:MLB] game already started: ${gameId} status=${rawGame.gameStatus}`);
      return NextResponse.json({ error: "Game already started", gameStarted: true }, { status: 409 });
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

    // MLB Stats API probablePitcher is the authoritative source. When it's
    // present, mark the pitcher confirmed=true. When we fall back to Tank01's
    // roster data, mark confirmed=false so the prompt can flag UNCONFIRMED.
    const homeFallback = await getMLBStartingPitcher(rawGame.probableStarterHomeId, homeTeam.teamAbv).catch(() => null);
    const awayFallback = await getMLBStartingPitcher(rawGame.probableStarterAwayId, awayTeam.teamAbv).catch(() => null);
    const homePitcher = statsEntry?.home ?? (homeFallback ? { ...homeFallback, confirmed: false } : null);
    const awayPitcher = statsEntry?.away ?? (awayFallback ? { ...awayFallback, confirmed: false } : null);
    console.log(
      `[breakdown:MLB] pitchers: home=${homePitcher?.name ?? "none"} (confirmed=${homePitcher?.confirmed ?? false}), ` +
      `away=${awayPitcher?.name ?? "none"} (confirmed=${awayPitcher?.confirmed ?? false})`
    );

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
    archiveBreakdown({
      sport: "MLB",
      gameId: game.gameId,
      gameDate: today,
      homeAbv: homeTeam.teamAbv,
      awayAbv: awayTeam.teamAbv,
      breakdown,
      game,
      userId,
    }).catch((err) => console.error("[breakdown:MLB:archive] threw:", err instanceof Error ? err.message : err));

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
