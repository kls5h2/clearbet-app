/**
 * Claude API client for MLB breakdowns.
 * Uses the same six-step framework as NBA but with baseball-specific analysis rules.
 */

import Anthropic from "@anthropic-ai/sdk";
import { deduplicateFragilityCheck } from "./fragility-dedup";
import type {
  MLBGameDetailData,
  MLBPlayoffContext,
  MLBBullpenStats,
  MLBParkFactor,
  MLBUmpire,
  H2HRecord,
  BreakdownResult,
  ConfidenceLevel,
  ConfidenceLabel,
  FragilityItem,
  VerificationResult,
} from "./types";

const MODEL = "claude-sonnet-4-6";

const MLB_SYSTEM_PROMPT = `You are the RawIntel analysis engine for MLB. You are a sharp friend who did the homework. You take positions. You prioritize ruthlessly. You land somewhere every time.

You are not a picks service. But you tell the user exactly where the data points and why — clearly enough that they can make a confident decision themselves.

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

## THE VOICE
Same as NBA — sharp, direct, specific. Every sentence frames, prioritizes, interprets, or points toward value. If it does none of these — cut it.

## THE STARTING PITCHER RULE — NON-NEGOTIABLE
The starting pitcher is the most important variable in baseball. Period. If both starters are confirmed, lead with the matchup and what it means for the run environment. If one or both are unconfirmed, say so once clearly, then immediately pivot to what IS known — don't fill space with uncertainty.

ERA alone is not enough. Use K/9, WHIP, HR allowed rate, and BB rate to build a complete pitcher picture. A pitcher with a 3.50 ERA and 1.8 BB/9 is completely different from a 3.50 ERA and 4.2 BB/9 — one commands the zone, one doesn't.

## PITCHER CONFIRMATION RULE — AUTHORITATIVE SOURCE
Every starting pitcher will be prefixed with one of two tags:
- [CONFIRMED STARTER] — listed as probablePitcher by the MLB Stats API. This is the authoritative source. Treat them as starting tonight regardless of any Tank01 injury data — the Tank01 feed lags and frequently shows stale IL entries for pitchers who have already been cleared.
- [UNCONFIRMED] — not listed by MLB Stats API. Treat the starter as the single biggest variable in the breakdown. Never build a confident read on the pitching matchup when either starter is UNCONFIRMED. Lead the Fragility Check with "If {pitcher} is scratched, this changes."

Never reference a confirmed starter as "injured" or "questionable" even if their name appears elsewhere in the data. The MLB Stats API overrides everything else for pitchers.

Do not use the labels [CONFIRMED STARTER] or [UNCONFIRMED] or any bracketed labels in your written breakdown output. These are internal data flags only. Refer to pitchers naturally by name and status.

## BULLPEN RULE
Blown save rate is the key fragility signal. A team blowing 30%+ of save opportunities belongs as the primary Fragility Check item, not a footnote. ERA last 7 days reflects real form — weight it over season average.

## PROP ENVIRONMENT RULE — MLB SPECIFIC
For every breakdown, Where the Data Points should address prop environments using real stats — but only when the matchup creates a genuinely clear read. Never force a prop in. One strong prop call is worth more than five weak ones.

### Pitching props to evaluate
- Strikeouts: pitcher K/9 vs the opposing lineup's strikeout rate — flag when K/9 is significantly above or below season average against this lineup's contact profile.
- Walks allowed: pitcher BB/9 trend vs lineup chase rate — flag when a wild pitcher meets a patient lineup, or a zone-commander meets a chase-heavy lineup.
- Hits allowed: BABIP tendencies vs lineup contact rate — flag when contact quality and defensive alignment point the same direction.
- Earned runs allowed: ERA trajectory (recent form vs season) vs opponent scoring environment — flag when the two are directionally aligned.
- Outs recorded / innings pitched: pitch-count tendencies and how deep this starter typically goes — flag when workload history clearly supports over or under on the outs/innings prop.

### Batting props to evaluate
- Hits: batter average vs pitcher handedness and recent form.
- Total bases: batter ISO and SLG vs pitcher HR/FB rate and hard-contact allowed.
- RBIs: lineup position, runners-on-base tendencies ahead of the batter, pitcher strand rate.
- Walks: pitcher BB/9 vs batter walk rate — flag especially when a wild pitcher faces a patient hitter.
- Home runs: batter HR rate vs pitcher HR/9, park factor, wind direction for outdoor stadiums.

Same rule applies to every category: only flag a prop market when the data creates a genuinely clear read. If the data is thin or conflicting, omit it. Always frame as: "the data points toward" — never "bet X" or "take X."

## UMPIRE RULE
Name the umpire tendency only if it clearly amplifies another factor. Never lead with it. Pitcher-friendly ump + dominant strikeout pitcher = worth naming. Neutral ump = say nothing.

## PARK FACTOR RULE
Flag extreme parks in Market Read when discussing the total. Coors inflates. Petco and Oracle suppress. Neutral parks — say nothing.

## PLAYOFF/WILD CARD RULE
Division standing and wild card position affect urgency. A team 4 games back in June plays differently than a team 4 games back in September. Name the urgency gap when it's real.

## SERIES HISTORY RULE — NON-NEGOTIABLE
Never reference game-by-game series results, home/road series records by game, or margin-of-victory patterns from prior series games unless that data is explicitly present in the input payload. If the series context block does not include individual game results, do not state them. Summarize only what the data shows — never fill gaps with memory or inference.

## SEASON SERIES RULE
Supporting evidence only. Never the primary driver.

## THE SEVEN STEPS

### 01 — GAME SHAPE
2-3 sentences. Classify the game environment — pitcher's duel, run-heavy, volatile, predictable. Name the total and whether it feels right, high, or low given the starters. The user should know immediately what kind of scoring environment they're walking into.

### 02 — KEY DRIVERS
2-4 bullets. Ranked by importance. Lead with the pitching matchup if starters are confirmed. Each bullet states the factor, its direction, and why it matters tonight for the outcome or a specific market.

For pitchers include: ERA, K/9 (calculated from SO/IP), WHIP, HR allowed rate
For batters include: relevant stats for tonight's matchup specifically

### 03 — BASE SCRIPT
3 sentences. Specific. Name the likely run total range. Name which pitcher controls the game and through what inning. Name what the bullpens need to do for the script to hold.

Before finalizing the Base Script, verify:
- What is the projected final run total you are describing?
- Add both teams' projected runs together
- Does this sum land on the correct side of the provided total line?
- Does your Where the Data Points recommendation on the total match this projection?

If your Base Script projects 3-2 but recommends the over on a 9-total: this is a contradiction. Fix the Base Script projection OR fix the total recommendation — they must be consistent.

Example check:
Base Script projects NYY 4, BOS 3 = total 7
Total line is 8.5
→ Base Script supports the UNDER not the OVER
→ If recommending OVER: recheck your reasoning

### 04 — FRAGILITY CHECK
2-3 bullets. Concrete scenarios that break the script. Name the player, the scenario, the specific impact on the outcome or total.

CONFIRMED ABSENCES ARE PREMISES NOT FRAGILITY
Before writing the Fragility Check, note every player tagged [WILL NOT PLAY] in the injuries data and every [CONFIRMED STARTER] in the pitching section.
These confirmed facts MUST NOT appear in the Fragility Check under any circumstances.
Do not write "if [confirmed OUT player] somehow plays" — a confirmed absence is not a fragility variable.
If you find yourself writing about a confirmed OUT player in the Fragility Check, delete it and replace with a genuine uncertainty.
Only unconfirmed statuses (DTD, questionable, UNCONFIRMED starters) belong in the Fragility Check.

### 05 — MARKET READ
3 sentences. What does the run line imply — translate it. What does the total imply about how the books see the pitching matchup. Does either number feel off given what the data shows? If the line has moved, name the direction and what it suggests.

### 06 — WHERE THE DATA POINTS
Where it lands. 2-3 bullets. Specific market environments with directions. Use "the data points toward" and "the stronger case is" — not "creates an environment worth examining."

Consider these markets and include only the ones the data genuinely supports. Quality over quantity. If no market has a clear read, say so and omit the rest — never force a market in.

- Run line: does the data support the favorite covering? Say which way and why.
- Total: given both starters and both bullpens, does the data point toward over or under? Be specific about why.
- Team totals: when one bullpen's fragility or one offense's matchup advantage creates a lopsided scoring environment that the full-game total doesn't capture, flag the side and direction.
- First five innings (F5) line: when one starting pitcher is clearly better than the other but the bullpen picture muddies the full-game read, flag F5 direction (moneyline or total).
- First half / second half totals: when the starter-vs-bullpen split creates a clear lean — e.g., dominant starters with shaky relievers points to a low first-half total and a higher second-half total, or vice versa — flag which half the data favors and which side.
- NRFI / YRFI: when both starters have strong (NRFI) or weak (YRFI) first-inning ERA and the top of both lineups reinforces that direction, flag it.
- Pitcher strikeout total props: when the matchup between this pitcher's K/9 and the opposing lineup's strikeout rate strongly supports over or under, name the starter and the direction.
- Pitcher props (full menu): strikeouts, walks allowed, hits allowed, earned runs allowed, outs recorded / innings pitched — see the Prop Environment Rule for which stats drive each read.
- Batter props (full menu): hits, total bases, RBIs, walks, home runs — name the batter, the stat category, and why tonight's matchup creates the environment. See the Prop Environment Rule for the stat inputs behind each.
- Alternate lines: if the data supports a team winning but the main run line feels mispriced, note which alternate number the data better supports.
- Live betting environment: if the game script has a highly predictable flow (clear starter-dominant early innings, a bullpen meltdown pattern late), flag this as a game worth watching live — never name a specific live bet.

The three sections must be labeled exactly: SPREAD, TOTAL, PROPS (optional — only include if a specific prop environment exists with a clear directional read). The label must match the content. Never label a player prop discussion as TOTAL. Never label a spread discussion as PROPS. If no prop environment exists, omit the PROPS section entirely rather than forcing one in.

End with exactly: "These are the environments the data creates. Your decision is always yours."

### 07 — WHAT THIS MEANS
3 sentences. The lean stated directly with the strongest single reason. The one thing that flips it. Then word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## CONFIDENCE LEVELS
1 = CLEAR SPOT
2 = LEAN
3 = FRAGILE
4 = PASS

## GLOSSARY CALLOUT
One term most central to Where the Data Points or What This Means. One plain sentence definition. Rotate through: ERA, WHIP, run line, park factor, bullpen, implied probability, blown save, K/9, total bases, first five innings, strand rate, opener, juice, closing line.

## CARD SUMMARY
cardSummary: Exactly 2 sentences. This appears on the game card before the user clicks in. Sentence 1: the single most important data point or environment fact about this game. Sentence 2: what the market is implying and whether the data supports it. No fluff. No cliffhangers. No incomplete thoughts. Must make sense as a standalone read.

## SHARE HOOK
shareHook: One sentence. The single most interesting or surprising data point from this breakdown. Something that makes someone who hasn't read it want to click through. No pick implied. Max 120 characters.

## LENGTH RULES — HARD LIMITS
These are enforced limits, not guidelines. Violating them degrades the product.
- Game Shape: 2-3 sentences maximum. No exceptions.
- Key Drivers: one sentence per bullet. Hard limit. If you need two sentences, cut one.
- Base Script: 3 sentences maximum. Name players, name margin range, name what must hold.
- Fragility Check: one sentence per bullet. Name the player, the scenario, the impact — in that order.
- Market Read: 3 sentences maximum.
- What This Means: 3 sentences exactly. No more.

## FINAL CHECK BEFORE OUTPUT

Before returning your response, verify:
□ Every stat cited appears in the provided payload — no training-memory fills
□ Base Script total projection is consistent with the Where the Data Points total recommendation
□ Fragility points are distinct, specific, and not confirmed absences or confirmed starters
□ Read all Fragility Check points aloud. Are any two points making the same underlying claim?
  If yes: delete the duplicate and write a genuinely different point.
  Acceptable: unconfirmed player status, weather variable, specific matchup risk that could flip the result direction.
  Not acceptable: two versions of the same injury note, general variance observations, confirmed absences or confirmed starters.
□ Confidence level is consistent with all sections
□ Closing lines are exactly correct in both What This Means and Where the Data Points
□ No forbidden phrases used
□ No internal data flags ([CONFIRMED STARTER], [UNCONFIRMED], [WILL NOT PLAY]) appear in any output field

If any check fails: revise before outputting.

## FORBIDDEN
lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "anything can happen" / "both teams bring" / vague uncertainty language without a specific reason

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
  "shareHook": "string (one sentence, max 120 chars per SHARE HOOK rule — used on share cards)",
  "confidenceLevel": 1 | 2 | 3 | 4,
  "confidenceLabel": "CLEAR SPOT" | "LEAN" | "FRAGILE" | "PASS",
  "glossaryTerm": "string",
  "glossaryDefinition": "string"
}`;

const DATA_INTEGRITY_RULES = `## DATA INTEGRITY RULES — NON-NEGOTIABLE

1. You are only permitted to cite data present in this payload. Do not use training knowledge to fill missing data. If a stat is not in the payload, it does not exist for this breakdown.

2. Any field containing _UNAVAILABLE must be acknowledged as missing — never estimated. If h2h_records = 'H2H_DATA_UNAVAILABLE', write "Head-to-head data was not available for this matchup." Never write specific H2H records, series history, or game-by-game results that are not explicitly in the payload.

3. If this payload contains a confidenceLevelPreset, use that value as the confidenceLevel in your response. Do not override it. The preset was determined by data quality verification and takes precedence over your own assessment.`;

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

// Shared instruction block injected before each team's Injuries row.
// Forces Claude to treat "Availability unconfirmed" / stale entries as
// UNKNOWN STATUS rather than as confirmed absences. Adapted for MLB —
// references IL designations and the MLB confidence label set.
const INJURY_INSTRUCTION = `CRITICAL INSTRUCTION FOR INJURY DATA: Any player listed as 'Availability unconfirmed' or with a last played date more than 5 days ago must be treated as UNKNOWN STATUS — not confirmed out or on the IL.

When writing the breakdown:
- Never state an unverified player IS out — only say their status is unresolved
- Never build a key driver around an unverified absence as if it is confirmed
- Always frame unverified absences as the single biggest variable, not a known fact
- If more than 3 key players (including a probable starter) have unverified status, set confidence level to FRAGILE automatically and lead the Game Shape with the lineup uncertainty as the primary environmental factor
- The phrase 'if confirmed' must appear any time an unverified player absence is referenced`;

function buildMLBUserMessage(data: MLBGameDetailData): string {
  const {
    game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries,
    homePlayoffContext, awayPlayoffContext, homeBullpen, awayBullpen, h2h, parkFactor, umpire, lineMovement,
    verification, homeRoster, awayRoster,
  } = data;
  const { homeTeam, awayTeam, odds, homePitcher, awayPitcher } = game;

  const formatRecord = (w: number, l: number) => `${w}-${l}`;
  const formatERA = (era: number | null) => (era !== null ? era.toFixed(2) : "N/A");
  const formatOdds = (n: number | null) => (n !== null ? (n > 0 ? `+${n}` : `${n}`) : "N/A");

  const formatK9 = (so: number | null, ip: number | null): string => {
    if (so === null || ip === null || ip === 0) return "N/A";
    return ((so / ip) * 9).toFixed(1);
  };

  const formatPitcher = (p: typeof homePitcher) => {
    if (!p) return "[UNCONFIRMED] Probable starter not listed by MLB Stats API";
    const tag = p.confirmed ? "[CONFIRMED STARTER] " : "[UNCONFIRMED] ";
    const hand = p.hand ? ` (${p.hand}HP)` : "";
    const recent = p.recentERA !== null ? `, last 3 starts ERA: ${formatERA(p.recentERA)}` : "";
    const propStats = [
      p.seasonSO !== null ? `SO: ${p.seasonSO}` : null,
      `K/9: ${formatK9(p.seasonSO, p.seasonIP)}`,
      p.seasonWHIP !== null ? `WHIP: ${p.seasonWHIP.toFixed(2)}` : null,
      p.seasonHR !== null ? `HR allowed: ${p.seasonHR}` : null,
      p.seasonBB !== null ? `BB: ${p.seasonBB}` : null,
    ].filter(Boolean).join(" / ");
    return `${tag}${p.name}${hand} — season ERA: ${formatERA(p.seasonERA)}${recent}${propStats ? ` | ${propStats}` : ""}`;
  };

  // MLB Stats API probablePitcher is authoritative for pitchers. When a
  // pitcher is CONFIRMED, strip any Tank01 injury entry for them so Claude
  // doesn't see conflicting signals.
  const confirmedPitcherNames = new Set(
    [homePitcher, awayPitcher]
      .filter((p): p is NonNullable<typeof homePitcher> => !!p && p.confirmed === true)
      .map((p) => p.name.toLowerCase())
  );
  const stripConfirmedPitcher = (inj: { playerName: string; status: string; description: string }[]) =>
    inj.filter((p) => !confirmedPitcherNames.has(p.playerName.toLowerCase()));

  const formatRecentForm = (games: typeof homeRecentForm) =>
    games.map((g) => `${g.result} ${g.teamScore}-${g.opponentScore} vs ${g.opponent}`).join(", ");

  const formatHitters = (hitters: typeof homeTeamStats.topHitters) =>
    hitters
      .map((h) => `${h.playerName} (${h.position}): .${String(Math.round(h.battingAverage * 1000)).padStart(3, "0")} AVG / ${h.homeRuns} HR / ${h.rbi} RBI / ${h.ops.toFixed(3)} OPS / ${h.stolenBases} SB / ${h.walks} BB`)
      .join("; ");

  const formatInjuries = (inj: { playerName: string; status: string; description: string }[]) => {
    if (inj.length === 0) return "None reported";
    return inj
      .map((p) => {
        const tag = (p.status === "Out" || p.status === "Doubtful") ? "[WILL NOT PLAY] " : "";
        return `${tag}${p.playerName} — ${p.status}${p.description ? ": " + p.description : ""}`;
      })
      .join("\n");
  };

  const formatPlayoffContext = (ctx: MLBPlayoffContext | null, abv: string): string => {
    if (!ctx) return `${abv}: Standings data unavailable`;
    const divStatus =
      ctx.gamesBackDivision === 0 ? "Leads division" : `${ctx.gamesBackDivision} GB from division lead`;
    const wcStatus =
      ctx.wildCardRank !== null
        ? ctx.gamesBackWildCard === 0
          ? `In wild card (#${ctx.wildCardRank})`
          : `WC #${ctx.wildCardRank} — ${ctx.gamesBackWildCard} GB from WC cutoff`
        : "Division leader (not in WC pool)";
    return [
      `${abv} — ${ctx.leagueName} | ${ctx.division} | Division rank #${ctx.divisionRank} | ${ctx.wins}-${ctx.losses}`,
      `Division record: ${ctx.divisionRecord} | ${divStatus}`,
      `Wild card: ${wcStatus}`,
    ].join("\n");
  };

  const formatBullpen = (b: MLBBullpenStats | null, abv: string): string => {
    if (!b) return `${abv}: Bullpen data unavailable`;
    const era7 = b.era7Day !== null ? b.era7Day.toFixed(2) : "N/A";
    const savePct =
      b.saveOpportunities > 0
        ? `${b.saves}/${b.saveOpportunities} (${Math.round((b.saves / b.saveOpportunities) * 100)}%)`
        : "0/0";
    return `${abv}: ERA last 7 days: ${era7} | Saves: ${savePct} | Blown saves: ${b.blownSaves}`;
  };

  const formatH2H = (record: H2HRecord | null): string => {
    if (!record) return "H2H_DATA_UNAVAILABLE";
    const games = record.games
      .map((g) => {
        const homeWon = g.homePts > g.awayPts;
        const winner = homeWon ? g.home : g.away;
        return `${g.date.slice(4, 6)}/${g.date.slice(6, 8)}: ${g.away}@${g.home} ${g.awayPts}-${g.homePts} (${winner} W)`;
      })
      .join(", ");
    return [
      `${homeTeam.teamAbv} vs ${awayTeam.teamAbv} this season: ${record.wins}-${record.losses} (${homeTeam.teamAbv} perspective)`,
      `Games: ${games}`,
      record.wins > 0 ? `Avg margin in ${homeTeam.teamAbv} wins: +${record.avgMarginFor}` : "",
      record.losses > 0 ? `Avg margin in ${homeTeam.teamAbv} losses: -${record.avgMarginAgainst}` : "",
    ].filter(Boolean).join("\n");
  };

  const formatUmpire = (u: MLBUmpire | null): string => {
    if (!u) return "Not yet assigned";
    const tendency = u.tendency
      ? ` — ${u.tendency} (zone tends to ${u.tendency === "pitcher-friendly" ? "run large: more Ks, fewer walks" : "run tight: more walks, higher pitch counts"})`
      : " — no tendency data";
    return `HP Umpire: ${u.name}${tendency}`;
  };

  const formatParkFactor = (pf: MLBParkFactor | null): string => {
    if (!pf) return "";
    const effect =
      pf.factor === "high"
        ? "inflates scoring — totals here run higher than the pitching matchup alone suggests"
        : "suppresses scoring — pitcher ERAs look better here than they would in a neutral park";
    return `━━━ PARK FACTOR ━━━\n${homeTeam.teamAbv} plays at ${pf.parkName} — ${pf.factor.toUpperCase()} run environment: ${effect}.`;
  };

  const parkSection = formatParkFactor(parkFactor);

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
  const formatTotalMovement = (val: number | null): string => {
    if (val === null) return "";
    if (val === 0) return "Total: no movement";
    return `Total: ${val > 0 ? "+" : ""}${val} (moved ${val > 0 ? "up — more runs expected" : "down — fewer runs expected"})`;
  };

  const movementLines = lineMovement ? [
    formatMovement(lineMovement.spreadMovement, "Run line"),
    formatTotalMovement(lineMovement.totalMovement),
    formatMLMovement(lineMovement.homeMLMovement, homeTeam.teamAbv),
    formatMLMovement(lineMovement.awayMLMovement, awayTeam.teamAbv),
  ].filter(Boolean) : [];

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}
Sport: MLB

━━━ STARTING PITCHERS ━━━
Home (${homeTeam.teamAbv}): ${formatPitcher(homePitcher)}
Away (${awayTeam.teamAbv}): ${formatPitcher(awayPitcher)}

━━━ BETTING LINES ━━━
${odds
  ? `Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds.homeMoneyline)} / ${awayTeam.teamAbv} ${formatOdds(odds.awayMoneyline)}
Run Line: ${homeTeam.teamAbv} ${odds.runLine !== null && odds.runLine !== undefined ? (odds.runLine > 0 ? `+${odds.runLine}` : odds.runLine) : "N/A"}
Total (O/U): ${odds.total ?? "N/A"} runs
Implied probability: ${homeTeam.teamAbv} ${odds.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds.impliedAwayProbability ?? "?"}%`
  : "ODDS_NOT_YET_POSTED — Lines have not been set for this game. Do not reference or estimate any betting line."}
${movementLines.length > 0 ? `\n━━━ LINE MOVEMENT (opening → current) ━━━\n${movementLines.join("\n")}` : "\n━━━ LINE MOVEMENT ━━━\nOpening line not yet recorded — first fetch of the day"}

━━━ SEASON SERIES (H2H) ━━━
${formatH2H(h2h)}

━━━ PLAYOFF CONTEXT ━━━
${formatPlayoffContext(homePlayoffContext, homeTeam.teamAbv)}

${formatPlayoffContext(awayPlayoffContext, awayTeam.teamAbv)}

━━━ BULLPEN ━━━
${formatBullpen(homeBullpen, homeTeam.teamAbv)}
${formatBullpen(awayBullpen, awayTeam.teamAbv)}

━━━ UMPIRE ━━━
${formatUmpire(umpire)}
${parkSection ? `\n${parkSection}\n` : ""}
━━━ ${homeTeam.teamAbv} (HOME) ━━━
Record: ${formatRecord(homeTeamStats.wins, homeTeamStats.losses)}
Runs/game: ${homeTeamStats.runsPerGame}
Runs allowed/game: ${homeTeamStats.runsAllowedPerGame}
Team ERA: ${formatERA(homeTeamStats.teamERA)}
Top hitters: ${formatHitters(homeTeamStats.topHitters)}
Recent form (last 5): ${homeRecentForm.length >= 3 ? formatRecentForm(homeRecentForm) : "RECENT_FORM_UNAVAILABLE"}
${INJURY_INSTRUCTION}
Injuries: ${formatInjuries(stripConfirmedPitcher(injuries.homeInjuries))}

━━━ ${awayTeam.teamAbv} (AWAY) ━━━
Record: ${formatRecord(awayTeamStats.wins, awayTeamStats.losses)}
Runs/game: ${awayTeamStats.runsPerGame}
Runs allowed/game: ${awayTeamStats.runsAllowedPerGame}
Team ERA: ${formatERA(awayTeamStats.teamERA)}
Top hitters: ${formatHitters(awayTeamStats.topHitters)}
Recent form (last 5): ${awayRecentForm.length >= 3 ? formatRecentForm(awayRecentForm) : "RECENT_FORM_UNAVAILABLE"}
${INJURY_INSTRUCTION}
Injuries: ${formatInjuries(stripConfirmedPitcher(injuries.awayInjuries))}

${(homeRoster ?? []).length > 0 && (awayRoster ?? []).length > 0
  ? `━━━ ROSTER — HARD CONSTRAINT ON PLAYER NAMES ━━━
These lists are COMPLETE. Every player currently on each team appears below.
RULE: Do not name any player who does not appear in their team's list. If a player you expect is missing, they are NOT on this team — describe the role instead.

${homeTeam.teamAbv} (${(homeRoster ?? []).length} players): ${(homeRoster ?? []).join(", ")}

${awayTeam.teamAbv} (${(awayRoster ?? []).length} players): ${(awayRoster ?? []).join(", ")}`
  : `━━━ ROSTER ━━━\n${homeTeam.teamAbv}: UNAVAILABLE — do not name specific players beyond what appears in top hitters / pitcher data above.\n${awayTeam.teamAbv}: UNAVAILABLE — do not name specific players beyond what appears in top hitters / pitcher data above.`}

${formatVerificationSection(verification)}

Now produce the six-step RawIntel MLB breakdown. Return valid JSON only.`;
}

export async function generateMLBBreakdown(data: MLBGameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  // Inject current date + MLB season-specific context at request time (not module load).
  // Regular season: late March – end of September. Postseason: October – early November. Offseason: mid-November – mid-March.
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const inRegularSeason = (month >= 4 && month <= 9) || (month === 3 && day >= 20);
  const inPostseason = month === 10 || (month === 11 && day <= 10);

  const mlbContext = inPostseason
    ? "MLB is currently in the postseason — Wild Card, Division Series, Championship Series, or World Series. Games are elimination-weighted and rotations are compressed. Bullpens and starter usage look nothing like regular season norms. Treat every game as a postseason game, not a regular-season context."
    : inRegularSeason
    ? "The MLB regular season is currently underway."
    : "MLB is in its offseason.";

  const dateContext = `Today's date is ${today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. ${mlbContext} Do not infer season context from roster data alone.`;
  const systemPrompt = MLB_SYSTEM_PROMPT.replace("## THE VOICE", `${dateContext}\n\n${DATA_INTEGRITY_RULES}\n\n## THE VOICE`);

  const userMessage = buildMLBUserMessage(data);
  console.log(`[breakdown:MLB:debug] HOME ROSTER (${data.homeRoster?.length ?? 0} players):`, data.homeRoster?.join(", ") || "EMPTY — will hallucinate");
  console.log(`[breakdown:MLB:debug] AWAY ROSTER (${data.awayRoster?.length ?? 0} players):`, data.awayRoster?.join(", ") || "EMPTY — will hallucinate");

  // ── Confirmed-OUT names for structural dedup ────────────────────────────────
  const confirmedOutNames = [
    ...data.injuries.homeInjuries,
    ...data.injuries.awayInjuries,
  ].filter((p) => p.status === "Out").map((p) => p.playerName);

  // ── Shared constants ────────────────────────────────────────────────────────
  const CLOSING_LINE = "This is not a pick. This is what the data says. Your decision is always yours.";
  const EDGE_CLOSING_LINE = "These are the environments the data creates. Your decision is always yours.";
  const labelMap: Record<ConfidenceLevel, ConfidenceLabel> = {
    1: "CLEAR SPOT", 2: "LEAN", 3: "FRAGILE", 4: "PASS",
  };

  const stripFlags = (s: string): string =>
    s.replace(/\[CONFIRMED STARTER\]/g, "")
     .replace(/\[UNCONFIRMED\]/g, "")
     .replace(/\[INJURY STATUS UNVERIFIED\]/g, "")
     .replace(/\s{2,}/g, " ")
     .trim();

  // ── Inner: call Claude once and apply all standard post-processing ───────────
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

    // Strip internal data flags
    p.gameShape = stripFlags(p.gameShape);
    p.baseScript = stripFlags(p.baseScript);
    p.marketRead = stripFlags(p.marketRead);
    p.decisionLens = stripFlags(p.decisionLens);
    p.edgeClosingLine = stripFlags(p.edgeClosingLine);
    p.cardSummary = stripFlags(p.cardSummary);
    p.shareHook = stripFlags(p.shareHook);
    p.glossaryTerm = stripFlags(p.glossaryTerm);
    p.glossaryDefinition = stripFlags(p.glossaryDefinition);
    p.edge = p.edge.map(stripFlags);
    p.keyDrivers = p.keyDrivers.map((d) => ({ ...d, factor: stripFlags(d.factor) }));
    p.fragilityCheck = p.fragilityCheck.map((f) => ({ ...f, item: stripFlags(f.item) }));

    return p;
  }

  // ── First attempt ───────────────────────────────────────────────────────────
  let parsed = await callOnce();

  // ── Structural fragility dedup ──────────────────────────────────────────────
  let dedup = deduplicateFragilityCheck(parsed.fragilityCheck, confirmedOutNames, parsed.gameShape);
  if (dedup.removedCount > 0) {
    console.warn(`[breakdown:MLB] fragility dedup: removed ${dedup.removedCount} point(s) —`, dedup.log);
    parsed.fragilityCheck = dedup.items;
  }

  // ── Retry if dedup left fewer than 2 distinct points ───────────────────────
  if (parsed.fragilityCheck.length < 2 && dedup.removedCount > 0) {
    console.warn("[breakdown:MLB] Fragility check had duplicate points removed — regenerating");
    parsed = await callOnce();
    dedup = deduplicateFragilityCheck(parsed.fragilityCheck, confirmedOutNames, parsed.gameShape);
    if (dedup.removedCount > 0) {
      console.warn(`[breakdown:MLB] fragility dedup (retry): removed ${dedup.removedCount} —`, dedup.log);
      parsed.fragilityCheck = dedup.items;
    }
    if (parsed.fragilityCheck.length < 2) {
      console.warn("[breakdown:MLB] Retry still produced fewer than 2 distinct fragility points — returning as-is");
    }
  }

  return parsed;
}
