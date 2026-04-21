# CLAUDE.md — RawIntel

## Read this first. Every session. No exceptions.

RawIntel is a decision-support tool for sports bettors. Every line of code, every output, every design decision must serve this product and this product only.

---

## What RawIntel IS

- A tool that translates raw game data into plain-English breakdowns
- A system that interprets data, prioritizes signal over noise, and guides thinking
- A product that helps users make informed betting decisions on their own terms
- An education layer baked into the product experience itself

## What RawIntel is NOT

- Not a picks service
- Not a prediction engine
- Not a raw data dashboard
- Not a gambling content brand
- Not a system that tells users what to bet

---

## The North Star

A user should never leave a RawIntel breakdown thinking: "What should I bet?"

They should leave thinking: "I understand this game well enough to decide."

---

## The Six-Step Framework

Every breakdown follows this exact structure. Every sport. Every game. Every time.

### 01 — GAME SHAPE
Purpose: Define the environment. What kind of game is this?
Length: 2–4 sentences.
Include: Pace profile, competitiveness, style, stability vs volatility.

### 02 — KEY DRIVERS
Purpose: Identify what actually matters. What 2–4 factors will decide this game?
Rule: Only include what materially impacts the outcome. Never equal weighting.

### 03 — BASE SCRIPT
Purpose: Establish the most likely flow. If things play out normally, what happens?
Length: 1 paragraph.

### 04 — FRAGILITY CHECK
Purpose: Identify failure points. What could break the script?
Limit: 2–3 items maximum.

### 05 — MARKET READ
Purpose: Interpret the betting line. What is the market implying, and does it fit?
Rule: Always translate the line into plain English probability. Never leave a number unexplained.

### 06 — DECISION LENS
Purpose: Guide thinking without giving picks. How should the user approach this game?
Rule: Always ends with the closing line. Never names a specific bet.

---

## The Closing Line — Never Changes

"This is not a pick. This is what the data says. Your decision is always yours."

This line appears at the end of every single Decision Lens. Every sport. Every game. Every time. It never changes. It never gets paraphrased. It never gets removed.

---

## Voice Rules

The voice is: Sharp without swagger. Calm without being passive. Smart without being academic.

Every sentence must: frame, prioritize, interpret, or caution. If it does none of these — cut it.

Do not use: hype language, fake certainty, exclamation points, emoji in UI copy, filler phrases.

---

## Design Rules

### Behave as a senior UI designer, not just a developer.
Before writing any frontend code, think through: purpose, tone, constraints, and how this component fits the overall design language. Never default to generic patterns.

### Brand Tokens — use these exclusively, no deviations
```css
--ink: #0E0E0E;
--signal: #D93B3A;
--paper: #F7F5F0;
--canvas: #FAFAFA;
--muted: #8A8A86;
--border: rgba(14,14,14,0.1);
--serif: 'Playfair Display', Georgia, serif;
--sans: 'Inter', 'Helvetica Neue', sans-serif;
```

### Typography
- Serif (Playfair Display): headlines, matchup names, section titles, hero h1
- Sans (Inter): body copy, labels, metadata, UI text, nav
- Never mix these roles
- Never use system fonts if Google Fonts are available
- Letter-spacing on headings: -0.025em to -0.03em (tight, confident)
- Eyebrows and labels: 0.18em to 0.22em (wide, deliberate)

### Interaction Standards
- Hover transitions: 150ms ease
- All interactive elements must have a visible hover state
- Cards on hover: translateY(-1px) + elevated shadow
- Buttons on hover: opacity 0.88 or background shift
- Never leave a clickable element without a hover response

### Screenshot Workflow
After building any UI component or page:
1. Take a screenshot using Puppeteer
2. Review it visually — check spacing, alignment, contrast, hover states
3. Fix any issues found before marking complete
4. Take a final screenshot to confirm

### Anti-patterns — never do these
- Purple gradients or generic AI color schemes
- Rounded corner cards on plain white with no depth
- Inter or Arial as the only font (use Playfair Display for display text)
- Generic grid layouts with equal-weight cards
- Hover states that only change color — add physical movement
- Unexplained data labels (always tooltip or define on first use)

---

## Product Identity

Name: RawIntel
Domain: rawintelsports.com
Tagline: What the data says. Your decision to make.
One-liner: RawIntel turns raw game data into plain-English analysis so you can make informed decisions in under 60 seconds.

---

## Signal Grade

Signal Grade is a data quality rating displayed on every game card and breakdown. It rates how much confidence the data supports going into a breakdown — not a prediction of outcome.

### How it is calculated
Signal Grade is computed from four data inputs before Claude generates the breakdown. The score is passed into Claude as context, not estimated by Claude.

#### Factor 1 — Lineup Certainty (0–3 points)
- 3 = All starters confirmed, no injury flags on key players
- 2 = Minor uncertainty (one role player questionable, no impact player affected)
- 1 = One key player uncertain (starter questionable or game-time decision)
- 0 = Major uncertainty (starter out or unknown, lineup significantly affected)

#### Factor 2 — Line Stability (0–3 points)
- 3 = Line has moved less than 0.5 points since open
- 2 = Line has moved 0.5–1.5 points
- 1 = Line has moved 1.5–3 points (sharp action or public steam)
- 0 = Line has moved more than 3 points or been suspended/reset

#### Factor 3 — Historical Data Depth (0–2 points)
- 2 = 10+ relevant head-to-head matchups in last 2 seasons, both teams have 15+ games played this season
- 1 = 5–9 matchups or one team is early in season (under 15 games)
- 0 = Fewer than 5 matchups or very early season with thin sample

#### Factor 4 — Environmental Clarity (0–2 points)
- 2 = No significant external factors (weather normal, neutral rest, no back-to-back)
- 1 = One minor factor present (slight weather concern or one team on second night)
- 0 = Multiple compounding factors (bad weather + back-to-back + travel etc)

### Grading scale (total out of 10)
- 9–10 = A — Strong signal. Data is clean, environment stable. Breakdown well-supported.
- 7–8 = B — Solid signal. Minor uncertainty in one area but breakdown holds.
- 5–6 = C — Limited signal. Meaningful unknowns present. Read fragility check carefully.
- 3–4 = D — Weak signal. Multiple unknowns. Breakdown is directional at best.
- 0–2 = F — Noise. Too many variables unresolved. Treat as speculative.

### Where it appears
- On every game card as "Signal Grade" + letter
- In the breakdown header
- Defined in the glossary
- A grade of C or below should cause Claude to surface more fragility points in the Fragility Check step

### Data sources for calculation
- Lineup Certainty: Tank01 injury and lineup data
- Line Stability: The Odds API (compare opening line to current line)
- Historical Data Depth: Tank01 head-to-head and season game counts
- Environmental Clarity: weather API for outdoor sports, schedule data for back-to-backs

### Implementation status
Signal Grade calculation logic not yet built. Currently displayed as a static placeholder. Build the calculation function before connecting live data to game cards.

---

## Tech Stack

- Frontend: Next.js
- Deployment: Vercel
- Database: Supabase
- Odds API: The Odds API
- Sports data: Tank01 (RapidAPI — NBA and MLB are separate subscriptions)
- AI: Claude API (claude-sonnet-4-6) for breakdown generation
- Payments: Stripe (pending)
- Version control: GitHub (kls5h2)

---

## Current Known Issues — fix these when encountered
- Nav bar z-index overlap on archive breakdown scroll
- Milwaukee Bucks away color accent
- Mobile nav has no collapse/hamburger below 600px
- /repurpose admin gate is client-side only (localStorage email check). When Supabase Auth is implemented, replace with server-side session verification and add JWT auth header to the /api/repurpose route.

---

## Hard Rules

Never:
- Give direct betting instructions in any output
- Name specific bets or selections
- Use hype language of any kind
- Express fake certainty
- Build beyond current scope without instruction

Always:
- Maintain six-step structure in every breakdown output
- Translate every betting line into plain English
- End every Decision Lens with the closing line
- Include one glossary callout per analysis
- Use brand tokens — never hardcode hex values outside the token system
