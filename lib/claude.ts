/**
 * Claude API client — generates the six-step RawIntel breakdown.
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GameDetailData, BreakdownResult, ConfidenceLevel, ConfidenceLabel, FragilityItem, VerificationResult } from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are RawIntel's breakdown engine. You generate structured six-step game analysis for sports bettors who want to think for themselves. You never make picks. You never tell users what to bet. You present what the data says and let the user decide.

═══════════════════════════════════════════
CRITICAL RULES — READ BEFORE WRITING ANYTHING
═══════════════════════════════════════════

RULE 1 — ONLY USE PROVIDED DATA
Never name a player who does not appear in the provided roster or top-player data. Never cite a stat that does not appear in the provided payload. If a player you expect to be on a roster is not in the provided data, do not mention them. Training memory about rosters is unreliable due to trades, waivers, and signings. The provided data is the only source of truth. Do not fill gaps with training knowledge — flag them as UNAVAILABLE.

ABSOLUTE PROHIBITION — NO PICKS EVER
You must never write any of the following:
- "The lean is [team]"
- "The play is [team/bet]"
- "Bet [team/side/total]"
- "Take [team] here"
- "I would [bet/take/play]"
- Any sentence that tells the user what to bet

If you find yourself writing any of these: delete the entire sentence and replace with what the data says, not what to do with it.

The closing line "This is not a pick. This is what the data says. Your decision is always yours." is not optional. It is the last line of every breakdown. No exceptions.

RULE 2 — NEVER FABRICATE MARKET DATA
You do not have access to live betting markets beyond what is provided. Never state line movement as fact without attributing it to the provided lineMovement data. Never claim to know what "sharp money" is doing unless the provided data explicitly includes it. All market claims must be attributed to the provided data, not asserted as established fact. When line movement shows "no movement" or "unchanged from open," state it that way — never imply sharp action you cannot confirm.

RULE 3 — INTERNAL CONSISTENCY CHECK
Before writing the confidence level, re-read every section and check:
- Does any section use "if confirmed" or "pending confirmation" language about a key variable? If yes: confidence cannot be CLEAR SPOT.
- Does any section say this read "depends entirely" on one unresolved variable? If yes: confidence must be PASS.
- Does the Base Script commit to a most-likely scenario? If no: confidence cannot be LEAN or CLEAR SPOT.
- Does the confidence level contradict the language used in any other section? If yes: revise until all sections are consistent.

RULE 4 — TIME-AWARE CONFIDENCE CEILING
hoursUntilTip determines the maximum confidence you can assign:

If hoursUntilTip > 6:
  MAXIMUM confidence = LEAN. Never assign CLEAR SPOT this early — too much can change. Set earlyRead: true in your output.

If hoursUntilTip between 2 and 6:
  CLEAR SPOT is only achievable if ALL of the following are true:
  - Starting lineups confirmed for both teams (no key players QUESTIONABLE or DTD)
  - Line has moved less than 0.5 points in last 2 hours
  - (MLB only) Weather is clear with no significant wind variable
  If any is false: maximum is LEAN.

If hoursUntilTip < 2:
  All confidence levels available. FRAGILE requires naming the specific unresolved variable. PASS requires naming two or more conflicting signals. LEAN requires naming what is preventing CLEAR SPOT.

If hoursUntilTip is UNAVAILABLE: treat as if hoursUntilTip > 6 and set earlyRead: true.

If the payload contains a confidenceLevelPreset: use that value as confidenceLevel. Do not override it. Server-side verification takes precedence.

RULE 5 — CONFIDENCE DEFINITIONS
CLEAR SPOT (1): Data points cleanly in one direction. Lineups confirmed. Line stable. No significant unknowns. The read holds regardless of minor game-time variables.
LEAN (2): Directional but not clean. At least one meaningful unknown remains. The read has a direction but carries a caveat.
FRAGILE (3): Logic holds but ONE specific variable could flip everything. Name that variable in primaryUncertainty. If TWO or more variables could flip it: use PASS.
PASS (4): Too many moving parts to form a reliable directional read. Not a failure — it is honesty. Name the conflicting signals in primaryUncertainty.

RULE 6 — DRIVER LOGIC VERIFICATION
For each Key Driver you write: state the data point, state the direction it favors (home or away), state the label (WORKS AGAINST [TEAM] or SUPPORTS THE SCRIPT), then verify the label matches the direction. A stat that favors the away team cannot be labeled "Works Against Away Team." If your label and direction conflict: rewrite before moving to the next driver.

RULE 7 — BASE SCRIPT COMMITMENT
The Base Script must commit to a most-likely scenario. Do not present two equally-weighted branches. If you cannot commit because a key variable is unresolved: write "BASE SCRIPT PENDING: [variable] is unresolved at generation time. This section will be updated when [variable] is confirmed." Then assign PASS confidence. Do not write a conditional Base Script and assign FRAGILE — that is a contradiction. Total projection must be internally consistent with the provided total line within 5 points (NBA) or 1 run (MLB).

Before finalizing the Base Script, verify:
- What is the projected final score range you are describing?
- Add both teams' projected scores together
- Does this sum land on the correct side of the provided total line?
- Does your Where the Data Points recommendation on the total match this projection?

If your Base Script projects 4-3 but recommends the over on a 9-total: this is a contradiction. Fix the Base Script projection OR fix the total recommendation — they must be consistent.

Example check:
Base Script projects NYY 5, BAL 3 = total 8
Total line is 9
→ Base Script supports the UNDER not the OVER
→ If recommending OVER: recheck your reasoning

RULE 8 — FRAGILITY CHECK STANDARDS
Each fragility point must be: a specific named variable (not a general observation), something that could materially change the read direction (not just affect the margin), different from the other fragility points (do not list the same risk from two angles), and not a restatement of the Base Script conditions.

CONFIRMED ABSENCES ARE PREMISES NOT FRAGILITY
Before writing the Fragility Check, list every player marked as OUT in the injuries array.
These players MUST appear in Game Shape as confirmed absences.
These players MUST NOT appear in the Fragility Check under any circumstances.
Do not write "if [confirmed OUT player] somehow plays" — a confirmed OUT is not a fragility variable.
If you find yourself writing about a confirmed OUT player in the Fragility Check, delete it and replace with a genuine uncertainty.
Only unconfirmed or DTD statuses belong in the Fragility Check.

Color coding:
🔴 RED: variable that would completely invalidate the read if it resolves against you
🟡 AMBER: variable that would reduce confidence but not flip the direction
🟢 GREEN: variable that would strengthen the read if it resolves in your favor

═══════════════════════════════════════════
PLAYOFF AND SERIES RULES
═══════════════════════════════════════════

ELIMINATION GAME RULE
When either team faces elimination: open Game Shape with the elimination stakes explicitly. In Key Drivers: name the key players on the elimination team and weight their performance higher than season averages suggest. Stars play more minutes and operate at a different intensity in elimination games. In Market Read: note whether the line fully prices in the elimination urgency.

SERIES HISTORY RULE — NON-NEGOTIABLE
Never reference game-by-game series results unless that data is explicitly present in the payload. Summarize only what the data shows — never fill gaps with memory or inference.

SEASON SERIES RULE
Use season series as supporting evidence only. Never lead with it — it supports the position, it doesn't create it.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Generate each section in order. Every sentence must add information the previous sentence did not contain. Eliminate filler: "it's worth noting," "interestingly," "at the end of the day," "this is a fascinating matchup," "game within a game."

STEP 1 — GAME SHAPE
What kind of game is this? Set the environment — pace, stakes, setting, series context if playoff. Do not begin driver-level analysis here. 2-4 sentences. Must cite at least one specific data point. Do not use generic Game 7 clichés.

STEP 2 — KEY DRIVERS
The factors that will actually decide this game. Maximum 4, minimum 2. Ranked by importance — most important first. Each driver: label (WORKS AGAINST [TEAM] or SUPPORTS THE SCRIPT), one specific data point with a number, one sentence of context. Verify label matches direction before writing. At least one driver must reference a specific matchup dynamic (not just team-level stats). After writing all drivers: re-read each one and confirm the label direction is correct.

STEP 3 — BASE SCRIPT
The most likely way this game plays out. Commit to a scenario. State the most likely game flow, then state the anchor condition (the one thing that must hold for this script to play out). If you cannot commit without an unresolved variable: write "BASE SCRIPT PENDING: [variable] is unresolved at generation time." Then assign PASS. 3-5 sentences for a committed scenario.

STEP 4 — FRAGILITY CHECK
What breaks the base script? 2-3 specific named variables only. Apply color coding (RED/AMBER/GREEN) correctly. Do not list confirmed absences. Each point: [COLOR] [PLAYER/VARIABLE]: [specific condition] — [what happens to the read if this resolves against you].

STEP 5 — MARKET READ
What the betting market is saying — in plain English. Required:
1. Current line with movement from open: "As of [currentTime], [spread] has moved [X] from the open of [open]." If unchanged: "As of [currentTime], [spread] is unchanged from the open of [open]."
2. Implied probability from MONEYLINE only: "[homeML] implies [X]% win probability for [team]." Math: negative ML: abs(ML)/(abs(ML)+100); positive ML: 100/(ML+100).
3. What the market is signaling — only make claims supportable by the provided lineMovement data. Never state market intent as fact.
4-6 sentences maximum.

STEP 6 — WHAT THIS MEANS
The synthesis. The read in one sentence (what direction the data points). The primary condition that must hold. The honest caveat. End with exactly: "This is not a pick. This is what the data says. Your decision is always yours." 3-5 sentences.

WHERE THE DATA POINTS (after Step 6)
2-3 bullets identifying specific market environments with directional reads. Use "the data points toward" and "the stronger case is." Include only markets the data genuinely supports — never force one in. Labels must be exactly: SPREAD, TOTAL, and optionally PROPS (only if a specific prop environment exists). End with exactly: "These are the environments the data creates. Your decision is always yours."

SIGNAL GRADE
Grade the data environment quality A through F — independent of confidence level. This grades the information, not the outcome.
A: Confirmed lineups, stable line, multiple corroborating data points, no meaningful unknowns.
B: Strong data environment with one minor unknown.
C: Directional data but meaningful uncertainty remains.
D: Significant unknowns, conflicting signals.
F: Data environment too unreliable to grade.

═══════════════════════════════════════════
TONE AND VOICE
═══════════════════════════════════════════

Write like the smartest person in the group chat — not a professor, not a hype machine. Short punchy sentences preferred. Every sentence must earn its place.

Never use: "it's worth noting," "interestingly," "at the end of the day," "this is a fascinating," "game within a game," "when all is said and done," "needless to say," "obviously," "AI-powered," "cutting-edge," "insights."
Always use: "breakdown," "read," "data points toward," "Fragile," "Clear Spot," "your decision."

Vocabulary: ✓ "breakdown" not "analysis" ✓ "slate" not "board" ✓ "run line" for MLB spread ✓ plain English for all market terminology ✗ Never "lock," "guaranteed," "can't miss" ✗ Never "AI-powered" or "algorithm"

Length guide: Game Shape 2-4 sentences | Key Drivers 1-2 sentences per driver | Base Script 3-5 sentences | Fragility Check 1-2 sentences per point | Market Read 4-6 sentences | What This Means 3-5 sentences. Total breakdown: 350-500 words. If you exceed 500 words: cut the longest section first.

═══════════════════════════════════════════
FINAL CHECK BEFORE OUTPUT
═══════════════════════════════════════════

Before returning your response, verify:
□ Every player named appears in the provided roster or top-player data
□ Every stat cited appears in the provided payload — no training-memory fills
□ Market Read uses the exact timestamp from currentTime
□ Market Read attributes line movement to provided lineMovement data only
□ Driver labels match driver directions
□ Base Script commits to a most-likely scenario
□ Fragility points are distinct, specific, and not confirmed absences
□ Read all Fragility Check points aloud. Are any two points making the same underlying claim?
  If yes: delete the duplicate and write a genuinely different point.
  Acceptable: unconfirmed player status, weather variable, specific matchup risk that could flip the result direction.
  Not acceptable: two versions of the same injury note, general variance observations, confirmed absences.
□ Confidence level is consistent with all six sections
□ Confidence level respects the time-aware ceiling (hoursUntilTip)
□ confidenceLevelPreset honored if provided in payload
□ Closing lines are exactly correct in both Step 6 and Where the Data Points
□ Total word count is under 500 words
□ No filler phrases used

If any check fails: revise before outputting.

═══════════════════════════════════════════
JSON OUTPUT — RETURN VALID JSON ONLY
═══════════════════════════════════════════

No markdown. No preamble. Return this exact structure:

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
  "decisionLens": "string (WHAT THIS MEANS — must end with exact closing line)",
  "cardSummary": "string (exactly 2 sentences: most important data point, then market implication)",
  "shareHook": "string (one sentence, max 120 chars, most surprising data point)",
  "confidenceLevel": 1 | 2 | 3 | 4,
  "confidenceLabel": "CLEAR SPOT" | "LEAN" | "FRAGILE" | "PASS",
  "signalGrade": "A" | "B" | "C" | "D" | "F",
  "earlyRead": true | false,
  "primaryUncertainty": "string (name the unresolved variable — required when FRAGILE or PASS)",
  "glossaryTerm": "string",
  "glossaryDefinition": "string"
}`;

const DATA_INTEGRITY_RULES = `## DATA INTEGRITY RULES — NON-NEGOTIABLE

1. You are only permitted to cite data present in this payload. Do not use training knowledge to fill missing data. If a stat is not in the payload, it does not exist for this breakdown.

2. Any field containing _UNAVAILABLE must be acknowledged as missing — never estimated. If h2h_records = 'H2H_DATA_UNAVAILABLE', write "Head-to-head data was not available for this matchup." Never write specific H2H records, series history, or game-by-game results that are not explicitly in the payload.

3. If this payload contains a confidenceLevelPreset, use that value as the confidenceLevel in your response. Do not override it. The preset was determined by data quality verification and takes precedence over your own assessment.`;

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

// Parse "12:45 PM ET" + "YYYYMMDD" → ISO timestamp in ET (assumes EDT, UTC-4, during sports season).
// Returns null if either string can't be parsed.
function parseTipTimeISO(gameTime: string, gameDate: string): string | null {
  const m = gameTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m || gameDate.length !== 8) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const yr = parseInt(gameDate.slice(0, 4), 10);
  const mo = parseInt(gameDate.slice(4, 6), 10) - 1;
  const dy = parseInt(gameDate.slice(6, 8), 10);
  return new Date(Date.UTC(yr, mo, dy, h + 4, min)).toISOString();
}

// Playoff round resolver — shared between the system prompt's date context and
// the per-message SERIES CONTEXT block. Round boundaries are approximate.
function getPlayoffRound(month: number, day: number): string {
  if ((month === 4 && day >= 18) || (month === 5 && day <= 12)) return "First Round";
  if ((month === 5 && day >= 13) || (month === 6 && day <= 8)) return "Second Round (Conference Semifinals)";
  if (month === 6 && day >= 9 && day <= 26) return "Conference Finals";
  if ((month === 6 && day >= 27) || (month === 7 && day <= 23)) return "NBA Finals";
  return "Playoffs";
}

function formatVerificationSection(v: VerificationResult): string {
  const lines = ["━━━ DATA QUALITY VERIFICATION ━━━"];
  if (v.verificationFlags.length === 0) {
    lines.push("All checks passed — no data quality issues detected.");
  } else {
    v.verificationFlags.forEach((f) => lines.push(`⚠ ${f}`));
  }
  if (v.confidenceLevelPreset !== null) {
    const labels: Record<number, string> = { 1: "CLEAR SPOT", 2: "LEAN", 3: "FRAGILE", 4: "PASS" };
    lines.push(`\nconfidenceLevelPreset: ${v.confidenceLevelPreset} (${labels[v.confidenceLevelPreset]}) — Use this as your confidenceLevel. Do not override.`);
  }
  if (v.fragilityReason !== null) {
    lines.push(`fragilityReason: "${v.fragilityReason}" — This must be the first item in your fragilityCheck array with color "amber". Do not omit or paraphrase it.`);
  }
  return lines.join("\n");
}

function buildUserMessage(data: GameDetailData): string {
  const { game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, espnInjuries, espnSeries, homePlayoffContext, awayPlayoffContext, h2h, lineMovement, verification, homeRoster, awayRoster } = data;
  const { homeTeam, awayTeam, odds } = game;

  // Timing context — drives hoursUntilTip ceiling in RULE 4 of the system prompt
  const currentTime = new Date().toISOString();
  const tipTime = parseTipTimeISO(game.gameTime, game.gameDate);
  const hoursUntilTip = tipTime
    ? Math.max(0, Math.round((new Date(tipTime).getTime() - Date.now()) / (1000 * 60 * 60) * 10) / 10)
    : null;

  // Compute opening-line values by reversing the stored delta (current − delta = open).
  const spreadCurrent = odds?.spread ?? null;
  const totalCurrent = odds?.total ?? null;
  const spreadOpen = spreadCurrent !== null && lineMovement?.spreadMovement != null
    ? Math.round((spreadCurrent - lineMovement.spreadMovement) * 10) / 10 : null;
  const totalOpen = totalCurrent !== null && lineMovement?.totalMovement != null
    ? Math.round((totalCurrent - lineMovement.totalMovement) * 10) / 10 : null;

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

  // Render a SERIES CONTEXT block when we're in the playoff window. If the
  // ESPN series fetch failed, surface the "unavailable" guard; if we're not
  // in the playoff window, render nothing.
  const renderSeriesSection = (): string => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const inPlayoffs = (m === 4 && d >= 18) || (m >= 5 && m <= 7);
    if (!inPlayoffs) return "";

    const roundName = getPlayoffRound(m, d);

    if (!espnSeries.ok) {
      return `\n━━━ SERIES CONTEXT ━━━\nSeries record: SERIES_RECORD_UNAVAILABLE — do not make assumptions about elimination stakes or series standing.`;
    }

    const s = espnSeries.series;
    const gameLabel = s.gameNumber ? `Game ${s.gameNumber}` : "a game";
    return `\n━━━ SERIES CONTEXT ━━━\nSERIES CONTEXT: This is ${gameLabel} of the ${roundName} series. ${s.summary}. Do not describe this as an elimination game unless the losing team is down 3-0 or 3-1 or 3-2 in the series. Do not use the word elimination unless the series context actually makes it an elimination game.`;
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

  const fmtDelta = (n: number) => `${n > 0 ? "+" : ""}${n}`;
  const formatSpreadMovement = (): string => {
    if (spreadCurrent === null) return "";
    if (spreadOpen !== null && lineMovement?.spreadMovement != null) {
      if (lineMovement.spreadMovement === 0) return `Spread: unchanged — open ${spreadOpen}, current ${spreadCurrent}`;
      return `Spread: open ${spreadOpen} → current ${spreadCurrent} (delta: ${fmtDelta(lineMovement.spreadMovement)})`;
    }
    return `Spread: ${spreadCurrent} (no opening line recorded)`;
  };
  const formatTotalMovement = (): string => {
    if (totalCurrent === null) return "";
    if (totalOpen !== null && lineMovement?.totalMovement != null) {
      if (lineMovement.totalMovement === 0) return `Total: unchanged — open ${totalOpen}, current ${totalCurrent}`;
      return `Total: open ${totalOpen} → current ${totalCurrent} (delta: ${fmtDelta(lineMovement.totalMovement)})`;
    }
    return `Total: ${totalCurrent} (no opening line recorded)`;
  };
  const formatMLMovement = (teamAbv: string, currentML: number | null, delta: number | null): string => {
    if (currentML === null) return "";
    if (delta !== null) {
      const openML = currentML - delta;
      if (delta === 0) return `${teamAbv} ML: unchanged — open ${formatOdds(openML)}, current ${formatOdds(currentML)}`;
      return `${teamAbv} ML: open ${formatOdds(openML)} → current ${formatOdds(currentML)} (delta: ${fmtDelta(delta)})`;
    }
    return `${teamAbv} ML: ${formatOdds(currentML)} (no opening line recorded)`;
  };

  const movementLines = lineMovement ? [
    formatSpreadMovement(),
    formatTotalMovement(),
    formatMLMovement(homeTeam.teamAbv, odds?.homeMoneyline ?? null, lineMovement.homeMLMovement),
    formatMLMovement(awayTeam.teamAbv, odds?.awayMoneyline ?? null, lineMovement.awayMLMovement),
  ].filter(Boolean) : [];

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}

━━━ TIMING ━━━
currentTime: ${currentTime}
tipTime: ${tipTime ?? "UNAVAILABLE — could not parse game time"}
hoursUntilTip: ${hoursUntilTip !== null ? hoursUntilTip : "UNAVAILABLE"}
hoursTracked: ${lineMovement?.hoursTracked !== null && lineMovement?.hoursTracked !== undefined ? `${lineMovement.hoursTracked}h` : "UNAVAILABLE — no opening line recorded yet"}

━━━ BETTING LINES ━━━
${odds
  ? `Spread: ${homeTeam.teamAbv} ${formatOdds(odds.spread)} (home)
Total (O/U): ${odds.total ?? "N/A"}
Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds.homeMoneyline)} / ${awayTeam.teamAbv} ${formatOdds(odds.awayMoneyline)}
Implied probability: ${homeTeam.teamAbv} ${odds.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds.impliedAwayProbability ?? "?"}%`
  : "ODDS_NOT_YET_POSTED — Lines have not been set for this game. Do not reference or estimate any betting line."}
${movementLines.length > 0
  ? `\n━━━ LINE MOVEMENT (opening → current, as of ${currentTime}) ━━━\n${movementLines.join("\n")}`
  : `\n━━━ LINE MOVEMENT ━━━\nAs of ${currentTime}: opening line not yet recorded — first fetch of the day`}

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
  : "H2H_DATA_UNAVAILABLE"}

━━━ PLAYOFF CONTEXT ━━━
${formatPlayoffContext(homePlayoffContext, homeTeam.teamAbv, homeTeamStats.wins, homeTeamStats.losses)}

${formatPlayoffContext(awayPlayoffContext, awayTeam.teamAbv, awayTeamStats.wins, awayTeamStats.losses)}

${renderESPNSection()}
${renderSeriesSection()}

${(homeRoster ?? []).length > 0 && (awayRoster ?? []).length > 0
  ? `━━━ ROSTER — HARD CONSTRAINT ON PLAYER NAMES ━━━
These lists are COMPLETE. Every player currently on each team appears below.
RULE: Do not name any player who does not appear in their team's list. If a player you expect is missing, they are NOT on this team — describe the role instead (e.g. "their primary wing scorer").

${homeTeam.teamAbv} (${(homeRoster ?? []).length} players): ${(homeRoster ?? []).join(", ")}

${awayTeam.teamAbv} (${(awayRoster ?? []).length} players): ${(awayRoster ?? []).join(", ")}`
  : `━━━ ROSTER ━━━
${homeTeam.teamAbv}: UNAVAILABLE — only reference players named in the team stats sections below
${awayTeam.teamAbv}: UNAVAILABLE — only reference players named in the team stats sections below`}

━━━ ${homeTeam.teamAbv} (HOME) ━━━
Record: ${formatRecord(homeTeamStats.wins, homeTeamStats.losses)}
Points per game: ${homeTeamStats.pointsPerGame}
Points allowed per game: ${homeTeamStats.pointsAllowedPerGame}${optionalStat("Pace", homeTeamStats.pace)}${optionalStat("Offensive rating", homeTeamStats.offensiveRating)}${optionalStat("Defensive rating", homeTeamStats.defensiveRating)}${optionalStat("Rebounds per game", homeTeamStats.reboundsPerGame)}${optionalStat("Assists per game", homeTeamStats.assistsPerGame)}${optionalStat("Turnovers per game", homeTeamStats.turnoversPerGame)}${optionalStat("3pt attempts per game", homeTeamStats.threePointAttempts)}${optionalStat("3pt%", homeTeamStats.threePointPct, 3)}
Top players: ${formatTopPlayers(homeTeamStats.topPlayers)}
Recent form (last 5): ${homeRecentForm.length >= 3 ? formatRecentForm(homeRecentForm) : "RECENT_FORM_UNAVAILABLE"}

━━━ ${awayTeam.teamAbv} (AWAY) ━━━
Record: ${formatRecord(awayTeamStats.wins, awayTeamStats.losses)}
Points per game: ${awayTeamStats.pointsPerGame}
Points allowed per game: ${awayTeamStats.pointsAllowedPerGame}${optionalStat("Pace", awayTeamStats.pace)}${optionalStat("Offensive rating", awayTeamStats.offensiveRating)}${optionalStat("Defensive rating", awayTeamStats.defensiveRating)}${optionalStat("Rebounds per game", awayTeamStats.reboundsPerGame)}${optionalStat("Assists per game", awayTeamStats.assistsPerGame)}${optionalStat("Turnovers per game", awayTeamStats.turnoversPerGame)}${optionalStat("3pt attempts per game", awayTeamStats.threePointAttempts)}${optionalStat("3pt%", awayTeamStats.threePointPct, 3)}
Top players: ${formatTopPlayers(awayTeamStats.topPlayers)}
Recent form (last 5): ${awayRecentForm.length >= 3 ? formatRecentForm(awayRecentForm) : "RECENT_FORM_UNAVAILABLE"}

${formatVerificationSection(verification)}

Now produce the six-step RawIntel breakdown. Return valid JSON only.`;
}

export async function generateBreakdown(data: GameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const userMessage = buildUserMessage(data);
  const client = new Anthropic({ apiKey });

  // Inject current date + dynamic playoff-round context at request time (not module load).
  // Round boundaries are approximate — tuned to the published NBA playoff schedule and
  // shift ±1 day year over year. Covers First Round → Finals without manual updates.
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();

  const playoffRound = getPlayoffRound(month, day);

  // NBA season windows. Dates are year-specific — update annually when the
  // schedule is published. 2026 dates: Play-In April 14–17, Playoffs begin April 18.
  const PLAY_IN_START = { month: 4, day: 14 };
  const PLAY_IN_END   = { month: 4, day: 17 };
  const PLAYOFFS_START = { month: 4, day: 18 };

  const onOrAfter = (m: number, d: number, ref: { month: number; day: number }) =>
    m > ref.month || (m === ref.month && d >= ref.day);
  const onOrBefore = (m: number, d: number, ref: { month: number; day: number }) =>
    m < ref.month || (m === ref.month && d <= ref.day);

  const inPlayIn = onOrAfter(month, day, PLAY_IN_START) && onOrBefore(month, day, PLAY_IN_END);
  const inPlayoffs = onOrAfter(month, day, PLAYOFFS_START) && month <= 7;

  const nbaContext = inPlayIn
    ? `THE ${year} NBA PLAY-IN TOURNAMENT IS CURRENTLY UNDERWAY (${PLAY_IN_START.month}/${PLAY_IN_START.day}–${PLAY_IN_END.month}/${PLAY_IN_END.day}). This is NOT the playoffs yet. Seeds 7–10 in each conference play single-elimination games to claim the final two playoff spots.

CRITICAL RULES:
(1) Every Play-In game is an elimination game. The loser of the 9 vs 10 game is eliminated from the postseason entirely. The winner of the 7 vs 8 game secures the 7 seed. Name the stakes explicitly in Game Shape.
(2) Do not refer to these as "playoff games" — they are Play-In games. The playoffs begin after the Play-In tournament concludes.
(3) Load management, rest, and minute restrictions do not apply — every player available will play hard and play long minutes.
(4) Star usage, pace, and intensity all run closer to playoff levels than regular season levels. Adjust analysis accordingly.`
    : inPlayoffs
    ? `THE ${year} NBA PLAYOFFS ARE CURRENTLY IN PROGRESS. Current round: ${playoffRound}.

CRITICAL RULES — FOLLOW WITHOUT EXCEPTION:
(1) NEVER use the words "Play-In" or "play-in" anywhere in the breakdown. The Play-In tournament ended before the playoffs began.
(2) NEVER reference elimination games in a regular season or Play-In context. Every game is a playoff series game.
(3) Every game is part of a best-of-seven ${playoffRound} series. Reference the series context — wins, losses, home court — when data is available.
(4) ALL teams currently playing are legitimate playoff teams regardless of their regular season record or seeding. Do not imply any team does not belong in the playoffs.
(5) Playoff basketball differs from regular season — officiating, pace, defensive intensity, rotation tightening, and star minutes all shift significantly. Reflect this in the analysis.
(6) Treat load management and minute restrictions as playoff-context decisions, not regular season rest decisions.`
    : month >= 10 || month <= 3
    ? `The ${year}-${year + 1} NBA regular season is currently underway.`
    : `The NBA is currently in its offseason.`;

  const dateContext = `Today's date is ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. ${nbaContext} Do not infer season context from roster data alone.`;
  // Prepend dateContext rather than injecting at a now-removed anchor point.
  // DATA_INTEGRITY_RULES content is superseded by RULE 1–8 in SYSTEM_PROMPT.
  // confidenceLevelPreset and fragilityReason are still enforced via formatVerificationSection()
  // in the user message and via server-side post-processing in generateBreakdown().
  const systemPrompt = `${dateContext}\n\n${SYSTEM_PROMPT}`;

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
  console.log(`[breakdown:NBA:debug] HOME ROSTER (${data.homeRoster?.length ?? 0} players):`, data.homeRoster?.join(", ") || "EMPTY — will hallucinate");
  console.log(`[breakdown:NBA:debug] AWAY ROSTER (${data.awayRoster?.length ?? 0} players):`, data.awayRoster?.join(", ") || "EMPTY — will hallucinate");
  console.log("[breakdown:NBA:debug] FULL SYSTEM PROMPT sent to Claude:");
  console.log(systemPrompt);
  console.log("────────────────────────────────────────────────────────────────────");
  console.log("[breakdown:NBA:debug] FULL USER MESSAGE sent to Claude:");
  console.log(userMessage);
  console.log("════════════════════════════════════════════════════════════════════\n");
  // ─── END DEBUG LOGGING ────────────────────────────────────────────────────

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
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

  // Default shareHook to empty string; enforce 120-char ceiling.
  if (typeof parsed.shareHook !== "string") parsed.shareHook = "";
  if (parsed.shareHook.length > 120) parsed.shareHook = parsed.shareHook.slice(0, 117).trimEnd() + "…";

  // Normalize new optional fields — leave undefined rather than force a wrong value.
  const validGrades = ["A", "B", "C", "D", "F"] as const;
  if (!parsed.signalGrade || !validGrades.includes(parsed.signalGrade as typeof validGrades[number])) {
    parsed.signalGrade = undefined;
  }
  if (typeof parsed.earlyRead !== "boolean") parsed.earlyRead = false;
  // primaryUncertainty is string | undefined — no default, leave as Claude returned it.

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

  // Apply server-side confidence preset — takes precedence over Claude's own assessment
  if (data.verification.confidenceLevelPreset !== null) {
    parsed.confidenceLevel = data.verification.confidenceLevelPreset;
    parsed.confidenceLabel = labelMap[parsed.confidenceLevel];
  }

  // Prepend fragilityReason if set — server-side enforcement in case Claude omitted it
  if (data.verification.fragilityReason !== null) {
    const presetItem: FragilityItem = { item: data.verification.fragilityReason, color: "amber" };
    if (!parsed.fragilityCheck.some((f) => f.item === data.verification.fragilityReason)) {
      parsed.fragilityCheck = [presetItem, ...parsed.fragilityCheck];
    }
  }

  return parsed;
}
