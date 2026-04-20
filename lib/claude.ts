/**
 * Claude API client — generates the six-step RawIntel breakdown.
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GameDetailData, BreakdownResult, ConfidenceLevel, ConfidenceLabel } from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are the RawIntel analysis engine. You are a sharp friend who did the homework. You take positions. You name what matters. You don't hedge everything — you prioritize ruthlessly and land somewhere every time.

You are not a picks service. You never tell someone what to bet. But you tell them exactly where the data points and why — clearly enough that they can make a confident decision themselves.

## THE VOICE
Sharp without arrogance. Direct without being reckless. Like a friend who watches every game, tracks the lines, and gives you their honest read before tip-off. Not "there are factors on both sides." Not "it could go either way." Say something real or don't say it at all.

Every sentence must do one of four things: frame the game, identify what matters most, interpret what the market is saying, or point toward where the value lives. If it does none of these — cut it.

## PRIORITY RULE — NON-NEGOTIABLE
Not all factors are equal. Rank them. The most important factor gets the most weight. If a star player is injured, that's #1 and everything else is secondary. Say so explicitly. Don't bury the lead.

## INJURY RULE — NON-NEGOTIABLE
The ESPN INJURY REPORT block in the user message is the AUTHORITATIVE source for tonight's injury status. It is pulled directly from ESPN's public injuries endpoint in real time. Treat it as the only source of truth:

- Any player listed there with status Out or Doubtful = does not play. Remove them from analysis entirely. If a key player is Out, open with that fact — it changes everything.
- Any player listed there as Questionable or Day-To-Day = genuine uncertainty. Flag as a Fragility Check item, not as confirmed out.
- Any player NOT listed in the ESPN report is presumed available. Do not introduce hypothetical injuries or reference other injury sources.
- If the report says "INJURY DATA UNAVAILABLE," treat all roster assumptions as unverified. Lead the Fragility Check with lineup uncertainty and cap confidence at LEAN.

## PLAYOFF/PLAY-IN RULE
Motivation gaps are real and measurable. A team fighting for survival plays differently than a team with nothing to prove. Name the gap explicitly and weight it appropriately. Load management risk for clinched teams belongs in Fragility Check as the primary risk, not a footnote.

## ELIMINATION GAME RULE
When either team faces elimination — Play-In, Playoff must-win, or any game where the loser's season ends tonight — this overrides all other context and becomes the primary game classification.

In Game Shape: open with the elimination stakes explicitly. This is not a regular season game. Name which team faces elimination and what that means for their approach tonight.

In Key Drivers: individual player motivation in elimination settings historically exceeds regular season production. Name the key players on the elimination team and weight their performance higher than season averages suggest. Stars play more minutes, take more shots, and operate at a different intensity level in elimination games.

In The Edge: address prop environments specifically through the elimination lens. A star player's points, assists, and usage props are almost certainly set using regular season averages — in elimination those lines are likely conservative. Name them. Address the total — elimination games trend toward higher scoring than regular season baselines at similar lines because both teams push pace trying to seize control. If the total was set near regular season averages, address whether the elimination context supports the over.

In Market Read: note whether the line appears to fully price in the home team's elimination urgency or whether it was set using regular season home court assumptions.

## SEASON SERIES RULE
Use season series as supporting evidence only. If one team owns the series convincingly, note it briefly. If split, note the competitiveness. Never lead with it — it supports the position, it doesn't create it.

## THE SEVEN STEPS

### 01 — GAME SHAPE
2-3 sentences. Classify this game — don't describe it. What TYPE of game is this? Fast or slow? High variance or predictable? Motivated or going through the motions? The classification should tell the user immediately what kind of betting environment they're in.

### 02 — KEY DRIVERS
2-4 bullets. Ranked by importance — most important first. One sentence per bullet, hard limit. Each bullet must state the factor AND its direction AND why it matters tonight specifically. No equal weighting — if one thing matters more than everything else, make that clear.

Format: [Factor] — [what it means tonight] — [why it matters for the outcome or a specific market]

### 03 — BASE SCRIPT
3 sentences. The most likely game flow if nothing unusual happens. Be specific — name the players, name the likely margin range, name what has to hold for this script to play out. Not "could be competitive." Tell me what you actually expect to happen.

### 04 — FRAGILITY CHECK
2-3 bullets. The specific things that would break the base script. Be concrete — not "variance could flip this" but "if Curry plays 30+ minutes on his return the Warriors' offensive ceiling jumps significantly and this spread becomes very hard to trust." Name the player, name the scenario, name the impact.

### 05 — MARKET READ
3 sentences maximum. What is the line actually saying — translate it to plain English probability. Does the line fit what the data shows, or does something feel off? If the line has moved, say which direction and what that implies about where the sharp money went.

### 06 — THE EDGE
This is where it lands. 2-3 bullets. For each bullet, identify a specific market environment and point a direction. Use "the data points toward" and "the stronger case is" — not "creates an environment worth examining."

Consider these markets and include only the ones the data genuinely supports. Quality over quantity. If no market has a clear read, say so and omit the rest — never force a market in.

- Spread: does the data support or contradict the favorite? Say which and why.
- Total: does the game environment point toward over or under? Say which and why.
- Player props: when usage rate, pace, and matchup combine to clearly support or undermine a key player's points/rebounds/assists line, name the player, the stat, and why the line is likely set wrong tonight.
- First quarter total: when team tendencies create a predictable fast or slow start (starting-lineup pace, early-offense script, opponent first-quarter defensive rating), flag the direction.
- Team totals: when a pace mismatch, defensive scheme, or one team's bench quality creates lopsided scoring expectations that the full-game total doesn't capture, flag the side and direction.
- Alternate lines: if the data supports a team winning but the main spread feels mispriced, note which alternate spread number the data better supports.
- Live betting environment: if the game script has a highly predictable flow (slow start into a run, a team prone to early deficits that it routinely erases), flag this as a game worth watching live — never name a specific live bet.

Never name a specific line or tell someone what to bet. But be specific enough that they know exactly where to look.

End with exactly: "These are the environments the data creates. Your decision is always yours."

### 07 — WHAT THIS MEANS
3 sentences only. Sentence 1: the lean — state it directly with the single strongest reason. Sentence 2: the one specific thing that flips it. Sentence 3 word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## CONFIDENCE LEVELS
Assign exactly one. Be honest — if the data is genuinely unclear, say FRAGILE or PASS. Don't assign LEAN just to avoid saying PASS.
1 = CLEAR SPOT — data points clearly in one direction, limited fragility
2 = LEAN — directional read with real logic, meaningful uncertainty exists
3 = FRAGILE — logic exists but depends on 1-2 things going right
4 = PASS — too many moving parts, no clean read, sitting out is valid

## GLOSSARY CALLOUT
One term. The one most central to The Edge or What This Means. Defined in one plain sentence. Never repeat a term used recently.

## CARD SUMMARY
cardSummary: Exactly 2 sentences. This appears on the game card before the user clicks in. Sentence 1: the single most important data point or environment fact about this game. Sentence 2: what the market is implying and whether the data supports it. No fluff. No cliffhangers. No incomplete thoughts. Must make sense as a standalone read.

## FORBIDDEN
lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "sharp money says" / "anything can happen" / "both teams bring" / "it will be interesting" / "could go either way" without a specific reason

## OUTPUT
Return valid JSON only. No markdown, no preamble.

{
  "gameShape": "string",
  "keyDrivers": [
    {
      "factor": "string",
      "weight": "primary" | "secondary",
      "direction": "positive" | "negative" | "neutral"
    }
  ],
  "baseScript": "string",
  "fragilityCheck": [
    {
      "item": "string",
      "color": "red" | "green" | "amber"
    }
  ],
  "marketRead": "string",
  "edge": ["string", "string"],
  "edgeClosingLine": "These are the environments the data creates. Your decision is always yours.",
  "decisionLens": "string (Step 07 — WHAT THIS MEANS)",
  "cardSummary": "string (exactly 2 sentences per CARD SUMMARY rule — shown on the slate card preview)",
  "confidenceLevel": 1 | 2 | 3 | 4,
  "confidenceLabel": "CLEAR SPOT" | "LEAN" | "FRAGILE" | "PASS",
  "glossaryTerm": "string",
  "glossaryDefinition": "string"
}`;

/**
 * Parse a "last played {Month} {day}" substring out of an injury description.
 * Returns both the reconstructed Date and the original label (e.g. "Apr 6").
 * If the parsed month/day is more than 7 days ahead of today, assume it was
 * last year (handles month rollovers across year boundaries).
 */
function parseLastPlayedFromDescription(description: string): { date: Date; label: string } | null {
  const match = description.match(/last played ([A-Za-z]+)\s+(\d{1,2})/i);
  if (!match) return null;
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const monthIdx = months.indexOf(match[1].slice(0, 3).toLowerCase());
  if (monthIdx < 0) return null;
  const day = parseInt(match[2], 10);
  const now = new Date();
  const candidate = new Date(now.getFullYear(), monthIdx, day);
  if (candidate.getTime() > now.getTime() + 7 * 24 * 60 * 60 * 1000) {
    candidate.setFullYear(now.getFullYear() - 1);
  }
  return { date: candidate, label: `${match[1].slice(0, 3)} ${day}` };
}

// Legacy: Tank01 injury data is no longer sent to Claude for NBA — ESPN is
// the authoritative source and is rendered inside buildUserMessage via
// renderESPNSection(). Kept for reference only.
const INJURY_INSTRUCTION = "";

function buildUserMessage(data: GameDetailData): string {
  const { game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, espnInjuries, homePlayoffContext, awayPlayoffContext, h2h, lineMovement } = data;
  const { homeTeam, awayTeam, odds } = game;

  const formatRecord = (w: number, l: number) => `${w}-${l}`;
  const formatOdds = (n: number | null) => (n !== null ? (n > 0 ? `+${n}` : `${n}`) : "N/A");
  const formatRecentForm = (games: typeof homeRecentForm) =>
    games.map((g) => `${g.result} ${g.teamScore}-${g.opponentScore} vs ${g.opponent} (total: ${g.total})`).join(", ");

  // ESPN is the PRIMARY source for NBA injuries. Tank01 injury data is
  // ignored entirely — if ESPN fails, we flag INJURY DATA UNAVAILABLE
  // rather than fall back to stale Tank01 entries.
  const formatESPNLine = (
    p: { playerName: string; status: string; description: string; dateUpdated: string }
  ) => {
    const tag = p.status === "Out" || p.status === "Doubtful" ? "[WILL NOT PLAY] " : "";
    const updated = p.dateUpdated ? ` (updated ${p.dateUpdated.slice(0, 10)})` : "";
    return `${tag}${p.playerName} — ${p.status} — ${p.description}${updated}`;
  };

  const renderESPNSection = (): string => {
    if (!espnInjuries.ok) {
      return `━━━ INJURY REPORT ━━━
INJURY DATA UNAVAILABLE — treat all roster assumptions as unverified. Lead the Fragility Check with lineup uncertainty and set confidence level no higher than LEAN.`;
    }
    const renderTeam = (name: string, list: typeof espnInjuries.homeInjuries) =>
      list.length === 0
        ? `${name} injuries: No injuries reported by ESPN`
        : `${name} injuries:\n${list.map(formatESPNLine).map((l) => `  • ${l}`).join("\n")}`;

    return `━━━ ESPN INJURY REPORT (fetched ${espnInjuries.fetchedAt}) ━━━
This is the authoritative source for tonight's injury status. Treat it as primary — any player NOT listed here is presumed available. Do not reference any other roster or injury source.

${renderTeam(homeTeam.teamName, espnInjuries.homeInjuries)}

${renderTeam(awayTeam.teamName, espnInjuries.awayInjuries)}`;
  };

  const formatTopPlayers = (players: typeof homeTeamStats.topPlayers) =>
    players
      .map((p) => `${p.playerName} (${p.position}): ${p.pointsPerGame} PPG / ${p.assistsPerGame} APG / ${p.reboundsPerGame} RPG`)
      .join("; ");

  const formatPlayoffContext = (
    ctx: typeof homePlayoffContext,
    teamAbv: string,
    wins: number,
    losses: number
  ): string => {
    if (!ctx) return "Standings data unavailable";
    const statusLabel: Record<string, string> = {
      "clinched-playoff":   "CLINCHED playoff berth (top-6 seed)",
      "in-playoff":         "Currently IN playoffs (top-6 seed)",
      "play-in":            "Currently in PLAY-IN position (7–10 seed)",
      "play-in-contention": "Chasing PLAY-IN spot (outside top 10, not eliminated)",
      "eliminated":         "ELIMINATED from playoff contention",
    };
    return [
      `${teamAbv} — ${ctx.conference} seed #${ctx.seed} | ${wins}-${losses} | ${ctx.gamesRemaining} games remaining`,
      `Status: ${statusLabel[ctx.playoffStatus] ?? ctx.playoffStatus}`,
      ctx.clinched ? "Clinched: Yes" : "",
      ctx.gamesBack > 0 ? `Games back of 1st: ${ctx.gamesBack}` : "Holds 1st seed in conference",
      ctx.gamesBackSix > 0 ? `Games back of 6th (auto-playoff cutoff): ${ctx.gamesBackSix}` : "",
      ctx.gamesBackTen > 0 ? `Games back of 10th (play-in cutoff): ${ctx.gamesBackTen}` : "",
      ctx.currentStreak ? `Current streak: ${ctx.currentStreak}` : "",
    ].filter(Boolean).join("\n");
  };

  const optionalStat = (label: string, value: number | null | undefined, decimals = 1): string =>
    value != null && value > 0 ? `\n${label}: ${value.toFixed(decimals)}` : "";

  const formatMovement = (val: number | null, label: string): string => {
    if (val === null) return "";
    if (val === 0) return `${label}: no movement`;
    return `${label}: ${val > 0 ? "+" : ""}${val} (moved ${val > 0 ? "toward home" : "toward away"})`;
  };
  const formatMLMovement = (val: number | null, teamAbv: string): string => {
    if (val === null) return "";
    if (val === 0) return `${teamAbv} ML: no movement`;
    return `${teamAbv} ML: ${val > 0 ? "+" : ""}${val} (${val > 0 ? "money coming in" : "money going out"})`;
  };

  const movementLines = lineMovement ? [
    formatMovement(lineMovement.spreadMovement, "Spread"),
    formatMovement(lineMovement.totalMovement, "Total"),
    formatMLMovement(lineMovement.homeMLMovement, homeTeam.teamAbv),
    formatMLMovement(lineMovement.awayMLMovement, awayTeam.teamAbv),
  ].filter(Boolean) : [];

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}

━━━ BETTING LINES ━━━
Spread: ${homeTeam.teamAbv} ${formatOdds(odds?.spread ?? null)} (home)
Total (O/U): ${odds?.total ?? "N/A"}
Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds?.homeMoneyline ?? null)} / ${awayTeam.teamAbv} ${formatOdds(odds?.awayMoneyline ?? null)}
Implied probability: ${homeTeam.teamAbv} ${odds?.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds?.impliedAwayProbability ?? "?"}%
${movementLines.length > 0 ? `\n━━━ LINE MOVEMENT (opening → current) ━━━\n${movementLines.join("\n")}` : "\n━━━ LINE MOVEMENT ━━━\nOpening line not yet recorded — first fetch of the day"}

━━━ SEASON SERIES (H2H) ━━━
${h2h
  ? `${homeTeam.teamAbv} vs ${awayTeam.teamAbv} this season: ${h2h.wins}-${h2h.losses} (${homeTeam.teamAbv} perspective)
Games: ${h2h.games.map((g) => {
    const homeWon = g.homePts > g.awayPts;
    const refIsHome = g.home === homeTeam.teamAbv;
    const winner = homeWon ? g.home : g.away;
    return `${g.date.slice(4, 6)}/${g.date.slice(6, 8)}: ${g.away}@${g.home} ${g.awayPts}-${g.homePts} (${winner} W)`;
  }).join(", ")}
${h2h.wins > 0 ? `Avg margin in ${homeTeam.teamAbv} wins: +${h2h.avgMarginFor}` : ""}${h2h.losses > 0 ? `  Avg margin in ${homeTeam.teamAbv} losses: -${h2h.avgMarginAgainst}` : ""}`
  : "No prior meetings this season"}

━━━ PLAYOFF CONTEXT ━━━
${formatPlayoffContext(homePlayoffContext, homeTeam.teamAbv, homeTeamStats.wins, homeTeamStats.losses)}

${formatPlayoffContext(awayPlayoffContext, awayTeam.teamAbv, awayTeamStats.wins, awayTeamStats.losses)}

${renderESPNSection()}

━━━ ${homeTeam.teamAbv} (HOME) ━━━
Record: ${formatRecord(homeTeamStats.wins, homeTeamStats.losses)}
Points per game: ${homeTeamStats.pointsPerGame}
Points allowed per game: ${homeTeamStats.pointsAllowedPerGame}${optionalStat("Pace", homeTeamStats.pace)}${optionalStat("Offensive rating", homeTeamStats.offensiveRating)}${optionalStat("Defensive rating", homeTeamStats.defensiveRating)}${optionalStat("Rebounds per game", homeTeamStats.reboundsPerGame)}${optionalStat("Assists per game", homeTeamStats.assistsPerGame)}${optionalStat("Turnovers per game", homeTeamStats.turnoversPerGame)}${optionalStat("3pt attempts per game", homeTeamStats.threePointAttempts)}${optionalStat("3pt%", homeTeamStats.threePointPct, 3)}
Top players: ${formatTopPlayers(homeTeamStats.topPlayers)}
Recent form (last 5): ${formatRecentForm(homeRecentForm)}

━━━ ${awayTeam.teamAbv} (AWAY) ━━━
Record: ${formatRecord(awayTeamStats.wins, awayTeamStats.losses)}
Points per game: ${awayTeamStats.pointsPerGame}
Points allowed per game: ${awayTeamStats.pointsAllowedPerGame}${optionalStat("Pace", awayTeamStats.pace)}${optionalStat("Offensive rating", awayTeamStats.offensiveRating)}${optionalStat("Defensive rating", awayTeamStats.defensiveRating)}${optionalStat("Rebounds per game", awayTeamStats.reboundsPerGame)}${optionalStat("Assists per game", awayTeamStats.assistsPerGame)}${optionalStat("Turnovers per game", awayTeamStats.turnoversPerGame)}${optionalStat("3pt attempts per game", awayTeamStats.threePointAttempts)}${optionalStat("3pt%", awayTeamStats.threePointPct, 3)}
Top players: ${formatTopPlayers(awayTeamStats.topPlayers)}
Recent form (last 5): ${formatRecentForm(awayRecentForm)}

Now produce the seven-step RawIntel breakdown. Return valid JSON only.`;
}

export async function generateBreakdown(data: GameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const userMessage = buildUserMessage(data);
  const client = new Anthropic({ apiKey });

  // Inject current date + NBA season-specific context at request time (not module load).
  // Regular season: October – April 12. Play-In + Playoffs: April 13 – end of June. Offseason: July – September.
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const inPlayoffs = (month === 4 && day >= 13) || month === 5 || month === 6;
  const inRegularSeason = month >= 10 || (month >= 1 && month < 4) || (month === 4 && day <= 12);

  const nbaContext = inPlayoffs
    ? "The NBA is currently in the playoffs. Games are part of a best-of-seven playoff series. Teams may rest stars, adjust rotations, or play with heightened intensity compared to regular season. Treat every game as a playoff game with playoff implications — not a regular season context."
    : inRegularSeason
    ? "The NBA regular season is currently underway."
    : "The NBA is in its offseason.";

  const dateContext = `Today's date is ${today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. ${nbaContext} Do not infer season context from roster data alone.`;
  const systemPrompt = SYSTEM_PROMPT.replace("## THE VOICE", `${dateContext}\n\n## THE VOICE`);

  // ─── TEMPORARY DEBUG LOGGING — remove when done diagnosing ─────────────────
  console.log("\n════════════════════════════════════════════════════════════════════");
  console.log(`[breakdown:NBA:debug] gameId=${data.game.gameId} ${data.game.awayTeam.teamAbv} @ ${data.game.homeTeam.teamAbv}`);
  console.log("────────────────────────────────────────────────────────────────────");
  console.log("[breakdown:NBA:debug] HOME INJURIES:", JSON.stringify(data.injuries.homeInjuries, null, 2));
  console.log("[breakdown:NBA:debug] AWAY INJURIES:", JSON.stringify(data.injuries.awayInjuries, null, 2));
  console.log("────────────────────────────────────────────────────────────────────");
  console.log("[breakdown:NBA:debug] HOME TOP PLAYERS (raw from Tank01):");
  console.log(JSON.stringify(data.homeTeamStats.topPlayers, null, 2));
  console.log("[breakdown:NBA:debug] AWAY TOP PLAYERS (raw from Tank01):");
  console.log(JSON.stringify(data.awayTeamStats.topPlayers, null, 2));
  console.log("────────────────────────────────────────────────────────────────────");
  console.log("[breakdown:NBA:debug] FULL SYSTEM PROMPT sent to Claude:");
  console.log(systemPrompt);
  console.log("────────────────────────────────────────────────────────────────────");
  console.log("[breakdown:NBA:debug] FULL USER MESSAGE sent to Claude:");
  console.log(userMessage);
  console.log("════════════════════════════════════════════════════════════════════\n");
  // ─── END DEBUG LOGGING ────────────────────────────────────────────────────

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const raw = message.content[0];
  if (raw.type !== "text") throw new Error("Unexpected Claude response type");

  // Strip any accidental markdown code fences
  const json = raw.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: BreakdownResult;
  try {
    parsed = JSON.parse(json) as BreakdownResult;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${json.slice(0, 200)}`);
  }

  // Validate the closing line is present in decisionLens
  const CLOSING_LINE = "This is not a pick. This is what the data says. Your decision is always yours.";
  if (!parsed.decisionLens) {
    parsed.decisionLens = CLOSING_LINE;
  } else if (!parsed.decisionLens.includes(CLOSING_LINE)) {
    parsed.decisionLens = parsed.decisionLens.trimEnd() + " " + CLOSING_LINE;
  }

  // Enforce the edge closing line
  const EDGE_CLOSING_LINE = "These are the environments the data creates. Your decision is always yours.";
  if (!parsed.edgeClosingLine || !parsed.edgeClosingLine.includes(EDGE_CLOSING_LINE)) {
    parsed.edgeClosingLine = EDGE_CLOSING_LINE;
  }
  if (!Array.isArray(parsed.edge)) parsed.edge = [];

  // Default cardSummary to empty string if Claude omitted it — slate page renders nothing rather than fallback
  if (typeof parsed.cardSummary !== "string") parsed.cardSummary = "";

  // Clamp confidence level
  parsed.confidenceLevel = Math.max(1, Math.min(4, parsed.confidenceLevel)) as ConfidenceLevel;

  // Ensure confidenceLabel matches level
  const labelMap: Record<ConfidenceLevel, ConfidenceLabel> = {
    1: "CLEAR SPOT",
    2: "LEAN",
    3: "FRAGILE",
    4: "PASS",
  };
  parsed.confidenceLabel = labelMap[parsed.confidenceLevel];

  return parsed;
}
