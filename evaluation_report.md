# Breakdown Evaluation Report
Date: 2026-05-04

## Breakdown Under Review
NBA · Monday, May 4, 2026 · 8:00 PM ET — Philadelphia 76ers at New York Knicks — FRAGILE
Spread: NY -7.5 | Total: 212.5 | PHI ML: +235 | NY ML: -290


---

## MLB Analyst

> **Note:** This is an NBA breakdown, not MLB. Evaluating structural quality only — sport-specific criteria (pitcher IDs, ballpark factors, run lines, FIP/ERA, bullpen availability) are not applicable. Scoring reflects framework adherence and section-level reasoning quality.

| Section | Score | Note |
|---|---|---|
| Game Shape | 7/10 | Strong framing of playoff environment and rotation compression; Embiid status correctly flagged as the dominant variable; no generic filler. |
| Key Drivers | 6/10 | Drivers are relevant but Driver 2 blends two teams' backcourts into one point without clear prioritization — most important factor (Embiid absence) is first, but the section's internal logic weakens after that. |
| Base Script | 7/10 | Script is specific to this matchup and properly conditioned on Embiid being limited; "anchor condition" is explicit, which is correct practice. |
| Fragility Check | 6/10 | Embiid AMBER coding is appropriate; Maxey RED is directionally correct but the "35+ point game" threshold is unchecked — specific, but not checkable before tip. Sochan GREEN note is accurate and well-placed. |
| Market Read | 7/10 | Implied probability math is correct (-290 ≈ 74.4%, +235 ≈ 29.8%); gap between the two (~104.2%) reflects standard vig; absence of line movement data is noted honestly rather than papered over. |
| Confidence Level | 8/10 | FRAGILE is correctly applied — Embiid's status is genuinely unresolved and the breakdown's own anchor condition makes clear the script collapses without that confirmation. Label fits. |

**Red flags triggered:** none — this is an NBA breakdown; MLB-specific triggers (wrong pitcher, run line language, ERA/FIP divergence) are not applicable.

**Weakest claim in this breakdown:** "PHI defense: 116.1 allowed vs. 115.9 scored — net-negative" in Key Drivers — a net differential of 0.2 PPG over a full season is not a meaningful edge; presenting it as a driver-level finding implies more signal than the data supports.

**MLB Analyst Score: 6.8/10** *(average of six section scores)*


---

## Market Analyst

**Implied probability math:** Correct. -290 implied probability = 290/(290+100) = 290/390 = 74.36% — reported as ~74.4%, within rounding tolerance. +235 implied probability = 100/(235+100) = 100/335 = 29.85% — reported as ~29.8%, within rounding tolerance. Both conversions verified accurate.

**Line movement claim:** Unverifiable but appropriately caveated — the breakdown explicitly states "no opening line recorded" and "no line movement data is available," and repeats this limitation twice rather than fabricating movement claims. This is honest handling of missing data.

**Signal Grade alignment:** Fits the market data. FRAGILE confidence is consistent with a flat line (no movement recorded), genuine injury uncertainty on Embiid, and a market implying approximately 74% win probability for the favorite without sharp confirmation — directional but fragile.

**Hallucinated claims:** One concern flagged: the "Where the Data Points" PROPS section cites "Knicks defense that allowed 110.1 PPG" as supporting reasoning for Maxey props. This is a defensive PPG figure that cannot be verified from the breakdown's stated data sourcing. More importantly, CLAUDE.md explicitly states props are "not yet live" in the product scope — this section should not exist in a live breakdown. The props entry is an out-of-scope claim that should be removed regardless of whether the stat is accurate.

**Sharp money characterization:** Not claimed. The breakdown correctly avoids attributing line position to sharp or public action given the absence of movement data. This is the right call.

**Red flags triggered:** One — the PROPS entry in "Where the Data Points" references a scope category (props) that CLAUDE.md explicitly marks as not yet live ("Not yet live: NFL, NHL, props, social features"). This is a product integrity flag, not a math flag. Additionally, the Base Script and "What This Means" sections both contain conditional directional claims ("New York wins and covers, assuming Embiid is limited") — these are appropriately conditional, not raw picks, so they do not trigger a red flag on their own. No implied probability errors. No fabricated movement. No unsupported sharp money claims.

**Market Analyst Score: 8/10**

Score rationale: The Market Read section itself is clean — math is correct, uncertainty is disclosed twice, no fabricated dynamics, signal grade fits the data environment. Two points deducted: one for the out-of-scope PROPS entry that should not appear in a live product output per CLAUDE.md, and one for citing a defensive PPG figure (110.1 PPG allowed) in the props section that is unverifiable within the breakdown's stated sourcing and attached to a scope category the product does not support.


---

## Skeptic

**Primary weakness:** This entire read collapses if Embiid suits up healthy for full minutes — his status is literally unconfirmed (Day-To-Day), yet the Base Script, Key Drivers, and WHERE THE DATA POINTS all assume limited or no Embiid as the operative condition.

**Counter-argument not addressed:** The 138-89 regular-season blowout cited to support NY's coverage ceiling is an outlier result that almost certainly reflects garbage time or an anomalous game state, not a repeatable dynamic — using it as structural evidence for a playoff spread read is analytically weak and a smart dissenter would discard it entirely.

**Confidence level verdict:** TOO HIGH
- Assigned: FRAGILE
- Should be: PASS — Embiid's status is literally unconfirmed, no line movement data exists, no recent form data is cited, and the breakdown itself acknowledges "meaningful data gaps"; per the FRAGILE vs. PASS standard, this meets the PASS threshold.

**Stat most likely to be wrong:** "Knicks defense allowed 110.1 PPG" cited in WHERE THE DATA POINTS to support Maxey props — this figure conflicts with the NY offensive average of 116.5 PPG cited earlier and feels either stale, misattributed (playoff vs. regular season), or drawn from a different sample; flag for manual verification before publishing.

**Base script fragility:** FRAGILE
- The Base Script is explicitly conditioned on Embiid being limited or unavailable — if he plays full minutes in the first quarter and Philadelphia goes up early, the entire spread logic flips with no secondary framework in place.

**FRAGILE vs. PASS audit:** FRAGILE should be PASS — more than two meaningful unknowns exist (Embiid status unconfirmed, no line movement, no recent form, acknowledged data gaps), and they point in opposite directions depending on Embiid's health.

**Skeptic's verdict: NEEDS REVISION**

**Robustness score: 4/10** *(the directional logic on NY is coherent when conditioned correctly, but the confidence level is wrong, a key stat needs verification, and the entire framework is one Embiid confirmation away from needing to be rewritten)*


---

## NBA Analyst

| Section | Score | Note |
|---|---|---|
| Game Shape | 7/10 | Correctly frames the playoff environment and Embiid's status as the defining variable, but the pace profile is underdeveloped — neither team's actual tempo rank or half-court vs. transition identity is characterized. |
| Key Drivers | 7/10 | Driver 1 through 3 are specific and stat-backed; Driver 4 (H2H blowout as structural evidence) overstates what a single 49-point outlier can tell you about team-level superiority. |
| Base Script | 7/10 | Plausible and anchored to the Embiid condition, consistent with the 212.5 total, but relies on a Towns frontcourt dominance claim without specifying how Philadelphia compensates against it. |
| Fragility Check | 7/10 | Items 1 and 2 are well-structured and checkable; Item 3 (Sochan Day-To-Day for the Knicks) triggers a VERIFY NOT WRONG flag — Sochan is a Spurs player per training data and must be manually confirmed before this point is treated as valid. |
| Market Read | 6/10 | Implied probability math is correct, but the breakdown misses that -7.5 crosses 7 — a key NBA number — which carries real market significance; vig is not acknowledged, and the section is thin due to missing line movement data. |
| Confidence Level | 9/10 | FRAGILE is the correct label: one dominant variable (Embiid's health) can flip the entire read, and the label is applied with appropriate precision rather than defaulting to PASS. |

**Red flags triggered:** VERIFY NOT WRONG — Jeremy Sochan is listed as Day-To-Day for the New York Knicks (Fragility Check, Item 3). Per training data, Sochan is a San Antonio Spurs player. If he is not on the Knicks roster, this fragility point is fabricated. NOTE: Verify against current NBA roster — this player may have been traded or signed after my training cutoff. Do not flag as DO NOT SHIP based on this roster claim alone without manual verification.

**Weakest claim in this breakdown:** "The two NY wins were dominant... a 49-point blowout (138-89)... The blowout suggests NY has a ceiling against this PHI group that the spread reflects" — a 49-point regular-season blowout is an extreme outlier almost always driven by specific game-day conditions (injuries, rest differentials, score-garbage-time), not structural superiority, and using it as evidence the spread is correctly priced is analytically unsound.

**NBA Analyst Score: 7.2/10** *(average of six section scores)*


---
---

# Breakdown Evaluation Report
Date: 2026-05-04

## Breakdown Under Review
NBA · Monday, May 4, 2026 · 9:30 PM ET — Minnesota Timberwolves at San Antonio Spurs — FRAGILE
Spread: SA -13.5 | Total: 217.5 | MIN ML: +440 | SA ML: -600


---

## MLB Analyst

> **Note:** This is an NBA breakdown, not MLB. Evaluating structural quality only — sport-specific criteria (pitcher IDs, ballpark factors, run lines, FIP/ERA, bullpen availability) are not applicable.

| Section | Score | Note |
|---|---|---|
| Game Shape | 8/10 | Playoff context is correctly framed, confirmed absences are named immediately and accurately drive the structural framing, and the 62-20 record anchors the competitiveness gap without inflating it. |
| Key Drivers | 8/10 | Four drivers are clearly differentiated, correctly prioritized (confirmed absences first), and each stat cited is connected directly to a game-specific consequence rather than dropped raw. |
| Base Script | 7/10 | Script is plausible and internally consistent with the depleted Minnesota roster; the "anchor condition" framing is precise and checkable, though the third-quarter breakaway assumption is asserted without a mechanism beyond vague "depth advantage." |
| Fragility Check | 7/10 | All three items are relevant and specific; however, all three are coded AMBER when Item 3 (garbage-time bleed) is a structural modeling issue, not an injury uncertainty — AMBER is reserved per CLAUDE.md for injury/questionable status, not pace and margin compression. |
| Market Read | 8/10 | Implied probability math is correct (-600 → 85.7%, +440 → 18.5%); the vig gap (~104.2%) is not acknowledged but the uncertainty around missing line movement is disclosed honestly twice rather than manufactured. |
| Confidence Level | 7/10 | FRAGILE fits the Dosunmu unresolved status and missing series data, but the breakdown also describes a structurally near-certain outcome on the moneyline side — a case could be made for LEAN given that the primary fragility is cover-specific, not outcome-specific. |

**Red flags triggered:** none — NBA breakdown; MLB-specific triggers (wrong pitcher, run line language, ERA/FIP divergence, ballpark factors) are not applicable.

**Weakest claim in this breakdown:** "Minnesota keeps it within striking distance through the first half before San Antonio's depth advantage and home crowd expand the lead in the third quarter" — the third-quarter expansion is asserted as the script mechanism but no data supports a specific San Antonio third-quarter trend or a Minnesota fatigue pattern in second halves, making it an invented narrative beat rather than a data-derived projection.

**MLB Analyst Score: 7.5/10** *(average of six section scores)*


---

## NBA Analyst

| Section | Score | Note |
|---|---|---|
| Game Shape | 7/10 | Correctly leads with the structurally defining facts (seeding, confirmed absences, SA's defensive margin), but the pace profile for both teams is entirely absent — tempo rank, transition vs. half-court identity, and which team controls pace under normal conditions are never established. |
| Key Drivers | 7/10 | Driver 1 is correctly prioritized and Driver 4's Fox/Castle targeting logic is specific and well-constructed, but Driver 3 largely restates Driver 1 under a different label (depleted MIN offense vs. SA defense is the same structural point as the Edwards/DiVincenzo absence). |
| Base Script | 8/10 | Plausible and condition-specific; the anchor condition (MIN below 110) is explicit and honest, and the projected output ranges (MIN 100–108, SA 115–125) are roughly consistent with the 217.5 total, though the wide combined band (215–233) limits precision. |
| Fragility Check | 6/10 | All three items coded AMBER is a structural tell — garbage-time margin bleed (Item 3) is correctly identified as the primary spread-cover uncertainty but should likely be RED given it is the single most probable mechanism for the -13.5 to fail; no fragility point captures a structural risk to the Spurs' win itself. |
| Market Read | 8/10 | Implied probability math is correct (SA -600 = 85.7%, MIN +440 = 18.5%); the absence of opening line data is disclosed twice rather than papered over; -13.5 sits between key numbers 10 and 14 and does not cross one, so no mention is required — no deduction. |
| Confidence Level | 7/10 | FRAGILE is defensible but slightly conservative — the directional read on outcome is clear and stable; the primary uncertainty is margin-specific (garbage time, pace compression), not outcome-flipping, which is closer to LEAN territory; however, Dosunmu's unresolved status and the extreme spread number justify keeping FRAGILE. |

**Red flags triggered:** VERIFY NOT WRONG — Julius Randle listed as leading Minnesota's available rotation (Key Drivers). Per training data, Randle was on the Knicks; his presence on Minnesota requires confirmation. NOTE: Verify against current NBA roster — this player may have been traded or signed after my training cutoff. Do not flag as DO NOT SHIP based on this roster claim alone without manual verification. Additionally: De'Aaron Fox listed as a Spur (Driver 4) — Fox was reported traded to San Antonio in early 2025, which is plausible and consistent with training data; flag for confirmation but lower confidence flag than Randle.

**Weakest claim in this breakdown:** "Julius Randle leads the available rotation at 21.1 PPG" — Randle's presence on the Minnesota roster is unverified (he was a Knick per training data), and if this is incorrect, the entire Driver 1 scoring-load analysis collapses, as the backup offensive hierarchy is built around a player who may not be on this team.

**NBA Analyst Score: 7.2/10** *(average of six section scores)*


---

## Market Analyst

**Implied probability math:** correct — SA -600 = 85.71% (stated 85.7% ✓); MIN +440 = 18.52% (stated 18.5% ✓). Both conversions are accurate to standard rounding.

**Line movement claim:** accurate — "no opening line recorded" is stated explicitly and the absence of movement data is handled honestly rather than fabricated; no false movement claims made.

**Signal Grade alignment:** fits the market data — FRAGILE is appropriate when no opening line or movement data exists, meaning the market environment itself is unverifiable; the grade correctly reflects that the logic is conditional on incomplete market information.

**Hallucinated claims:** none identified — the breakdown makes no specific sharp action claims, no fabricated line movement direction, and no invented market dynamics; all market statements are properly hedged.

**Sharp money characterization:** not made — the breakdown explicitly states no line movement data is available to confirm or deny sharp positioning, which is the correct disciplined stance.

**Total projection math:** internally consistent with the 217.5 line — the stated range of 215–233 has a floor of 215 and ceiling of 233; 217.5 sits at approximately the 14th percentile of that band, which is consistent with the "skewing toward the lower half" characterization.

**Red flags triggered:** none

**Market Analyst Score: 9/10**

Score rationale: The Market Read section handles an unusually data-sparse environment (no opening lines, no movement data) with full honesty and no fabrication — that is the correct professional response and harder to do well than it looks. The implied probability math is accurate, the "no opening line" limitation is disclosed without being papered over, and the total projection in Where the Data Points is internally coherent with the posted 217.5. The one minor deduction: the Game Shape line ("The Spurs closed as -13.5 favorites") uses "closed" when the section header references current lines as of 11:31 AM ET — this is likely the current line, not a closing line, and conflating the two introduces a small factual ambiguity worth flagging.


---

## Skeptic

**Primary weakness:** Castle's 7.4 APG is the single most suspicious stat in the breakdown — that figure would rank among the league's elite distributors and is inconsistent with a second-year player's known profile, making it the most likely hallucinated or misattributed number.

**Counter-argument not addressed:** A 13.5-point spread in a playoff Game 1 ignores the well-documented floor effect of playoff environments — pace slows for both teams, referees allow more physical defense, and a Randle/McDaniels core that is playoff-tested can sustain a competitive first half that keeps margin compression in play even against a superior opponent.

**Confidence level verdict:** APPROPRIATE
- Assigned: FRAGILE
- Should be: FRAGILE — all three meaningful unknowns (Dosunmu, Bryant, garbage-time bleed) point in the same direction rather than in conflicting directions, so the PASS threshold is not met and FRAGILE correctly describes the spread-specific uncertainty.

**Stat most likely to be wrong:** Castle's 7.4 APG — verify against current 2025-26 season logs; this number is inconsistent with his profile and is most likely misattributed or pulled from an incorrect data field.

**Base script fragility:** CONDITIONAL
- If Randle scores 25+ in the first half and Minnesota stays within single digits at halftime, the third-quarter pull-away script collapses and the -13.5 spread becomes genuinely threatened even if SA wins comfortably.

**FRAGILE vs. PASS audit:** Correctly called — the unknowns all tilt in the same direction (deeper SA edge or spread uncertainty), not in conflicting directions, so PASS threshold is not met.

**Skeptic's verdict: NEEDS REVISION**

**Robustness score: 6/10** *(Confirmed absences create real directional clarity, but the Castle APG stat requires verification before this ships, and the playoff-environment counter-argument deserves at least one sentence of acknowledgment in the Market Read or Fragility Check.)*


---
---

# Breakdown Evaluation Report
Date: 2026-05-04

## Breakdown Under Review
MLB · Monday, May 4, 2026 · 5:40 PM ET — New York Mets at Colorado Rockies — FRAGILE
Run Line: COL +1.5 | Total: 11 | NYM ML: -143 | COL ML: +119


---

## NBA Analyst

> **Note:** This is an MLB breakdown, not NBA. Evaluating structural quality only — sport-specific criteria (pace profile, tempo, key NBA numbers, playoff series context) are not applicable. Scoring reflects framework adherence and section-level reasoning quality.

| Section | Score | Note |
|---|---|---|
| Game Shape | 6/10 | Environment is established, but the lead sentence anchors on ballpark geography rather than the game's specific shape, and the conditional framing ("conditionally a pitcher's duel") undercuts the section's job of defining the environment with authority. |
| Key Drivers | 7/10 | Prioritization is present and Holmes is correctly placed first, but Driver 4 (Moniak) is a player-level edge rather than a structural game driver, and the NEUTRAL/GREEN/RED color labels belong to Fragility Check, not Key Drivers. |
| Base Script | 3/10 | Direct violation of the commitment rule — two parallel conditional branches of roughly equal weight are presented ("If Holmes starts... / The script flips entirely if...") without committing to a most-likely scenario; FRAGILE + dual-branch Base Script is internally inconsistent per framework rules. |
| Fragility Check | 6/10 | Both items are specific and checkable, but only two items and Item 1 is largely a restatement of the unconfirmed-starter variable already dominant in Game Shape and Key Drivers — the section adds limited new analytical surface. |
| Market Read | 5/10 | Implied probability math is present and plausible (-143 = ~59%), but the section is thin — it identifies that the run line is exposed to Holmes confirmation without explaining what the market is implying about that risk or whether the line has moved. |
| Confidence Level | 4/10 | FRAGILE is technically defensible, but a two-branch Base Script with roughly equal conditional paths is structurally closer to PASS territory — when the framework cannot commit to a scenario, the label should reflect that rather than accepting FRAGILE as a workaround for unresolvable uncertainty. |

**Red flags triggered:** Base Script presents two equally-weighted conditional branches without committing to a most-likely scenario, violating the framework's commitment rule; color-coded labels (NEUTRAL/GREEN/RED) appear in Key Drivers where they do not belong per the design system; the closing line in "What This Means" appears mid-paragraph rather than as a standalone terminal sentence, diluting its structural weight.

**Weakest claim in this breakdown:** "The script flips entirely if a replacement arm starts for New York" — this is not a committed base script, it is a pivot clause that grants the alternative scenario equal structural authority, which means the section is functionally presenting two scripts and calling it one, in direct conflict with the framework's requirement that the Base Script commit to the most likely flow.

**NBA Analyst Score: 5.2/10** *(average of six section scores)*


---

## MLB Analyst

| Section | Score | Note |
|---|---|---|
| Game Shape | 6/10 | Coors correctly identified and altitude inflation acknowledged; Sugano confirmed/Holmes unconfirmed flagged; no weather data cited; framing leans too heavily on Holmes uncertainty rather than grounding the known environment. |
| Key Drivers | 5/10 | Holmes stats plausible but flagged as possible reliever-era numbers with no FIP cited for either pitcher; Sugano's 2.84 ERA at Coors treated as ordinary rather than elite; no platoon/handedness splits; Moniak 1.098 OPS unqualified; Holmes labeled NEUTRAL rather than AMBER (color-code error). |
| Base Script | 3/10 | Critical structural violation: two equally-weighted branches ("If Holmes starts... / The script flips entirely if...") directly violates the commitment rule — Base Script must commit to one most-likely scenario; COL bullpen 7.27 ERA is also buried here instead of Key Drivers where it belongs. |
| Fragility Check | 5/10 | Only 2 items at the minimum; no RED/AMBER/GREEN emoji color coding shown (rules violation); both items are specific and checkable; missing an obvious third point (weather/wind at Coors, or Moniak injury status). |
| Market Read | 4/10 | -143 at 59% correctly calculated; COL +119 implied probability (45.66%) never mentioned; no line movement disclosure (required per format rules); F5 line omitted despite pitcher uncertainty making it highly relevant; "Coors historically justifies that elevation" is a narrative claim, not a market read. |
| Confidence Level | 7/10 | FRAGILE is correct given Holmes unconfirmed; a PASS case is arguable given two-branch Base Script and dual volatility points, but FRAGILE is defensible. |

**Red flags triggered:**
- Two-branch Base Script (structural violation — "If Holmes starts... / The script flips entirely if...") — automatic NEEDS REVISION
- FIP not cited for either pitcher despite ERA/FIP divergence being potentially material for Holmes (reliever-era stats applied to starter context)
- Line movement not disclosed in Market Read
- Labels swapped in Where the Data Points: TOTAL content is under "Spread" label; RUN LINE content is under "Total" label
- COL +119 implied probability never calculated or mentioned
- Holmes listed as NEUTRAL in Key Drivers — should be AMBER per color-coding rules

**Weakest claim in this breakdown:** "The total at 11 is already elevated, but Coors Field historically justifies that elevation — the books are not overreacting to the park, they are pricing it correctly" — this is a circular narrative assertion dressed as a market read; it explains nothing about line movement, sharp action, or whether the current number reflects Holmes's confirmation status, and it uses "historically" without any supporting data.

**MLB Analyst Score: 5.0/10** *(average of six section scores)*


---

## Market Analyst

**Implied probability math:** Partially correct — NYM -143: 143/(143+100) = 143/243 = 58.85%, rounded to 59% in the breakdown ✓ accurate. COL +119: 100/(119+100) = 100/219 = 45.66% — this probability is never mentioned anywhere in the breakdown, not in Market Read, not in Where the Data Points, not in any other section. The combined vig (58.85% + 45.66% = 104.51%) is within normal range and is never acknowledged. The breakdown presents only one side of a two-sided market.

**Line movement claim:** Missing entirely — the breakdown contains no reference to an opening line, no reference to current vs. opening spread, and no acknowledgment that line movement data is absent. Per format rules, the Market Read must either state where the line moved from or explicitly note the absence of that data. This is a hard omission, not an honest disclosure. The phrase "the books are pricing it correctly" implies market confidence without a single piece of movement data to support it.

**Signal Grade alignment:** Fits the market data as a label but not as a justification — FRAGILE is the correct grade given Holmes being unconfirmed, but the Market Read section itself does not demonstrate why FRAGILE was chosen from a market evidence standpoint. The grade is correct; the section that should support it fails to do so.

**Hallucinated claims:** Two identified. First: "Coors Field historically justifies that elevation — the books are not overreacting to the park, they are pricing it correctly" — this is a market behavior claim with zero supporting data; no line history, no movement, no book comparison is cited; the word "historically" adds false authority. Second: "NYM lineup averaging 118 runs per game" in the RUN LINE entry under Where the Data Points — an MLB team averaging 118 runs per game would shatter every record in baseball history (the highest-scoring season by any team was 1931 Philadelphia Athletics at roughly 6.1 RPG); this stat is almost certainly a misstatement of total runs scored this season (e.g., "the Mets have scored 118 runs through X games") or a per-game average being presented in aggregate form without context; as written, it is not a real number and cannot be verified as stated.

**Sharp money characterization:** Not claimed — the breakdown does not attribute line position to sharp or public action, which is the correct call given no movement data is cited. However, "the books are pricing it correctly" functions as an implicit sharp-validation claim without any supporting evidence, which is worse than making no claim at all.

**Where the Data Points label issue:** Confirmed reversed — the entry labeled "Spread" contains TOTAL content (under-on-11 projection, combined runs estimate of 9-10); the entry labeled "Total" contains RUN LINE content (COL +1.5 run line analysis, Sugano ERA, NYM run average). These labels are directly swapped. A user reading this section would conclude the total analysis applies to the spread and vice versa. This is a live user-facing formatting error that could actively mislead a decision.

**Stat flag:** "NYM lineup averaging 118 runs per game" — this is almost certainly a misstatement. The most plausible interpretations: (1) the Mets have scored approximately 118 total runs through roughly 25-30 games this season, yielding roughly 4.1-4.7 RPG, which would be a below-average offense, not a notable edge; or (2) a per-game pace figure was accidentally left in raw/total form. As written, 118 runs per game is not a real number. The stat as stated cannot be used to justify the COL +1.5 run line claim because it is internally incoherent.

**Red flags triggered:**
- Line movement disclosure completely absent — no opening line, no movement reference, no honest acknowledgment of missing data
- COL +119 implied probability (45.66%) never calculated or mentioned — Market Read presents a one-sided probability picture
- "Coors Field historically justifies that elevation — the books are pricing it correctly" — market behavior claim with no data support, functions as false sharp validation
- Where the Data Points labels reversed (TOTAL content under "Spread" label; RUN LINE content under "Total" label) — live user-facing formatting error
- "NYM lineup averaging 118 runs per game" — stat as written is not a real number; likely a unit error or total-vs-average confusion; must be corrected before any user sees it
- F5 line entirely absent — given Holmes unconfirmed, the first-five-innings line is the single most relevant market instrument for this game and its omission leaves a meaningful analytical gap

**Market Analyst Score: 3/10**

Score rationale: The only element that is unambiguously correct is the NYM -143 implied probability conversion (58.85% ≈ 59%). Everything else in the Market Read fails — the COL side of the market is ignored entirely, line movement is absent without disclosure, "the books are pricing it correctly" is stated as fact without a single piece of supporting market data, and the section reads as narrative dressed as market analysis. The Where the Data Points label swap is a live product error that directly misleads users. The 118 RPG stat is not a real number and would undermine user trust if published. For a section whose entire job is accurate market interpretation, this breakdown delivers one correct probability conversion and seven identifiable failures.


---

## Skeptic

**Primary weakness:** The breakdown cannot establish a Base Script — it presents two fully contradictory branches with equal weight, which is a structural violation of the commitment rule, not just a data gap.

**Counter-argument not addressed:** Holmes's below-average K/9 (6.6) implies a contact-heavy profile, and ground-ball/contact pitchers at Coors Field face a park that actively punishes balls in play at altitude — the under read assumes Holmes suppresses, but his profile may be the wrong profile for this environment even if he starts.

**Confidence level verdict:** TOO HIGH
- Assigned: FRAGILE
- Should be: PASS — three unknowns (Holmes status, COL bullpen ERA 7.27, run environment described as "impossible to fully price") point in different directions and the breakdown cannot make a directional commitment on the total.

**Stat most likely to be wrong:** "NYM lineup averaging 118 runs per game" — this is a DO NOT SHIP stat; no MLB team has ever averaged more than approximately 7 runs per game in a full season, making this figure either hallucinated or a cumulative total misrepresented as a per-game average.

**Base script fragility:** FRAGILE
- The breakdown presents two fully inverted scripts with no committed primary branch, so if Holmes is scratched the framework has no fallback — it simply becomes the other script, meaning the analysis provides no durable read in either world.

**FRAGILE vs. PASS audit:** FRAGILE should be PASS — three unknowns pointing in different directions with no committed directional read meets the PASS threshold.

**Skeptic's verdict: DO NOT SHIP**

**Robustness score: 2/10**


---
---

# Breakdown Evaluation Report
Date: 2026-05-04

## Breakdown Under Review
MLB · Monday, May 4, 2026 · 6:40 PM ET — Toronto Blue Jays at Tampa Bay Rays — FRAGILE
Run Line: TB +1.5 | Total: 8 | TOR ML: +104 | TB ML: -126


---

## MLB Analyst

| Section | Score | Note |
|---|---|---|
| Game Shape | 4/10 | Opens with situation ("Gausman's unconfirmed status is the single biggest variable"), not environment — direct rule violation; Tropicana Field is never named or characterized as a dome/pitcher-friendly park; weather correctly omitted for dome. |
| Key Drivers | 4/10 | Driver 1 labels Martinez "Works against" but his 1.70 ERA is a Tampa Bay asset that supports the low-scoring script — label is backwards; ".333/.854/.814 OPS" is physically impossible (.854 OBP has never been achieved in MLB history) and appears in Driver 3 as a real stat — likely a formatting error or hallucinated figure; FIP cited for neither pitcher. |
| Base Script | 6/10 | Conditionally commits to one scenario ("If Gausman starts...") rather than presenting dual equal branches — structurally cleaner than a two-branch script; 4-6 run projection is directionally coherent with the UNDER on 8, but the conditional framing still weakens commitment. |
| Fragility Check | 4/10 | Only 2 items at minimum; no RED/AMBER/GREEN emoji color codes present — rule violation; the impossible ".333/.854/.814 OPS" slash line reappears here unchanged; missing an obvious third fragility point such as Martinez's low K/9 contact-heavy profile against a TOR lineup or the precision risk on TB's 1.00 ERA figure. |
| Market Read | 4/10 | TB -126 at 56% is correct; TOR +104 implied probability (49.0%) never mentioned — one-sided market read; no line movement disclosure; F5 line absent despite Gausman being unconfirmed; "books will almost certainly move that number up" is a speculative forecast, not a market interpretation. |
| Confidence Level | 7/10 | FRAGILE correctly applied — Gausman unconfirmed triggers the automatic FRAGILE threshold per MLB rules, and the conditional-commit Base Script is more defensible than a dual-branch script. |

**Red flags triggered:**
- Game Shape opens with situation, not environment — rule violation
- Driver 1 "Works against" label appears backwards — Martinez's 1.70 ERA is a TB asset supporting the script, not working against it
- ".333/.854/.814 OPS" slash line is physically impossible (.854 OBP exceeds any player's career best by nearly double) — appears in both Key Drivers and Fragility Check; likely stat formatting error or hallucinated figure
- TOR +104 implied probability (49.0%) never calculated or mentioned — one-sided market read
- Line movement not disclosed in Market Read
- F5 line not mentioned despite Gausman confirmation being unresolved — highest-relevance market instrument for this game
- "Books will almost certainly move that number up" — speculative prediction, not a market read
- No RED/AMBER/GREEN emoji color codes in Fragility Check — rule violation
- FIP not cited for either pitcher

**Weakest claim in this breakdown:** "Tampa Bay lineup posting .333/.854/.814 OPS at the top" — a .854 OBP figure has never been achieved by any MLB player in a full season (Ted Williams's career best was .482), making this an impossible slash line that cannot represent real individual or lineup stats; this figure appears twice and is used as structural support for both a key driver and a fragility point, meaning two sections rest on a stat that cannot be real as written.

**MLB Analyst Score: 4.8/10** *(average of six section scores)*


---

## NBA Analyst

> **Note:** This is an MLB breakdown, not NBA. Evaluating structural quality only — sport-specific NBA criteria (pace profile, key NBA numbers, playoff series context, tempo rank) are not applicable. Scoring reflects framework adherence and section-level reasoning quality.

| Section | Score | Note |
|---|---|---|
| Game Shape | 4/10 | Opens with "Gausman's unconfirmed status is the single biggest variable" — this describes a situational variable, not the game environment; per framework rules, Game Shape must open with environment (park, pace, matchup structure), not the dominant uncertainty. |
| Key Drivers | 3/10 | Driver 1 (Martinez 1.70 ERA — a Tampa Bay asset) is labeled "Works against" with no qualifier specifying against whom, implying it works against the expected outcome when the opposite is true; three of four drivers share the same "Works against" label, collapsing prioritization entirely. |
| Base Script | 6/10 | Opens with "If Gausman starts..." — a conditional commit rather than a full two-branch violation; softer than the COL breakdown's co-equal branch problem, but the framework requires commitment to the most-likely scenario without leading with a hedge; script content and internal projection range are otherwise coherent. |
| Fragility Check | 3/10 | ".333/.854/.814 OPS at the top" contains an OBP of .854 — statistically impossible for any lineup (all-time single-season OBP record is .609); this is a malformed slash line combining separate player stats without labeling and represents a live data integrity failure. |
| Market Read | 6/10 | TB -126 implied probability (55.75%) correctly rounded to 56%; section identifies the total calibration depends on Gausman but does not translate the 8-run total into plain-English probability on either side, and TOR +104 / the TOR implied probability is never mentioned. |
| Confidence Level | 7/10 | FRAGILE correctly applied — one unresolved dominant variable (Gausman), a conditional Base Script, and a meaningful bullpen split all point to genuine fragility; label fits the data environment. |

**Red flags triggered:**
- Game Shape structural violation — section opens with the dominant variable rather than the game environment, inverting the section's core purpose
- Key Drivers direction/label mismatch — Martinez's 1.70 ERA (a TB asset that supports the script) is labeled "Works against" with no qualifier; as written this implies the stat works against the expected outcome, which is the opposite of the analysis
- Impossible stat in Fragility Check — ".854 OBP" in a slash line for a lineup is not a real number; this is almost certainly three separate player stats merged into one malformed slash line without attribution
- Conditional Base Script opening — "If Gausman starts..." is a softer version of the COL two-branch problem; does not fully violate the commitment rule but opens with a hedge rather than a committed scenario
- TOR implied probability (+104 = ~49.0%) never mentioned in Market Read — section presents only one side of a two-sided market

**Weakest claim in this breakdown:** "If Gausman is scratched, Toronto's next arm faces a Tampa Bay lineup posting .333/.854/.814 OPS at the top" — an OBP of .854 is statistically impossible for any lineup in the history of professional baseball (career leaders peak below .500); this stat as written is not a real number and cannot be cited as supporting evidence for any analytical claim.

**NBA Analyst Score: 4.8/10** *(average of six section scores)*


---

## Market Analyst

**Implied probability math:** Partially correct with one rounding error. TB -126: 126/(126+100) = 126/226 = 55.75% — the breakdown states "56%," which overstates by 0.25 percentage points; the correct rounded figure is 55.8%, not 56%. Minor but imprecise. TOR +104: 100/(104+100) = 100/204 = 49.02% — this probability is never mentioned anywhere in the breakdown, not in Market Read, not in Where the Data Points, not in any other section. The combined vig (55.75% + 49.02% = 104.77%) is within normal range and is never acknowledged. The breakdown presents only one side of a two-sided market.

**Line movement claim:** Missing — no opening line is referenced, no current-vs-opening movement is disclosed, and no honest acknowledgment of the absence of that data appears anywhere in the breakdown. The phrase "the current 8 would be stale" implies the line has not moved yet, but this is not a movement disclosure — it is a speculation about future staleness. This is a hard omission per format rules, not an honest handling of missing data.

**Signal Grade alignment:** Does not fit the full picture — FRAGILE is plausible given the Gausman unconfirmed situation, but a market environment with no line movement data disclosed, an unconfirmed starter (the single most price-sensitive variable), and an implied probability of only 55.75% for the favorite is closer to PASS territory than the breakdown acknowledges. The grade may be correct but the Market Read section fails to demonstrate why it was chosen over PASS.

**Hallucinated claims:** Two identified. First: "bullpen gap being as wide as any in this division" — this is an AL East comparative claim that cannot be derived from the two bullpen stats cited (TB 1.00 ERA/76% saves vs. TOR 3.39 ERA/50% saves); a division-wide comparison requires data on NYY, BAL, and BOS bullpens that is never cited, making this claim unverifiable as stated. Second: "the 8-run total feels calibrated for a Gausman start" — "feels calibrated" is a narrative assertion, not a market read; no movement data, no sharp action reference, and no open-to-current line history is cited to support the claim that books set this number with Gausman in mind.

**Sharp money characterization:** Not claimed — the breakdown does not attribute line position to sharp or public action. However, the phrase "feels calibrated for a Gausman start" functions as an implicit market-validation claim (implying books priced this correctly with Gausman in mind) without any movement data or sourcing to support it. This is worse than making no claim.

**Speculative language flagged:** Two instances. First: "books will almost certainly move that number up" — a forward-looking prediction about sportsbook pricing behavior; this is a forecast, not a market read, and "almost certainly" signals unwarranted confidence in a prediction about book behavior that cannot be known at breakdown time. Second: "the 8-run total feels calibrated for a Gausman start" — "feels calibrated" is narrative framing, not market evidence; it asserts a causal relationship between the starter and the total without any sourcing.

**F5 line omission:** The F5 (first-five-innings) line is the single most market-relevant instrument in any game where a starter is unconfirmed — it directly prices starter performance and would move most dramatically on a Gausman scratch. Its complete absence from the Market Read and Where the Data Points is a meaningful analytical gap, especially given that Gausman's confirmation status is identified as the primary fragility point throughout the breakdown.

**Run line plain English check:** Incomplete — the breakdown states "that cushion absorbs a one-run deficit," which captures the loss-by-one scenario but omits the "or win outright" component of what TB +1.5 means. A user reading this section would not understand that a TB win also cashes the run line. The explanation is partial, not wrong, but it is not the plain-English translation the format requires.

**Where the Data Points label check:** Correct — RUN LINE is under the "Spread" label and TOTAL is under the "Total" label. The label reversal error from the COL breakdown is not present here.

**Red flags triggered:**
- TOR +104 implied probability (49.02%) never mentioned — Market Read presents a one-sided probability picture
- Line movement disclosure completely absent — no opening line, no movement reference, no honest acknowledgment of missing data
- "Books will almost certainly move that number up" — speculative forecast about future book behavior; inappropriate in a Market Read
- "Bullpen gap being as wide as any in this division" — unverifiable comparative claim; no division-wide bullpen data cited
- "Feels calibrated for a Gausman start" — narrative claim with no market evidence; asserts book pricing intent without sourcing
- F5 line absent — most relevant market instrument given unconfirmed starter, omission is analytically significant
- TB -126 rounded to 56% rather than 55.8% — minor rounding error but directionally wrong

**Market Analyst Score: 4/10**

Score rationale: The section correctly identifies the run line as structurally relevant and its treatment of the TB +1.5 as the key instrument is directionally sound. However, four of the seven specific checkpoints fail: the implied probability math has a rounding error and presents only one side of the market, line movement is absent without disclosure, speculative language ("almost certainly," "feels calibrated") is used in place of actual market evidence, and the F5 line — the most critical market instrument given the unconfirmed starter — is never mentioned. The bullpen division comparison is stated as fact without data. For a Market Read section, the standard is accuracy and evidence; this section substitutes narrative framing for both.


---

## Skeptic

**Primary weakness:** The ".333/.854/.814 OPS" slash line in Fragility Check Item 1 is statistically impossible — an .854 OBP has never been posted by any MLB player in a season, and no lineup aggregates to that figure — making this either a misattributed individual stat (Caminero's OPS) formatted as a team slash line or an outright hallucination, and it is presented as fact in a section explicitly required to be "specific and checkable."

**Counter-argument not addressed:** TB bullpen's 1.00 ERA over 7 days is a hot-streak artifact, not a structural edge — small-sample bullpen figures regress rapidly, and the breakdown treats this figure as durable support for the run line read when it almost certainly reflects a handful of low-leverage outings.

**Confidence level verdict:** TOO HIGH
- Assigned: FRAGILE
- Should be: PASS — the primary starter is literally unconfirmed, the Base Script opens with an unresolved conditional ("If Gausman starts..."), and the key fragility stat (.854 OBP) is statistically impossible, leaving the breakdown with no verified factual anchor and no alternative script if the condition fails.

**Stat most likely to be wrong:** ".333/.854/.814 OPS at the top" — the .854 figure in the OBP position is impossible as formatted; Caminero's individual OPS (.854) appears to have been incorrectly embedded in a slash line structure, presenting a real individual stat as a fake team stat.

**Base script fragility:** CONDITIONAL
- The Base Script is internally coherent within the Gausman scenario but provides no alternative framework if Gausman is scratched, leaving the user with zero guidance on the most probable pre-game scenario shift.

**FRAGILE vs. PASS audit:** FRAGILE should be PASS — the primary starter is unconfirmed, the Base Script is fully conditional on that unresolved variable, and the central fragility stat is misformatted and unverifiable as written, which matches or exceeds the COL breakdown situation that warranted PASS.

**Skeptic's verdict: DO NOT SHIP**

**Robustness score: 3/10**

