import { NextRequest, NextResponse } from "next/server";
import { getGamesForDate, getTeamStats, getRecentForm, getInjuryReport, getPlayoffContext, getH2HRecord, getTeamRosterNames } from "@/lib/tank01";
import { fetchNBAOdds, buildMatchupKey, fetchMLBOdds, type OddsMatchup } from "@/lib/odds-api";
import { streamNBABreakdown } from "@/lib/claude";
import {
  getMLBGamesForDate,
  getMLBTeamStats,
  getMLBRecentForm,
  getMLBInjuryReport,
  getMLBStartingPitcher,
  getMLBH2HRecord,
  getMLBTeamRosterNames,
} from "@/lib/tank01-mlb";
import {
  fetchMLBProbableStarters,
  getMLBPlayoffContext,
  getMLBBullpenStats,
  getMLBUmpire,
} from "@/lib/mlb-stats-api";
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
  VerificationResult,
  ConfidenceLevel,
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

  const VALID_SPORTS = new Set(["NBA", "MLB"]);
  try {
    const body = await req.json();
    gameId = body?.gameId;
    sport = (body?.sport ?? "NBA") as Sport;
    regenerate = body?.regenerate === true;
    if (!gameId || typeof gameId !== "string") {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }
    if (!VALID_SPORTS.has(sport)) {
      return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
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
    const { count, error: countErr } = await authClient
      .from("breakdown_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfDayET);
    if (countErr || count === null) {
      console.error(`[breakdown] usage count query failed for user=${user.id}:`, countErr?.message ?? "count was null");
      return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
    }
    const used = count;
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
    : await handleNBABreakdown(gameId, user.id, tier);

  if (response.status !== 200) return response;

  // Record usage fire-and-forget.
  authClient
    .from("breakdown_usage")
    .insert({ user_id: user.id })
    .then(({ error }) => {
      if (error) console.error("[breakdown] usage insert failed:", error.message);
    });

  // NBA returns a streaming NDJSON response — tier is embedded in the meta
  // message. MLB still returns JSON, so inject tier into the body.
  if (response.headers.get("content-type")?.includes("application/x-ndjson")) {
    return response;
  }
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

async function handleNBABreakdown(gameId: string, userId: string | null = null, tier = "free"): Promise<Response> {
  try {
    const today = getTodayDateString();
    console.log(`[breakdown:NBA] gameId=${gameId} date=${today}`);

    const allGames = await getGamesForDate(today);
    const rawGame = allGames.find((g) => g.gameId === gameId);
    if (!rawGame) {
      console.error(`[breakdown:NBA] game not found in today's slate: ${gameId} — likely already played`);
      return NextResponse.json({ error: "Game not found", gameStarted: true }, { status: 404 });
    }
    if (rawGame.gameStatus === "live" || rawGame.gameStatus === "final" || hasGameStarted(rawGame.gameTime, rawGame.gameDate)) {
      console.warn(`[breakdown:NBA] game already started: ${gameId} status=${rawGame.gameStatus} time=${rawGame.gameTime}`);
      return NextResponse.json({ error: "Game has already started", gameStarted: true }, { status: 403 });
    }

    // Tank01's home/away — may be wrong for Play-In / Playoff games
    const t01Home = rawGame.homeTeam;
    const t01Away = rawGame.awayTeam;

    // Fetch all data in parallel. Official NBA PDF is the sole injury source.
    // getOpeningLine is included here so it runs concurrently with the data fan-out
    // rather than sequentially after it.
    const [t01HomeStats, t01AwayStats, t01HomeForm, t01AwayForm, t01Injuries, oddsMap, t01Playoff, t01H2H, espnSeries, t01HomeRoster, t01AwayRoster, openingLine] = await Promise.all([
      getTeamStats(t01Home.teamAbv),
      getTeamStats(t01Away.teamAbv),
      getRecentForm(t01Home.teamAbv),
      getRecentForm(t01Away.teamAbv),
      getInjuryReport(t01Home.teamAbv, t01Away.teamAbv),
      fetchNBAOdds().catch(() => new Map()),
      getPlayoffContext(t01Home.teamAbv, t01Away.teamAbv).catch(() => ({ home: null, away: null })),
      getH2HRecord(t01Home.teamAbv, t01Away.teamAbv).catch(() => null),
      fetchESPNNBASeries(t01Home.teamAbv, t01Away.teamAbv, t01Home.teamName, t01Away.teamName),
      getTeamRosterNames(t01Home.teamAbv).catch(() => []),
      getTeamRosterNames(t01Away.teamAbv).catch(() => []),
      getOpeningLine(gameId).catch(() => null),
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

    console.log(
      `[breakdown:NBA] official injuries: home=${injuries.homeInjuries.length} (${injuries.homeInjuries.map(p => `${p.playerName} ${p.status}`).join(", ") || "none"}), ` +
      `away=${injuries.awayInjuries.length} (${injuries.awayInjuries.map(p => `${p.playerName} ${p.status}`).join(", ") || "none"})`
    );

    // Swap home/away in the series data when the Odds API disagreed with Tank01.
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
    const homeRoster    = flipped ? t01AwayRoster : t01HomeRoster;
    const awayRoster    = flipped ? t01HomeRoster : t01AwayRoster;
    console.log(`[breakdown:NBA] rosters: ${homeTeam.teamAbv}=${homeRoster.length} players, ${awayTeam.teamAbv}=${awayRoster.length} players`);
    if (homeRoster.length === 0) console.warn(`[breakdown:NBA] WARNING: ${homeTeam.teamAbv} roster is EMPTY — Claude will hallucinate players`);
    if (awayRoster.length === 0) console.warn(`[breakdown:NBA] WARNING: ${awayTeam.teamAbv} roster is EMPTY — Claude will hallucinate players`);

    const playoffCtx    = flipped
      ? { home: t01Playoff.away, away: t01Playoff.home }
      : t01Playoff;
    const h2h           = flipped && t01H2H
      ? { wins: t01H2H.losses, losses: t01H2H.wins, games: t01H2H.games, avgMarginFor: t01H2H.avgMarginAgainst, avgMarginAgainst: t01H2H.avgMarginFor }
      : t01H2H;

    // ─── NBA Data Verification ────────────────────────────────────────────────
    const verificationFlags: string[] = [];
    let confidenceLevelPreset: ConfidenceLevel | null = null;
    let fragilityReason: string | null = null;

    const forceFragile = (flag: string, reason: string) => {
      verificationFlags.push(flag);
      confidenceLevelPreset = 3;
      if (!fragilityReason) fragilityReason = reason;
    };

    // 1. Official NBA PDF injury check — if both rosters returned empty, flag uncertainty
    const totalInjuries = injuries.homeInjuries.length + injuries.awayInjuries.length;
    if (totalInjuries === 0) {
      verificationFlags.push("Official injury report returned no entries — lineups assumed clean");
    }

    // 2. Top-player status check (Questionable/Doubtful = genuine uncertainty → FRAGILE)
    {
      const topPlayerNames = new Set([
        ...homeStats.topPlayers.map((p) => p.playerName.toLowerCase()),
        ...awayStats.topPlayers.map((p) => p.playerName.toLowerCase()),
      ]);
      const FRAGILE_STATUSES = new Set(["Questionable", "Doubtful"]);
      const allEntries = [...injuries.homeInjuries, ...injuries.awayInjuries];
      const impacted = allEntries.find(
        (e) => topPlayerNames.has(e.playerName.toLowerCase()) && FRAGILE_STATUSES.has(e.status),
      );
      if (impacted) {
        forceFragile(
          `Top player ${impacted.playerName} listed as ${impacted.status} on official report`,
          `${impacted.playerName} is ${impacted.status}. Confidence reduced pending lineup confirmation.`,
        );
      }
    }

    // 3. Tank01 team stats freshness check (only runs when timestamp is available)
    for (const [abv, stats] of [[homeTeam.teamAbv, homeStats], [awayTeam.teamAbv, awayStats]] as const) {
      if (stats.lastUpdated) {
        const ageMs = Date.now() - new Date(stats.lastUpdated).getTime();
        if (ageMs > 36 * 3600 * 1000) {
          forceFragile(
            `${abv} team stats may not reflect last game (last updated ${Math.round(ageMs / 3600000)}h ago)`,
            "Team stats may not reflect the most recent game.",
          );
        }
      }
    }

    // 4. Null signal flags (rendering handled in buildUserMessage)
    if (!odds) verificationFlags.push("Odds not yet posted for this game — ODDS_NOT_YET_POSTED");
    if (!h2h)  verificationFlags.push("H2H data unavailable — H2H_DATA_UNAVAILABLE");
    if (homeForm.length < 3) verificationFlags.push(`${homeTeam.teamAbv} recent form limited (${homeForm.length} games) — RECENT_FORM_UNAVAILABLE`);
    if (awayForm.length < 3) verificationFlags.push(`${awayTeam.teamAbv} recent form limited (${awayForm.length} games) — RECENT_FORM_UNAVAILABLE`);
    const now = new Date();
    const inPlayoffWindow = (now.getMonth() + 1 === 4 && now.getDate() >= 18) || (now.getMonth() + 1 >= 5 && now.getMonth() + 1 <= 7);
    if (inPlayoffWindow && !espnSeriesFinal.ok) verificationFlags.push("Playoff series record unavailable — SERIES_RECORD_UNAVAILABLE");

    const nbaVerification: VerificationResult = { verificationFlags, confidenceLevelPreset, fragilityReason };
    // ─── End NBA Data Verification ────────────────────────────────────────────

    // Record opening line (insert-only, non-blocking). openingLine already fetched in Promise.all above.
    recordOpeningLine(
      gameId, today,
      homeTeam.teamAbv, awayTeam.teamAbv, "NBA",
      odds?.spread ?? null,
      odds?.total ?? null,
      odds?.homeMoneyline ?? null,
      odds?.awayMoneyline ?? null,
    );
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
      espnSeries: espnSeriesFinal,
      homePlayoffContext: playoffCtx.home,
      awayPlayoffContext: playoffCtx.away,
      h2h,
      lineMovement,
      verification: nbaVerification,
      homeRoster,
      awayRoster,
    };

    // Build streaming response — sends NDJSON lines to the client as Claude generates.
    // Protocol: {t:"m"} meta (first), {t:"c"} token chunks, {t:"r"} final result, {t:"e"} error.
    const encoder = new TextEncoder();
    const send = (msg: object, ctrl: ReadableStreamDefaultController) =>
      ctrl.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));

    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          // Metadata first — client can render the page header immediately
          send({ t: "m", game, tier, fromCache: false, generatedAt: null }, ctrl);

          console.log("[breakdown:NBA] streaming Claude...");
          const breakdown = await streamNBABreakdown(detailData, (token) => {
            send({ t: "c", d: token }, ctrl);
          });
          console.log(`[breakdown:NBA] confidenceLevel=${breakdown.confidenceLevel}`);

          const generatedAt = new Date().toISOString();
          send({ t: "r", d: breakdown, generatedAt }, ctrl);

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
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to generate breakdown";
          console.error("[breakdown:NBA] streaming error:", message);
          send({ t: "e", message }, ctrl);
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
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
    if (rawGame.gameStatus === "live" || rawGame.gameStatus === "final" || hasGameStarted(rawGame.gameTime, rawGame.gameDate)) {
      console.warn(`[breakdown:MLB] game already started: ${gameId} status=${rawGame.gameStatus} time=${rawGame.gameTime}`);
      return NextResponse.json({ error: "Game has already started", gameStarted: true }, { status: 403 });
    }

    const { homeTeam, awayTeam } = rawGame;
    const [
      homeStats, awayStats, homeForm, awayForm, injuryReport, oddsMap,
      mlbStatsPitchers, playoffCtx, h2h, homeBullpen, awayBullpen, umpire,
      homeRoster, awayRoster, openingLine,
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
      getMLBTeamRosterNames(homeTeam.teamAbv).catch(() => []),
      getMLBTeamRosterNames(awayTeam.teamAbv).catch(() => []),
      getOpeningLine(gameId).catch(() => null),
    ]);

    const statsEntry =
      mlbStatsPitchers.get(homeTeam.teamAbv) ??
      mlbStatsPitchers.get(awayTeam.teamAbv) ??
      null;

    // MLB Stats API probablePitcher is the authoritative source. When it's
    // present, mark the pitcher confirmed=true. When we fall back to Tank01's
    // roster data, mark confirmed=false so the prompt can flag UNCONFIRMED.
    const [homeFallback, awayFallback] = await Promise.all([
      getMLBStartingPitcher(rawGame.probableStarterHomeId, homeTeam.teamAbv).catch(() => null),
      getMLBStartingPitcher(rawGame.probableStarterAwayId, awayTeam.teamAbv).catch(() => null),
    ]);
    const homePitcher = statsEntry?.home ?? (homeFallback ? { ...homeFallback, confirmed: false } : null);
    const awayPitcher = statsEntry?.away ?? (awayFallback ? { ...awayFallback, confirmed: false } : null);
    console.log(
      `[breakdown:MLB] pitchers: home=${homePitcher?.name ?? "none"} (confirmed=${homePitcher?.confirmed ?? false}), ` +
      `away=${awayPitcher?.name ?? "none"} (confirmed=${awayPitcher?.confirmed ?? false})`
    );

    // Derive odds early so verification can check whether lines are posted
    const oddsKey = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
    const mlbOdds = oddsMap.get(oddsKey)?.mlbOdds ?? null;

    // ─── MLB Data Verification ────────────────────────────────────────────────
    const mlbFlags: string[] = [];
    let mlbConfidencePreset: ConfidenceLevel | null = null;
    let mlbFragilityReason: string | null = null;

    const forceMLBFragile = (flag: string, reason: string) => {
      mlbFlags.push(flag);
      mlbConfidencePreset = 3;
      if (!mlbFragilityReason) mlbFragilityReason = reason;
    };

    // 1. Derive explicit pitcher status fields
    type PitcherStatus = "confirmed" | "unconfirmed" | "unknown";
    const homePitcherStatus: PitcherStatus =
      homePitcher === null ? "unknown" : homePitcher.confirmed === true ? "confirmed" : "unconfirmed";
    const awayPitcherStatus: PitcherStatus =
      awayPitcher === null ? "unknown" : awayPitcher.confirmed === true ? "confirmed" : "unconfirmed";

    console.log(`[breakdown:MLB] pitcherStatus: home=${homePitcherStatus} away=${awayPitcherStatus}`);

    if (homePitcherStatus === "unconfirmed" || homePitcherStatus === "unknown") {
      forceMLBFragile(
        `Home pitcher (${homePitcher?.name ?? "unknown"}) status: ${homePitcherStatus} — not confirmed by MLB Stats API`,
        "Pitcher confirmation is pending. Lineup data may change before first pitch.",
      );
    }
    if (awayPitcherStatus === "unconfirmed" || awayPitcherStatus === "unknown") {
      forceMLBFragile(
        `Away pitcher (${awayPitcher?.name ?? "unknown"}) status: ${awayPitcherStatus} — not confirmed by MLB Stats API`,
        mlbFragilityReason ?? "Pitcher confirmation is pending. Lineup data may change before first pitch.",
      );
    }

    // 2. Null signal flags
    if (!mlbOdds) mlbFlags.push("Odds not yet posted for this game — ODDS_NOT_YET_POSTED");
    if (!h2h)    mlbFlags.push("H2H data unavailable — H2H_DATA_UNAVAILABLE");
    if (homeForm.length < 3) mlbFlags.push(`${homeTeam.teamAbv} recent form limited (${homeForm.length} games) — RECENT_FORM_UNAVAILABLE`);
    if (awayForm.length < 3) mlbFlags.push(`${awayTeam.teamAbv} recent form limited (${awayForm.length} games) — RECENT_FORM_UNAVAILABLE`);

    const mlbVerification: VerificationResult = {
      verificationFlags: mlbFlags,
      confidenceLevelPreset: mlbConfidencePreset,
      fragilityReason: mlbFragilityReason,
    };
    // ─── End MLB Data Verification ────────────────────────────────────────────

    const MLB_PARK_FACTORS: Record<string, MLBParkFactor> = {
      COL: { parkName: "Coors Field", factor: "high" },
      SD:  { parkName: "Petco Park", factor: "low" },
      SF:  { parkName: "Oracle Park", factor: "low" },
      CIN: { parkName: "Great American Ball Park", factor: "high" },
    };
    const parkFactor = MLB_PARK_FACTORS[homeTeam.teamAbv] ?? null;

    // Record opening line (insert-only, non-blocking). openingLine already fetched in Promise.all above.
    recordOpeningLine(
      gameId, today,
      homeTeam.teamAbv, awayTeam.teamAbv, "MLB",
      mlbOdds?.runLine ?? null,
      mlbOdds?.total ?? null,
      mlbOdds?.homeMoneyline ?? null,
      mlbOdds?.awayMoneyline ?? null,
    );
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

    console.log(`[breakdown:MLB] rosters: ${homeTeam.teamAbv}=${homeRoster.length} players, ${awayTeam.teamAbv}=${awayRoster.length} players`);
    if (homeRoster.length === 0) console.warn(`[breakdown:MLB] WARNING: ${homeTeam.teamAbv} roster is EMPTY — Claude will hallucinate players`);
    if (awayRoster.length === 0) console.warn(`[breakdown:MLB] WARNING: ${awayTeam.teamAbv} roster is EMPTY — Claude will hallucinate players`);

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
      verification: mlbVerification,
      homeRoster,
      awayRoster,
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

/**
 * Returns true when the game's scheduled start time (ET) has been reached or
 * passed. This is the primary game-start gate — it catches the window between
 * tip-off / first pitch and when Tank01 updates gameStatus to "live".
 */
function hasGameStarted(gameTime: string, gameDate: string): boolean {
  const today = getTodayDateString();
  if (gameDate < today) return true;
  if (gameDate > today) return false;

  const m = (gameTime ?? "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)(\s*ET)?$/i);
  if (!m) return false;

  let gh = parseInt(m[1], 10);
  const gm = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && gh !== 12) gh += 12;
  if (m[3].toUpperCase() === "AM" && gh === 12) gh = 0;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const ch = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const cm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);

  return ch * 60 + cm >= gh * 60 + gm;
}
