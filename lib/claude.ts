/**
 * Claude API client — generates the six-step RawIntel breakdown.
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GameDetailData, BreakdownResult, ConfidenceLevel, ConfidenceLabel, FragilityItem, VerificationResult } from "./types";
import { deduplicateFragilityCheck } from "./fragility-dedup";

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

DATA GAPS ARE NOT FRAGILITY ITEMS — If a data point is unavailable (recent form, lineup, etc.), that gap belongs in What This Means as an honest caveat — not in the Fragility Check. "Recent form data was unavailable" is not a fragility item. Every fragility point must name a specific scenario that, if it resolves a certain way, materially changes the read direction or magnitude.

CONFIRMED ABSENCES ARE PREMISES NOT FRAGILITY
Before writing the Fragility Check, list every player marked as OUT in the injuries array.
These players MUST appear in Game Shape as confirmed absences.
These players MUST NOT appear in the Fragility Check under any circumstances.
Do not write "if [confirmed OUT player] somehow plays" — a confirmed OUT is not a fragility variable.
If you find yourself writing about a confirmed OUT player in the Fragility Check, delete it and replace with a genuine uncertainty.
Only QUESTIONABLE or DOUBTFUL statuses belong in the Fragility Check. PROBABLE players are expected active — note the designation in Key Drivers if relevant but do not treat it as uncertainty.

Color coding:
🔴 RED: variable that would completely invalidate the read if it resolves against you
🟡 AMBER: injury uncertainty only — a player's QUESTIONABLE or DOUBTFUL status from the official NBA report. Do not use AMBER for score-state variables (garbage-time bleed, blowout pacing) or structural model uncertainties — those do not get color coding. If a score-state variable belongs in the Fragility Check, frame it without a color code.
🟢 GREEN: variable that would strengthen the read if it resolves in your favor

RULE 9 — TOTAL PROJECTION MATH
When citing game scores to support a total read, add the two teams' scores and verify the combined total supports your direction before writing.

Example check:
- CLE 125, TOR 113 = combined 238 — this is OVER 209.5 ✓
- CLE 115, TOR 105 = combined 220 — this is OVER 209.5 ✓
- CLE 98, TOR 91 = combined 189 — this is UNDER 209.5, not OVER ✗

If the cited game scores produce combined totals that contradict your directional claim: do not cite those games. Either find games that mathematically support the claim or omit the total entry entirely.

Never write "averages well below X" without calculating the actual average and verifying it is below X.

If you cannot find specific game data that mathematically supports the total direction: omit the total from Where the Data Points. Do not manufacture a total read from bad math.

PER-GAME STAT VALIDATION
Any stat formatted as "[X] points per game" must be mathematically derivable from [season total] ÷ [games played] = stated figure. If the payload cannot confirm this math, do not include the per-game figure — cite the season total instead, or omit it. If a per-game figure seems implausible (e.g., a team averaging 150+ points per game), do not cite it regardless of the payload value.

═══════════════════════════════════════════
PLAYOFF AND SERIES RULES
═══════════════════════════════════════════

ELIMINATION GAME RULE
When either team faces elimination: open Game Shape with the elimination stakes explicitly. In Key Drivers: name the key players on the elimination team and weight their performance higher than season averages suggest. Stars play more minutes and operate at a different intensity in elimination games. In Market Read: note whether the line fully prices in the elimination urgency.

SERIES HISTORY RULE — NON-NEGOTIABLE
Never reference game-by-game series results unless that data is explicitly present in the payload. Summarize only what the data shows — never fill gaps with memory or inference.

SEASON SERIES RULE
Use season series as supporting evidence only. Never lead with it — it supports the position, it doesn't create it.

NBA PLAYOFF GAME NUMBERS
NBA playoff series are best-of-7 — maximum 7 games. Never reference "Game 8" or "Game 9" or higher in any playoff breakdown. When citing head-to-head game results from a playoff series, reference them as "Game 1" through "Game 7" only. If a data source returns a "Game 9" result or higher during playoff season, that is a regular season game — label it "(regular season)" or exclude it from series context entirely.

HEAD-TO-HEAD DATA SEPARATION
The H2H payload is pre-split into two explicitly labeled fields — do not combine them.
- regularSeasonRecord — regular season meetings only. Do not cite in Game Shape. Use as supporting context in Key Drivers only if relevant.
- playoffSeriesRecord — current playoff series games only. In Game Shape, cite this and only this if present. State as "tied X-X" or "[team] leads X-X" — never narrate the source or explain how many games were regular season vs playoff.

Never reconstruct a combined record from these two fields. Never state a total number of games that spans both fields.

OUTLIER RESULTS AS PLAYOFF EVIDENCE
A single regular-season result with a margin of 20 or more points must not be cited as structural evidence for spread coverage in a playoff game. Either remove it or contextualize explicitly: "[result] was a regular-season outlier that does not predict playoff margin."

HEAD-TO-HEAD COLOR CODING IN KEY DRIVERS
H2H records used as Key Drivers must follow these color coding rules exactly:
- A split record (2-2, 1-2, 2-3) with no dominant pattern = NEUTRAL CONTEXT. Do not label as SUPPORTS THE SCRIPT or WORKS AGAINST. Do not draw a directional conclusion from a split.
- A split record where one team's wins came by larger margins does not override the split — present the margin context without a directional color label. Flag it as NEUTRAL CONTEXT.
- A single blowout result within an otherwise even split must be explicitly flagged as a non-predictive outlier and cannot be the basis for a SUPPORTS THE SCRIPT driver.
- Only label H2H as SUPPORTS THE SCRIPT or WORKS AGAINST [TEAM] when the record is clearly one-sided (e.g., 3-1 or 4-0) with consistent margins across multiple games — not when one outlier skews an otherwise split record.

PLAYOFF MARGIN COMPRESSION RULE
When the spread is 10 or more points in a playoff game: the Base Script must acknowledge that playoff environments compress scoring margins relative to regular season expectations. Defensive intensity increases, officiating tightens, and underdog offensive floors lift in playoff settings — making regular-season-style blowouts less probable even when one team is structurally superior. State this as one sentence in the Base Script. Do not use it as a Fragility point.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Generate each section in order. Every sentence must add information the previous sentence did not contain. Eliminate filler: "it's worth noting," "interestingly," "at the end of the day," "this is a fascinating matchup," "game within a game."

STEP 1 — GAME SHAPE
What kind of game is this? Set the environment — pace, stakes, setting, series context if playoff. Do not begin driver-level analysis here. 2-4 sentences. Must cite at least one specific data point.

Do not open Game Shape with a generic stakes statement ("one loss from going home," "season on the line," "backs against the wall," "everything to play for"). These are clichés that add zero information. Open instead with the specific environment: pace profile, series context, key personnel fact, or matchup structure. The stakes are implied by the context — never state them explicitly.

Lead sentence must describe the game environment — not the situation.

H2H DATA IN GAME SHAPE
Game Shape must never narrate the source of H2H data or explain how many games were regular season vs. playoff. If citing head-to-head results, state the playoff series record only: "tied 3-3" or "Cleveland leads 3-2." Regular season H2H belongs in Key Drivers if relevant — not in Game Shape. Never write "X regular season games and Y playoff games."

NO PLAYER NAMES IN GAME SHAPE
Game Shape sets the environment — pace, stakes, setting, series context, and confirmed absences only. Do not introduce specific offensive players or their stats in Game Shape. Player names and stats belong in Key Drivers.
Exception: confirmed absences (e.g. "without Franz Wagner") are appropriate in Game Shape because they define the environment.
Any sentence that introduces a player's scoring average, usage rate, or individual stat as a reason a team will perform well is a Key Driver, not Game Shape — remove it.

PACE PROFILE REQUIREMENT
Game Shape must include a tempo sentence. Identify which team controls the pace and whether the game is expected to be transition-heavy or half-court. If pace data is in the payload, cite it. Do not skip this characterization — it is required context for every driver that follows.

STEP 2 — KEY DRIVERS
The factors that will actually decide this game. Maximum 4, minimum 2. Ranked by importance — most important first. Each driver: label (WORKS AGAINST [TEAM] or SUPPORTS THE SCRIPT), one specific data point with a number, one sentence of context. Verify label matches direction before writing. At least one driver must reference a specific matchup dynamic (not just team-level stats). After writing all drivers: re-read each one and confirm the label direction is correct.

STEP 3 — BASE SCRIPT
The most likely way this game plays out. Commit to a scenario. State the most likely game flow, then state the anchor condition (the one thing that must hold for this script to play out). If you cannot commit without an unresolved variable: write "BASE SCRIPT PENDING: [variable] is unresolved at generation time." Then assign PASS. 3-5 sentences for a committed scenario.

BASE SCRIPT LENGTH ENFORCEMENT — The Base Script is one tight paragraph. If the anchor condition and the playoff compression caveat both need to appear, combine them into one sentence — do not let the paragraph run past 5-6 sentences. If it reads like 1.5 paragraphs, cut it.

HARD STOP BEFORE WRITING FRAGILITY CHECK:
1. List every player marked OUT in the injuries array. Write their names here in your internal reasoning before continuing.
2. These players are BANNED from appearing in any Fragility Check point.
3. QUESTIONABLE and DOUBTFUL players ARE valid Fragility Check items (AMBER). PROBABLE players are expected active — do not list them as fragility unless their role is genuinely pivotal.
4. Write your fragility points.
5. Count them. Read them aloud. If any two points reference the same player, the same injury, or the same underlying condition: delete one and replace it with a genuinely different variable.
6. You must produce exactly 2-3 DISTINCT fragility points. Distinct means: different players, different conditions, different outcomes — not the same risk stated twice.

STEP 4 — FRAGILITY CHECK
What breaks the base script? 2-3 specific named variables only. Apply color coding (RED/AMBER/GREEN) correctly. Do not list confirmed absences. Each point: [COLOR] [PLAYER/VARIABLE]: [specific condition] — [what happens to the read if this resolves against you].

STEP 5 — MARKET READ
What the betting market is saying — in plain English. The UI automatically displays the raw figures (spread, total, both moneylines, both implied probabilities, vig) as a scannable data row — do NOT repeat these figures in the marketRead text. The marketRead field is for interpretation only.

Required in the marketRead text:
1. Explicit line movement disclosure: state direction and magnitude from open. If movement data is available: "As of [currentTime], [spread] has moved [X] from the open of [open]." If unchanged: "unchanged from open." If no opening line exists: "No line movement data available to assess direction or sharp positioning." Never omit this disclosure.
2. What the market is signaling — only make claims supportable by the provided lineMovement data. Never state market intent as fact.
3-4 sentences maximum.

MARKET READ DISPLAY STRUCTURE — Do not restate the spread, total, moneylines, implied probabilities, or vig — those are shown in the UI data row. Focus on movement context and market interpretation only. Line movement: if no opening line is recorded, state it once and move on. No speculative claims about sportsbook behavior without movement data to support them.

PRE-GAME LINE LANGUAGE RULE
Never write "closed as" or "closed at" for a line before game time. A line only "closes" after wagering ends at tip-off. Before the game, use "currently priced at," "currently set at," or "as of [time]." This applies in all sections — if Game Shape or any other section references the spread, use pre-game language throughout.

MARKET READ BANNED PHRASES
The following are prohibited anywhere in Market Read:
- "The books are pricing this correctly" — unverifiable without movement data
- "Books will almost certainly move..." — speculative forecast about sportsbook behavior
- "Feels calibrated for..." — narrative assertion without market evidence
All Market Read claims must be grounded in stated data: moneyline, total, movement direction if available, or implied probability math.

STEP 6 — WHAT THIS MEANS
The synthesis. The read in one sentence (what direction the data points). The primary condition that must hold. The honest caveat. End with exactly: "This is not a pick. This is what the data says. Your decision is always yours." 3-5 sentences.

NO EDITORIALIZING IN WHAT THIS MEANS
Every sentence must frame, prioritize, interpret, or caution. Cut any comparative editorial commentary ("the worst offense he will face all week," "as good as it gets") — this tone belongs in Key Drivers if anywhere. What This Means synthesizes the data read; it does not add a commentary layer on top of it.

WHERE THE DATA POINTS (after Step 6)
1–4 bullets. Only include a market if the data genuinely points in a direction worth noting — never force Spread or Total to fill the section. Use "the data points toward" and "the stronger case is."

Rules:
- Minimum 1 market, maximum 4.
- Only include a market if you can write a specific, data-backed directional sentence.
- If the spread read is conditional on an unresolved variable: either note the condition clearly or omit it.
- If the total read is genuinely unclear: omit it.
- Props are valid entries if player data supports a specific directional read. Do not force a prop into every breakdown — if the prop read is weak, speculative, or cannot be grounded in available data, omit it entirely. A PROPS entry must: name a specific market type (strikeout total, player points, NRFI/YRFI, team total, etc.); ground the read in at least one specific stat from the payload; follow the "stronger case is X because Y" structure. A PROPS entry must NOT: appear when props data is unavailable or unverifiable; cite a stat that conflicts with other data in the breakdown; be included as filler when SPREAD and TOTAL already cover the read.
- Never write a market entry just to fill the section.
- Never write "the data is mixed" as a market entry — if the data is mixed, omit that market entirely.

Format for each entry:
[MARKET TYPE] — [specific directional claim] based on [specific data point]. The stronger case is [direction] because [reason].

Labels: SPREAD, TOTAL, PROPS (include only what the data supports — all three are optional). LABEL ALIGNMENT CHECK: verify that each entry's content matches its label — a TOTAL directional claim must appear under the TOTAL label, and a SPREAD directional claim must appear under the SPREAD label. Swapping these is a product error that actively misleads users. End with exactly: "These are the environments the data creates. Your decision is always yours."

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

WRITING QUALITY RULES
Every sentence must be grammatically complete and read cleanly aloud.
Before outputting, read the Base Script aloud. If any sentence sounds like two thoughts that collided, rewrite it as two clean sentences.

Banned phrases:
- "works hard" / "battles hard" / "fights hard"
- "manages the [quarter/inning]"
- "depleted rotation" as a standalone noun phrase
- Any sentence where a clause is left dangling

Base Script sentences follow this structure:
[Subject] [does specific thing] [because of specific condition] [leading to specific outcome].

Bad: "Barnes and Barrett work hard but face defensive attention from Mobley and Evan Mobley's length on the interior while the backcourt depleted rotation struggles."
Good: "Barnes and Barrett carry Toronto's offense but run into Mobley's length on every drive — Cleveland's interior defense erases the secondary scoring options Toronto needs without Ingram."

Short sentences beat long ones. Active voice beats passive. Specific beats general every time.

RECENT-WINDOW STATS CAVEAT
When citing last-7-day or last-10-game stats as structural support for a directional claim, add a one-clause caveat acknowledging sample size: "...though small-sample windows can be volatile." Do not present a short hot or cold streak as a durable structural edge without qualification. This applies to any stat cited from a window of 10 or fewer games.

RECENT FORM DATA — SILENT OMISSION RULE
If recent game-by-game form data is unavailable in the payload, do not reference its absence. Do not write "recent form data is unavailable," "recent form cannot be assessed," or any variation. Simply omit it. If recent form would have been a factor, fold the uncertainty into the existing caveat language naturally — the read is built on season stats, injury reports, and market data.

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
  const { game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries, espnSeries, homePlayoffContext, awayPlayoffContext, h2h, lineMovement, verification, homeRoster, awayRoster } = data;
  const { homeTeam, awayTeam, odds } = game;

  // Timing context — drives hoursUntilTip ceiling in RULE 4 of the system prompt
  // Format as human-readable ET time (sports season = EDT, UTC-4). Market Read uses this string directly.
  const _nowUtc = new Date();
  const etHour = (_nowUtc.getUTCHours() + 20) % 24; // UTC-4 (EDT)
  const etMin = _nowUtc.getUTCMinutes();
  const ampm = etHour >= 12 ? "PM" : "AM";
  const h12 = etHour % 12 || 12;
  const currentTime = `${h12}:${String(etMin).padStart(2, "0")} ${ampm} ET`;
  const tipTime = parseTipTimeISO(game.gameTime, game.gameDate);
  const hoursUntilTip = tipTime
    ? Math.max(0, Math.round((new Date(tipTime).getTime() - Date.now()) / (1000 * 60 * 60) * 10) / 10)
    : null;

  // ── H2H split: regular season vs playoff series ─────────────────────────────
  // NBA Play-In starts ~April 14; anything on or after that date is postseason.
  // Date strings are YYYYMMDD — lexicographic compare works correctly.
  const gameYear = parseInt(game.gameDate.slice(0, 4), 10);
  const nbaPostseasonCutoff = `${gameYear}0414`;

  const computeH2HBlock = (): string => {
    if (!h2h) return "H2H_DATA_UNAVAILABLE";
    const rsGames = h2h.games.filter((g) => g.date < nbaPostseasonCutoff);
    const poGames = h2h.games.filter((g) => g.date >= nbaPostseasonCutoff);

    const countWL = (games: typeof h2h.games) => {
      let w = 0, l = 0;
      for (const g of games) {
        const refIsHome = g.home === homeTeam.teamAbv;
        const homeWon = g.homePts > g.awayPts;
        if ((refIsHome && homeWon) || (!refIsHome && !homeWon)) w++;
        else l++;
      }
      return { w, l };
    };
    const fmtGames = (games: typeof h2h.games) =>
      games.map((g) => {
        const winner = g.homePts > g.awayPts ? g.home : g.away;
        return `${g.date.slice(4, 6)}/${g.date.slice(6, 8)}: ${g.away}@${g.home} ${g.awayPts}-${g.homePts} (${winner} W)`;
      }).join(", ");

    const parts: string[] = [];
    const rs = countWL(rsGames);
    parts.push(
      rsGames.length > 0
        ? `regularSeasonRecord: ${homeTeam.teamAbv} ${rs.w}-${rs.l} vs ${awayTeam.teamAbv} (${rsGames.length} regular season meeting${rsGames.length !== 1 ? "s" : ""})\nGames: ${fmtGames(rsGames)}`
        : `regularSeasonRecord: No regular season meetings this season`
    );
    if (poGames.length > 0) {
      const po = countWL(poGames);
      parts.push(
        `playoffSeriesRecord: ${homeTeam.teamAbv} ${po.w}-${po.l} vs ${awayTeam.teamAbv} (current series, ${poGames.length} game${poGames.length !== 1 ? "s" : ""} played)\nGames: ${fmtGames(poGames)}`
      );
    }
    return parts.join("\n\n");
  };
  const h2hBlock = computeH2HBlock();

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

  // Official NBA injury report PDF is the sole injury source.
  // Status semantics for Claude:
  //   Out         — confirmed absent; treat as fact; mention in Game Shape
  //   Doubtful    — likely absent; treat as probable absence; mention in Fragility Check (AMBER)
  //   Questionable — genuine uncertainty; AMBER in Fragility Check
  //   Probable    — listed but expected active; note designation without affecting confidence
  const formatOfficialLine = (p: { playerName: string; status: string; description: string }) => {
    if (p.status === "Out")      return `[OUT — WILL NOT PLAY] ${p.playerName}${p.description ? ` — ${p.description}` : ""}`;
    if (p.status === "Doubtful") return `[DOUBTFUL — likely absent] ${p.playerName}${p.description ? ` — ${p.description}` : ""}`;
    if (p.status === "Questionable") return `[QUESTIONABLE — genuine uncertainty, AMBER fragility trigger] ${p.playerName}${p.description ? ` — ${p.description}` : ""}`;
    if (p.status === "Probable") return `[PROBABLE — expect to play, note designation exists] ${p.playerName}${p.description ? ` — ${p.description}` : ""}`;
    return `${p.playerName} — ${p.status}${p.description ? ` — ${p.description}` : ""}`;
  };

  const renderOfficialInjurySection = (): string => {
    const homeList = injuries.homeInjuries;
    const awayList  = injuries.awayInjuries;
    const renderTeam = (name: string, list: typeof homeList) =>
      list.length === 0
        ? `${name}: No players on official injury report — full roster presumed available`
        : `${name}:\n${list.map(formatOfficialLine).map((l) => `  • ${l}`).join("\n")}`;

    return `━━━ OFFICIAL NBA INJURY REPORT ━━━
Source: NBA official PDF (published every 15 minutes). Any player NOT listed is presumed available.
Status guide: OUT = confirmed absent | DOUBTFUL = likely absent | QUESTIONABLE = genuine uncertainty (FRAGILE trigger) | PROBABLE = expected active

${renderTeam(homeTeam.teamName, homeList)}

${renderTeam(awayTeam.teamName, awayList)}`;
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
${h2hBlock}

━━━ PLAYOFF CONTEXT ━━━
${formatPlayoffContext(homePlayoffContext, homeTeam.teamAbv, homeTeamStats.wins, homeTeamStats.losses)}

${formatPlayoffContext(awayPlayoffContext, awayTeam.teamAbv, awayTeamStats.wins, awayTeamStats.losses)}

${renderOfficialInjurySection()}
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

  // ── Confirmed-OUT names for structural dedup ────────────────────────────────
  const confirmedOutNames = [...data.injuries.homeInjuries, ...data.injuries.awayInjuries]
    .filter((p) => p.status === "Out")
    .map((p) => p.playerName);

  // ── Inner: call Claude once and apply all standard post-processing ───────────
  const CLOSING_LINE = "This is not a pick. This is what the data says. Your decision is always yours.";
  const EDGE_CLOSING_LINE = "These are the environments the data creates. Your decision is always yours.";
  const validGrades = ["A", "B", "C", "D", "F"] as const;
  const labelMap: Record<ConfidenceLevel, ConfidenceLabel> = {
    1: "CLEAR SPOT", 2: "LEAN", 3: "FRAGILE", 4: "PASS",
  };

  async function callOnce(): Promise<BreakdownResult> {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0];
    if (raw.type !== "text") throw new Error("Unexpected Claude response type");

    const json = raw.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let p: BreakdownResult;
    try {
      p = JSON.parse(json) as BreakdownResult;
    } catch {
      throw new Error(`Claude returned invalid JSON: ${json.slice(0, 200)}`);
    }

    if (!p.decisionLens) {
      p.decisionLens = CLOSING_LINE;
    } else if (!p.decisionLens.includes(CLOSING_LINE)) {
      p.decisionLens = p.decisionLens.trimEnd() + " " + CLOSING_LINE;
    }
    if (!p.edgeClosingLine || !p.edgeClosingLine.includes(EDGE_CLOSING_LINE)) {
      p.edgeClosingLine = EDGE_CLOSING_LINE;
    }
    if (!Array.isArray(p.edge)) p.edge = [];
    if (typeof p.cardSummary !== "string") p.cardSummary = "";
    if (typeof p.shareHook !== "string") p.shareHook = "";
    if (p.shareHook.length > 120) p.shareHook = p.shareHook.slice(0, 117).trimEnd() + "…";

    if (!p.signalGrade || !validGrades.includes(p.signalGrade as typeof validGrades[number])) {
      p.signalGrade = undefined;
    }
    if (typeof p.earlyRead !== "boolean") p.earlyRead = false;

    p.confidenceLevel = Math.max(1, Math.min(4, p.confidenceLevel)) as ConfidenceLevel;
    p.confidenceLabel = labelMap[p.confidenceLevel];

    if (data.verification.confidenceLevelPreset !== null) {
      p.confidenceLevel = data.verification.confidenceLevelPreset;
      p.confidenceLabel = labelMap[p.confidenceLevel];
    }

    if (data.verification.fragilityReason !== null) {
      const presetItem: FragilityItem = { item: data.verification.fragilityReason, color: "amber" };
      if (!p.fragilityCheck.some((f) => f.item === data.verification.fragilityReason)) {
        p.fragilityCheck = [presetItem, ...p.fragilityCheck];
      }
    }

    return p;
  }

  // ── First attempt ───────────────────────────────────────────────────────────
  let parsed = await callOnce();

  // ── Structural fragility dedup ──────────────────────────────────────────────
  let dedup = deduplicateFragilityCheck(parsed.fragilityCheck, confirmedOutNames, parsed.gameShape);
  if (dedup.removedCount > 0) {
    console.warn(`[breakdown:NBA] fragility dedup: removed ${dedup.removedCount} point(s) —`, dedup.log);
    parsed.fragilityCheck = dedup.items;
  }

  // ── Retry if dedup left fewer than 2 distinct points ───────────────────────
  if (parsed.fragilityCheck.length < 2 && dedup.removedCount > 0) {
    console.warn("[breakdown:NBA] Fragility check had duplicate points removed — regenerating");
    parsed = await callOnce();
    dedup = deduplicateFragilityCheck(parsed.fragilityCheck, confirmedOutNames, parsed.gameShape);
    if (dedup.removedCount > 0) {
      console.warn(`[breakdown:NBA] fragility dedup (retry): removed ${dedup.removedCount} —`, dedup.log);
      parsed.fragilityCheck = dedup.items;
    }
    if (parsed.fragilityCheck.length < 2) {
      console.warn("[breakdown:NBA] Retry still produced fewer than 2 distinct fragility points — returning as-is");
    }
  }

  return parsed;
}
