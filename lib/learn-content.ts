/**
 * /learn article content.
 *
 * Each article is a plain-English explanation of a betting concept.
 * Rendered by components/LearnPage at /learn/[slug].
 */

export interface LearnFAQ {
  q: string;
  a: string;
}

export interface LearnArticle {
  slug: string;              // URL segment, e.g. "moneyline"
  title: string;             // article headline
  metaDescription: string;   // <meta name="description">
  directAnswer: string;      // pull-quote, one-sentence answer
  explanation: string;       // plain-English body prose
  example: string;           // concrete scenario, rendered in a --paper card
  decisionContext: string;   // "what it means for your decision" section
  faqs: LearnFAQ[];          // 3–4 Q&As, rendered as a native accordion
  relatedSlugs: string[];    // slugs — rendered as links at the bottom
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "what-does-minus-110-mean",
    title: "What Does -110 Mean in Betting?",
    metaDescription: "-110 is the most common price in American sports betting. Here's what the number actually costs you and why it matters.",
    directAnswer: "A -110 line means you have to risk $110 to win $100 — the extra $10 is the sportsbook's cut.",
    explanation: `Every betting line has two numbers: the side you're betting on, and the price you pay to bet it. -110 is the most common price in American sports betting. It shows up next to nearly every spread and total.

The minus sign tells you how much you need to stake to win $100. At -110, you risk $110 to win $100. If you win, you get $210 back — your $110 stake plus $100 profit. If you lose, the book keeps the $110.

That extra $10 is called the vig or juice. It's the sportsbook's fee for taking the bet. Over thousands of wagers, that $10 is how books make money.`,
    example: "Say the Lakers are favored by 6.5 points at -110 against the Nuggets. You bet $55 on the Lakers to cover. The Lakers win by 9 — they covered the spread. You get back $105 total: your $55 stake plus $50 profit.",
    decisionContext: "When you see -110 next to a line, remember the math. You're not betting at even money — you're paying a premium. To break even long-term at -110, you need to win 52.4% of your bets, not 50%. That small gap is the edge the book holds over every casual bettor. Your decision is always yours.",
    faqs: [
      { q: "Why is -110 so common?", a: "It's the standard juice for point spreads and totals. Books set it there to build a profit margin into every bet regardless of which side wins." },
      { q: "Is -110 the same as even odds?", a: "No — even odds would be +100, risking $100 to win $100. At -110 you pay $10 more for the same $100 win, and that gap is the house edge." },
      { q: "Can the juice be higher or lower than -110?", a: "Yes. Some books post -105 on certain lines (cheaper), others push to -115 or -120. Shopping across books saves real money over time." },
      { q: "Does -110 appear on moneylines too?", a: "Rarely. Moneylines are priced to reflect actual win probability, so they vary widely — a heavy favorite might be -400 and the underdog +320." },
    ],
    relatedSlugs: ["how-to-read-betting-odds", "what-is-juice-or-vig", "what-does-plus-150-mean"],
  },
  {
    slug: "how-does-a-point-spread-work",
    title: "How Does a Point Spread Work?",
    metaDescription: "The point spread is a handicap that balances uneven matchups. Here's how the number works and what it's really telling you.",
    directAnswer: "A point spread is a handicap that makes two teams of different quality a roughly even bet — the favorite gives up points, the underdog gets them.",
    explanation: `Sportsbooks don't want you betting which team will win. If one team is clearly better, everyone would bet the favorite and the book would lose. So they build a handicap into the bet itself.

The favored team is listed with a minus sign: -6.5, for example. They have to win by more than 6.5 points for your bet to pay. The underdog is listed with a plus sign: +6.5. They can lose by up to 6.5 points and still cover the spread.

The half-point is intentional — it prevents ties. A spread of -7 would mean the favorite winning by exactly 7 results in a push, where everyone gets their money back. The half-point forces a winner and a loser on every bet.`,
    example: "Boston is favored by 4.5 against Miami. You bet Miami +4.5 at -110. Boston wins 108-105. Miami lost the game by 3, but with the 4.5-point cushion, your bet wins. You risked $110 to profit $100.",
    decisionContext: "The spread isn't a prediction of the final score — it's the line where the market thinks equal money will come in on both sides. Reading a spread well means asking whether that line fairly captures the gap between the two teams tonight, given injuries, rest, and matchup. When it doesn't, there's potential value. When it does, you're just paying juice. Your decision is always yours.",
    faqs: [
      { q: "What happens if the spread is a whole number and the game lands on it?", a: "That's called a push — no one wins and your stake is refunded. It's why most spreads include a half-point to force a result." },
      { q: "Why does the spread change before the game?", a: "As bets come in and news breaks, books adjust the line to manage their risk. A moving spread tells you where the money and information are flowing." },
      { q: "Is it better to bet the favorite or the underdog?", a: "Neither by default — both are priced at roughly the same juice. What matters is whether the line is set correctly for tonight's matchup." },
      { q: "Do spreads exist in every sport?", a: "In most, yes — football, basketball, hockey (puck line), baseball (run line). Some low-scoring sports use smaller spreads or alternate formats." },
    ],
    relatedSlugs: ["what-does-minus-110-mean", "how-to-know-if-spread-is-too-high", "what-is-line-shopping"],
  },
  {
    slug: "what-is-a-moneyline-bet",
    title: "What Is a Moneyline Bet?",
    metaDescription: "A moneyline bet is the simplest wager in sports — pick the winner, no spread. Here's how the pricing actually works.",
    directAnswer: "A moneyline bet is the simplest wager you can make — you pick which team wins, with no spread involved.",
    explanation: `Every moneyline has two prices. The favorite has a negative number like -180, which tells you how much to risk to win $100. The underdog has a positive number like +155, which tells you how much you win on a $100 bet.

There's no margin, no spread, no covering by a certain amount. If your team wins the game, you win the bet. If they lose, you lose.

The tradeoff is the price. Because the outcome is simpler, the payouts reflect how likely each side is to win. A heavy favorite might cost $400 to win $100. A big underdog might pay $350 on a $100 stake. The moneyline is where the market's honest read on win probability lives.`,
    example: "The Dodgers host the Rockies. Los Angeles is -220 on the moneyline, Colorado is +180. You bet $50 on Colorado. The Rockies pull off the upset. You win $90 in profit — $140 back on your $50 stake.",
    decisionContext: "Moneylines tell you what the market thinks the win probability actually is. Strip the vig out and those numbers translate directly into odds. Use them to sanity-check your own read — if you think a team wins 55% of the time and the moneyline implies 45%, that's where attention is worth paying. Your decision is always yours.",
    faqs: [
      { q: "What's the difference between a moneyline and a spread?", a: "A moneyline is a straight win-or-lose bet with no points involved. A spread forces the favorite to win by a set margin, balancing the bet at roughly even odds." },
      { q: "Why are moneylines better for underdogs?", a: "An underdog on the moneyline only has to win the game. Against the spread they win more often but pay less — which is better depends on how much you trust them to actually win outright." },
      { q: "Are moneylines used in all sports?", a: "Yes, in any sport with a winner. They're especially popular in baseball, hockey, and soccer where scoring is low enough that spreads feel less precise." },
      { q: "What's a 'pick 'em' moneyline?", a: "When both teams are priced at roughly -110, the book is telling you the matchup is a coin flip. No real favorite, no real underdog — just pay the juice and pick a side." },
    ],
    relatedSlugs: ["what-does-plus-150-mean", "what-is-implied-probability", "how-does-a-point-spread-work"],
  },
  {
    slug: "what-does-over-under-mean",
    title: "What Does Over/Under Mean in Sports Betting?",
    metaDescription: "The over/under is a single bet on total points scored by both teams. Here's how to read it and what drives it.",
    directAnswer: "The over/under is a single number representing the total points both teams will combine to score — you bet whether the actual total will go over or under it.",
    explanation: `Every game has two main markets: who wins, and how many points get scored. The over/under lives in the second bucket. The sportsbook sets a number — 224.5 in an NBA game, 8.5 in a baseball game, 47 in a football game — and you pick a side.

The half-points work the same way as spreads: they prevent ties. If the book set the total at 225 even and the game landed on exactly 225, everyone gets their money back. The .5 forces a decision.

Totals are priced at the same standard -110 juice as spreads. You're not betting on who wins — you're betting on the combined pace and scoring of the entire game.`,
    example: "A Chiefs vs Bills game has an over/under of 48.5. You bet the under at -110. The final score is 24-20 — 44 points total. You win.",
    decisionContext: "Totals reward understanding pace, shooting, pitching, or weather — whatever drives scoring in the sport you're watching. The line reflects the market's expectation for how the game will flow. If an injury or matchup tilts that flow in one direction and the number hasn't fully adjusted, that's where the opportunity sits. Your decision is always yours.",
    faqs: [
      { q: "Who sets the over/under?", a: "The sportsbook sets an opening number based on models and team stats. The number moves as bets come in and as news breaks about weather, lineups, or pace." },
      { q: "Does overtime count toward the total?", a: "Yes in most sports — the full official score including overtime or extra innings counts for totals." },
      { q: "Why do totals move before tip-off?", a: "Same reasons spreads move — injuries, weather, lineup changes, and sharp money. A total dropping by 2 or 3 points usually signals real information entered the market." },
      { q: "What's a 'first-half total'?", a: "A separate total just for the first half (or first five innings in baseball). It lets you bet the pace of the opening period without waiting for the full game." },
    ],
    relatedSlugs: ["what-to-look-for-betting-a-total", "how-does-a-point-spread-work", "what-does-minus-110-mean"],
  },
  {
    slug: "what-is-juice-or-vig",
    title: "What Is Juice or Vig in Sports Betting?",
    metaDescription: "Juice (or vig) is the sportsbook's built-in fee on every bet. Here's how it works and why it's the real reason books win.",
    directAnswer: "Juice (also called vig, short for vigorish) is the fee the sportsbook charges to accept your bet — it's how they guarantee a profit regardless of who wins.",
    explanation: `When you see a standard bet priced at -110, the extra $10 you pay to win $100 is the juice. It's not a service fee you see on a receipt — it's baked into the price of every bet.

Here's the math. If two bettors each put $110 on opposite sides of a -110 line, the book takes in $220. The winner gets paid $210. The book pockets $10, no matter which side won. That $10 on $220 of handle is roughly a 4.5% margin.

Multiply that across millions of bets, and you understand why sportsbooks are profitable businesses. The juice is the engine.`,
    example: "You and a friend bet opposite sides of a Lakers-Nuggets total. You bet the over at -110, your friend bets the under at -110. You each risk $110. Lakers-Nuggets goes over — you win $100, your friend loses $110. The sportsbook keeps the $10 difference. That $10 is the vig.",
    decisionContext: "The juice is the constant tax on every bet you make. It doesn't go away, and it can't be beaten by being right 50% of the time — you need to be right closer to 52.4% just to break even at -110. That's why line shopping and avoiding high-juice markets matter more than most bettors realize. Your decision is always yours.",
    faqs: [
      { q: "Why is it called juice or vig?", a: "Vig is short for vigorish, old slang for the cut taken by bookmakers. Juice is newer industry shorthand for the same thing." },
      { q: "Is the juice always -110?", a: "That's the standard, but books often adjust. You'll see -105, -115, -120 depending on the market and how bets are flowing." },
      { q: "Can you avoid paying juice?", a: "Not entirely, but you can minimize it — line shop across books, look for reduced-juice markets, and avoid parlays where juice compounds." },
      { q: "Does juice exist on moneylines?", a: "Yes, just built in differently. Instead of a flat -110, the favorite and underdog prices add up to more than an even split, and that extra is the book's margin." },
    ],
    relatedSlugs: ["how-do-sportsbooks-make-money", "what-does-minus-110-mean", "what-is-line-shopping"],
  },
  {
    slug: "how-to-read-betting-odds",
    title: "How Do You Read Betting Odds?",
    metaDescription: "American betting odds use plus and minus signs to show risk and payout. Here's how to decode them in under a minute.",
    directAnswer: "American odds use a plus or minus sign — plus numbers show how much you win on a $100 bet, minus numbers show how much you need to risk to win $100.",
    explanation: `Every American betting line starts with either a + or a − followed by a number. Those two pieces of information tell you everything about the bet's cost and payout.

A minus number is a favorite. -200 means you risk $200 to win $100. A plus number is an underdog. +180 means a $100 bet returns $180 in profit. The bigger the number in either direction, the more lopsided the market sees the matchup.

The second thing to notice: the gap between the favorite's price and the underdog's price is the juice. If the favorite is -150 and the underdog is +130, that 20-point spread between them is the book's margin on the market.`,
    example: "You see Celtics -220, Raptors +180 on the moneyline. A $22 bet on Boston would pay $10 in profit if they win. A $20 bet on Toronto would pay $36 in profit if they win. The Celtics are heavier favorites because their number is further from zero on the minus side.",
    decisionContext: "Reading odds is about seeing past the numbers to what the market is implying. Convert them into probabilities in your head — a -200 favorite is saying the team wins about 67% of the time before juice. If your own read differs meaningfully from that, you've found a place worth examining. Your decision is always yours.",
    faqs: [
      { q: "What do decimal odds mean?", a: "Decimal odds (used in Europe and Australia) show your total payout per $1 including your stake. 2.00 means you double your money." },
      { q: "How do fractional odds work?", a: "Fractional odds (used in the UK) show profit over stake as a fraction. 5/2 means you win $5 for every $2 risked." },
      { q: "What does a short line or long line mean?", a: "A short line is close to even money (-120 vs +100). A long line means big gaps (-400 vs +310) — the market sees a big talent difference." },
      { q: "Is it harder to win betting favorites or underdogs?", a: "Neither, from a math standpoint. Favorites win more often, underdogs pay more when they do — profitability comes from finding mispriced games, not from preferring one side." },
    ],
    relatedSlugs: ["what-does-minus-110-mean", "what-does-plus-150-mean", "what-is-implied-probability"],
  },
  {
    slug: "what-does-plus-150-mean",
    title: "What Does +150 Mean in Betting?",
    metaDescription: "+150 is a common underdog price. Here's exactly what it pays, what it implies, and how to read it.",
    directAnswer: "A +150 line means a $100 bet returns $150 in profit if it wins — it's the price on an underdog.",
    explanation: `Plus numbers always represent underdogs. The further from zero, the bigger the underdog. +150 is a moderate underdog. +400 is a heavy underdog. +800 is a long shot.

The math is simple. +150 means for every $100 you risk, you win $150 in profit. Bet $50, win $75. Bet $200, win $300. The ratio stays the same regardless of stake size.

On a winning bet, you get your stake back plus the profit. $100 on +150 returns $250 total — your $100 back plus $150 in winnings.`,
    example: "The Mets are +150 against the Braves. You bet $60 on New York. The Mets win. You get $150 back — your $60 stake plus $90 profit.",
    decisionContext: "A plus price is the market's honest statement that this side is less likely to win. The question isn't whether the underdog will pull it off — it's whether +150 is the right price for how often they actually will. If you think the Mets win 45% of the time tonight and +150 implies they'll win 40%, that's a pricing gap worth noticing. Your decision is always yours.",
    faqs: [
      { q: "What does +150 translate to as a percentage?", a: "Roughly a 40% implied win probability before juice. The formula is 100 ÷ (plus odds + 100), which for +150 is 100 ÷ 250 = 40%." },
      { q: "Is +150 a good underdog price?", a: "Good depends on the actual matchup. +150 is moderate value — common on competitive games where one side has a slight edge." },
      { q: "What's the biggest plus-money bet I should take?", a: "There's no universal cap. Bigger plus prices require more confidence the market is wrong, because underdogs win less often." },
      { q: "Why do some underdogs have small plus numbers like +105?", a: "Because the matchup is close to even. +105 means the book sees this side winning about 48% of the time — barely an underdog at all." },
    ],
    relatedSlugs: ["what-does-minus-110-mean", "what-is-a-moneyline-bet", "what-is-implied-probability"],
  },
  {
    slug: "what-is-a-parlay-bet",
    title: "What Is a Parlay Bet?",
    metaDescription: "Parlays combine multiple bets into one, with multiplied odds. Here's why the payouts look great and the math rarely does.",
    directAnswer: "A parlay is a single bet that combines two or more wagers — every pick has to win for the parlay to pay, and the odds multiply as you add legs.",
    explanation: `Each individual bet inside a parlay is called a leg. A three-team parlay has three legs. Every leg has to win. If even one loses, the entire bet loses.

The appeal is the payout. Combining bets compounds the odds — a three-team parlay of -110 favorites pays around 6-to-1 instead of the roughly 0.9-to-1 you'd get on each single bet. Big return on small risk, in theory.

The catch is that each added leg reduces your probability of winning. Two -110 bets each win about 48% of the time after juice. Chain them together and you win the parlay about 23% of the time. Payouts look big because the math is working against you.`,
    example: "You build a three-team parlay: Lakers -4, Chiefs over 48.5, and Yankees moneyline. A $20 bet pays around $120 if all three hit. Lakers cover, Chiefs go over, but the Yankees lose. Your $20 is gone — the entire parlay loses.",
    decisionContext: "Parlays are priced to look attractive but carry a much higher effective juice than single bets. Every added leg multiplies the book's edge. They can be entertainment, but they're rarely where long-term value lives. If you're treating betting as an exercise in finding mispriced games, parlays work against that — each leg has to be priced wrong, not just one. Your decision is always yours.",
    faqs: [
      { q: "How many legs can a parlay have?", a: "Most books allow 2 to 12 or more. A 10-leg parlay of -110 favorites hits less than 1% of the time." },
      { q: "What's a same-game parlay?", a: "A parlay where all legs come from a single game. Because the legs are correlated, books price them higher than standard parlays to protect their margin." },
      { q: "What happens if one leg pushes?", a: "Most books drop that leg and reduce the parlay to the remaining legs at lower odds. A 3-team parlay with one push becomes a 2-team parlay." },
      { q: "Are parlays ever a smart bet?", a: "Occasionally, when you've identified correlated outcomes or multiple genuinely mispriced games. But most parlays are entertainment math with a higher effective house edge." },
    ],
    relatedSlugs: ["what-is-a-moneyline-bet", "what-is-juice-or-vig", "how-do-sportsbooks-make-money"],
  },
  {
    slug: "what-does-line-movement-mean",
    title: "What Does It Mean When a Line Moves?",
    metaDescription: "Betting lines move for specific reasons — money flow and information. Here's how to read what a moving line is actually saying.",
    directAnswer: "Line movement is when the point spread, total, or moneyline changes after it opens — usually because bets are flowing in unevenly or new information has entered the market.",
    explanation: `A line is set, not static. The book opens with a number based on their model, but the moment bets start coming in, that number can move. If more money lands on one side, the book adjusts to attract bets on the other side and balance their risk.

Movement comes from two main sources. Public action — lots of small bets on a popular team — can nudge a line slightly. Sharp action — large bets from bettors the book respects — can move it more aggressively. Injury news, weather changes, and starting-lineup announcements also force mid-day moves.

Tracking how far and in what direction a line moves tells you where the market's confidence is. A line that opens Lakers -4 and closes Lakers -6 means steam built up on Los Angeles. A line that moves against the public usually means sharp money hit the other way.`,
    example: "The Cowboys open at -3 on Monday. By Wednesday, the line is -3.5. By Sunday morning, it's -4. That two-day climb, especially the half-point move through 3 (a key number in football), signals real money on Dallas. Somebody liked that side enough to force the adjustment.",
    decisionContext: "Line movement isn't a pick — it's information. A line that moves sharply toward one side is the market telling you where respected money is going. A line that holds steady despite heavy public betting is the market telling you the book isn't worried about exposure. Reading these signals doesn't guarantee a winner, but it sharpens the picture. Your decision is always yours.",
    faqs: [
      { q: "What's a 'steam move'?", a: "A fast, aggressive line move driven by sharp bettors hitting multiple books at once. If you see a spread jump a full point in minutes, that's steam." },
      { q: "What's reverse line movement?", a: "When the line moves opposite to where the public is betting. If 75% of bets are on Team A but the line moves toward Team B, a smaller number of larger sharp bets are on Team B." },
      { q: "How do I know if a line has moved?", a: "Most sportsbooks show the opening line somewhere, and line-tracking sites post opening vs current numbers. If the current line is different, that gap is the movement." },
      { q: "Does movement mean I should follow the sharp side?", a: "It's a signal, not a rule. Understanding why a line moved — injury, lineup, model update — matters more than the move itself." },
    ],
    relatedSlugs: ["what-is-sharp-money", "what-is-closing-line-value", "what-does-public-on-one-side-mean"],
  },
  {
    slug: "what-is-sharp-money",
    title: "What Is Sharp Money in Sports Betting?",
    metaDescription: "Sharp money is professional betting action that moves lines. Here's how to spot it and what the signal actually means.",
    directAnswer: "Sharp money is betting action from professionals — people who move sportsbook lines by making large, informed wagers.",
    explanation: `Sportsbooks see every bet that comes through, and they quickly learn which bettors win consistently. Those bettors are sharps. Their action is treated differently than the general public — books limit their bet size, move lines faster when they bet, and use their wagers as data.

When a sharp places a big bet on one side of a game, books adjust the line to protect themselves. That's why lines move more on sharp action than on the same dollar amount from casual bettors. The book respects the bet.

The opposite is public money — lots of small bets from recreational bettors. Books don't adjust as aggressively for public action because they know public bettors don't win at a sustained rate. The dollar volume might be similar, but the line sensitivity is very different.`,
    example: "A college football game opens at Alabama -7. Through the morning, 78% of the bets are on Alabama, but the line drops to -6.5. That's sharp money on the underdog. The public is loading up on Alabama, but the book is moving the line toward Auburn anyway — because a smaller number of much larger bets just came in on the other side.",
    decisionContext: "Sharp money is a signal, not a strategy. Seeing where sharps are betting tells you something about market consensus among winners, but it doesn't tell you why — and the 'why' is what matters. If a sharp bet an underdog because they saw a key player ruled out, you can see that same news and decide for yourself. Following sharps blindly means paying the worse number after the move. Your decision is always yours.",
    faqs: [
      { q: "How do sharps actually win?", a: "Models, specialized information, and access to multiple books for line shopping. Most sharps focus on a narrow set of markets where they have a defensible edge." },
      { q: "Can a normal bettor bet like a sharp?", a: "You can use their principles — discipline, line shopping, avoiding high-juice markets, tracking closing line value. Replicating their information and scale is much harder." },
      { q: "Where can I see what sharps are betting?", a: "Public data is limited. Some services claim to track sharp action; most are inferring from line movement and public betting percentages." },
      { q: "What's a 'square' bettor?", a: "Industry slang for a recreational, non-winning bettor — the opposite of a sharp. Most bettors are squares, which is how sportsbooks stay profitable." },
    ],
    relatedSlugs: ["what-does-line-movement-mean", "what-is-closing-line-value", "what-does-public-on-one-side-mean"],
  },
  {
    slug: "what-is-closing-line-value",
    title: "What Is Closing Line Value?",
    metaDescription: "Closing line value measures whether you bet at a better number than the market settled on. Here's why it predicts long-term profit.",
    directAnswer: "Closing line value is the gap between the line you bet and the line at game time — beating the closing number consistently is one of the strongest indicators that you're betting well.",
    explanation: `The closing line is the final price a sportsbook posts right before a game starts. It reflects all the information and money the market has absorbed. In the long run, closing lines are the most accurate prediction the market produces.

If you bet a team at -3 and the line closes at -4, you beat the close by a point. That's closing line value. If you bet at -4 and the line closes at -3, you got worse than the close.

Professional bettors track CLV obsessively because it's a measurable sign they're spotting things the market will later price in. You can win a bet and still have bad CLV — or lose a bet and still have good CLV. Over hundreds of wagers, CLV predicts long-term profit more reliably than win-loss record alone.`,
    example: "You bet the Warriors -2.5 on Thursday morning. By tipoff Saturday night, the line has moved to -4. You beat the close by 1.5 points. Even if Golden State loses outright and your bet loses, you identified a mispriced line — the market eventually agreed with you.",
    decisionContext: "Closing line value flips the usual question. Instead of 'did I win?' it asks 'did I bet at a better number than the market settled on?' If yes, you're likely finding value, and wins will follow over large samples. If consistently no, your process needs work — even if you're winning in the short term, variance will catch up. Your decision is always yours.",
    faqs: [
      { q: "How do I track CLV?", a: "Log the line you bet and the closing line for each wager and compare them. A simple spreadsheet works — most tracking tools do this automatically." },
      { q: "How much CLV is meaningful?", a: "Consistently beating the close by even half a point is significant over hundreds of bets. A full point of average CLV puts you in serious territory." },
      { q: "Can you have negative CLV and still profit?", a: "Short term, yes — variance swings both ways. But consistently getting worse numbers than the close is a leading indicator of long-term losses." },
      { q: "Why does CLV matter more than win rate?", a: "Win rate is noisy over small samples; CLV is a direct measure of whether you're beating the market's final read. Short-term wins can come from luck — consistent CLV can't." },
    ],
    relatedSlugs: ["what-is-sharp-money", "what-does-line-movement-mean", "what-is-line-shopping"],
  },
  {
    slug: "what-does-taken-off-the-board-mean",
    title: "What Does It Mean When a Game Is Taken Off the Board?",
    metaDescription: "When a sportsbook pulls a game, something material just changed. Here's what it means and how to read the move.",
    directAnswer: "A game is taken off the board when the sportsbook stops accepting bets on it — usually because of breaking news the book hasn't had time to price in.",
    explanation: `Sportsbooks are supposed to price every game accurately. When something happens that they can't immediately account for — a star player ruled out at warmup, a sudden weather front, a lineup leak — they pull the game entirely rather than post a number they know is wrong.

You'll see it listed as 'off' or 'OTB' in the odds feed. No line, no bets accepted. Once the book has enough information to re-price confidently, the game goes back up, often at a very different number.

Games coming off the board mid-day usually mean something big. Long pre-game absences, injury questions, or officials-late-changes are the common culprits. It's a rare enough event that when it happens, it's worth paying attention to why.`,
    example: "Tuesday afternoon, the Suns vs Timberwolves game is trading at Phoenix -4. An hour before tipoff, news breaks that Kevin Durant is a late scratch. The line goes off the board for 15 minutes. When it comes back, Phoenix is -1. The book needed time to reprice a four-point market swing.",
    decisionContext: "A game coming off the board is the market telling you something material just changed. When it returns, the new line is the book's best guess at the post-news number. If you already had a bet in before it came down, you either got lucky or you're now on the wrong side of fresh information. Either way, it's a moment to reassess — not to chase. Your decision is always yours.",
    faqs: [
      { q: "Does my bet still count if the game comes off the board?", a: "Yes, if you already placed it. Taking the game off the board stops new bets, but existing bets are locked in at the price you got." },
      { q: "How long does a game stay off the board?", a: "Usually minutes to an hour — long enough for the book to verify the news and recalculate. Major last-minute changes can take longer." },
      { q: "Can I cancel my bet if the game goes off?", a: "No. Once a bet is placed and confirmed, it stands." },
      { q: "What's the difference between 'off the board' and a suspended market?", a: "Slightly different wording, same idea. Both mean no new bets are accepted until the book reopens the market." },
    ],
    relatedSlugs: ["how-injuries-affect-betting-lines", "what-does-line-movement-mean", "what-is-sharp-money"],
  },
  {
    slug: "how-do-sportsbooks-make-money",
    title: "How Do Sportsbooks Make Money?",
    metaDescription: "Sportsbooks don't need to pick winners to profit — they charge juice and balance their books. Here's how the model actually works.",
    directAnswer: "Sportsbooks make money by charging juice on every bet and balancing their exposure across both sides — when it works, they profit regardless of who wins.",
    explanation: `The core model is simple. Books set a line that attracts roughly equal money on both sides of a bet. Each side pays a small fee (the juice) for the privilege. When two opposing bettors each put $110 on a -110 line, the book takes in $220 and pays out $210 to the winner. The $10 difference is pure book margin.

Multiply that across millions of bets per week, across thousands of games, and the margin compounds into real revenue. Industry hold rates run around 4 to 8 percent of total money wagered — that's how much of every dollar bet ultimately stays with the book.

When money comes in unevenly, books adjust lines to rebalance. If everyone bets the favorite, the line shifts to make the underdog more appealing. The goal is never to pick winners — it's to stay balanced enough that juice does the work.`,
    example: "On a Celtics-Raptors game, $50,000 is bet on Boston -6 and $50,000 on Toronto +6, both at -110. The book collects $100,000 in total stakes. The winners get back $95,238 combined — their $50K stake plus $45,238 profit. The book keeps $4,762 — its margin on the balanced action, regardless of who covered.",
    decisionContext: "Understanding the business model reframes how you approach betting. The book isn't picking against you — it's charging you to bet, win or lose. To beat it long-term, you don't need to be right most of the time. You need to be right often enough to overcome the juice. That bar is higher than 50%, and it rewards patience, line shopping, and process over intuition. Your decision is always yours.",
    faqs: [
      { q: "Do sportsbooks always want balanced action?", a: "Usually, but not always. Sometimes they take a position — accepting an imbalance they believe is priced wrong — but that's rarer than the standard balance-and-collect-juice model." },
      { q: "What's a sportsbook's 'hold'?", a: "The percentage of total bets the book keeps as profit. An industry hold of 7% means for every $100 bet, the book nets $7 after paying out winners." },
      { q: "Why do books limit winning bettors?", a: "Winners break the balanced-action model. If a bettor consistently beats the closing line, limits protect the book's margin." },
      { q: "Is it legal for books to refuse winning bettors?", a: "In most jurisdictions, yes — private businesses can decline action. Exact rules vary by state and country." },
    ],
    relatedSlugs: ["what-is-juice-or-vig", "what-is-a-parlay-bet", "what-is-line-shopping"],
  },
  {
    slug: "what-is-a-two-way-market",
    title: "What Is a Two-Way Market?",
    metaDescription: "Two-way markets have exactly two outcomes and tighter pricing. Here's how they differ from three-way markets in soccer and hockey.",
    directAnswer: "A two-way market is a bet with exactly two possible outcomes — one side wins, the other loses, and there's no third option.",
    explanation: `Every point spread is a two-way market. So is every over/under. So is most moneylines in American sports where ties are rare or impossible. You pick one side, you get paid or you don't — clean binary outcome.

The opposite is a three-way market, most common in soccer. There you can bet the home team, the away team, or the draw as three separate outcomes. A moneyline in soccer is usually a three-way market because ties are common. The same bet in the NFL is two-way because ties are rare.

Two-way markets are generally easier to understand, easier to price, and offer tighter juice. Three-way markets spread the total probability across three outcomes, which means the individual prices look different from a two-way bet on the same game.`,
    example: "An NBA game between the Heat and Hawks has a moneyline of Miami -135, Atlanta +115. That's two-way — a winner must emerge. Compare to a Premier League match with Liverpool +120, Draw +240, Chelsea +230. That's three-way — the draw is its own outcome you can bet independently.",
    decisionContext: "When you're evaluating a line, knowing whether the market is two-way or three-way changes how you read the prices. A two-way moneyline's two numbers should add to roughly -220 or -240 when you translate them, accounting for juice. A three-way market's three numbers need to translate into probabilities that add up past 100% by the book's margin. Understanding that math helps you spot unusually priced or unusually juicy markets. Your decision is always yours.",
    faqs: [
      { q: "Why aren't all bets two-way?", a: "Some sports produce ties too often to price cleanly as win-or-lose. Soccer and hockey (in regulation) are the main examples." },
      { q: "Are two-way markets always cheaper to bet?", a: "Usually yes. Two-way books commonly run 4–5% juice; three-way can be 6–8% because the book is pricing three outcomes instead of two." },
      { q: "What happens if a two-way market has a push?", a: "Most books refund your stake. Exact behavior depends on the book and the market — always check." },
      { q: "Can I convert a three-way market into a two-way?", a: "Some books offer 'Draw No Bet' or 'double chance' lines that combine draw outcomes with a team, effectively making the market two-way at different prices." },
    ],
    relatedSlugs: ["what-is-a-moneyline-bet", "how-does-a-point-spread-work", "how-do-sportsbooks-make-money"],
  },
  {
    slug: "what-is-implied-probability",
    title: "What Does Implied Probability Mean?",
    metaDescription: "Implied probability translates betting odds into win percentages. Here's the formula and how to use it to compare against your own read.",
    directAnswer: "Implied probability is the win percentage a betting line is telling you — converting the odds into a number you can compare against your own estimate.",
    explanation: `Every price carries an implied probability. A -200 favorite, in a no-juice world, is the market saying this team wins about 67% of the time. A +150 underdog is saying about 40%. The formulas are simple: for minus odds, the implied probability is (odds) ÷ (odds + 100). For plus odds, it's 100 ÷ (odds + 100).

Because books add juice, implied probabilities from real-world odds don't sum to exactly 100% on a two-way market — they sum to 104 or 105% depending on the hold. Strip out the juice, and you get the market's clean probability estimate.

The real power of implied probability is comparison. You can size up a line against your own read of the game. If you think a team wins 55% of the time and the implied probability is 48%, that's a gap. If you think it's 45% and the market says 48%, the book's read is better than yours.`,
    example: "The Mavericks are -180 tonight against the Pelicans. Implied probability: 180 ÷ 280 = 64%. Your own read, after reviewing the injury report and recent form, is that Dallas wins about 60% of the time. That's a 4-point gap against you — the market is pricing the Mavericks more heavily than your data supports. Passing or betting the other side might be the reasonable call.",
    decisionContext: "Implied probability turns betting lines from numbers into beliefs. The market is making a claim about how often an outcome happens. Your job as a bettor is to form your own claim and compare. When they match, there's no reason to bet. When yours is stronger, that's where potential value lives. When the market's is stronger, save your money. Your decision is always yours.",
    faqs: [
      { q: "Why don't implied probabilities add up to 100%?", a: "Because the juice is baked in. A -110/-110 spread implies 52.4% on each side, summing to 104.8% — that overage is the book's margin." },
      { q: "Is there an easy way to calculate implied probability?", a: "For minus odds, think of the number as 'how much to risk to win 100,' then divide. For plus odds, it's 100 divided by (odds + 100)." },
      { q: "How do I know if my own probability estimate is good?", a: "Track it. Write down your predicted probability before every bet and compare your hit rate to your predictions over 100+ bets." },
      { q: "Does implied probability apply to totals?", a: "Yes. Every side of every market has an implied probability — the over at -110 is implying a 52.4% chance before juice." },
    ],
    relatedSlugs: ["what-does-minus-110-mean", "what-does-plus-150-mean", "what-is-a-moneyline-bet"],
  },
  {
    slug: "how-to-know-if-spread-is-too-high",
    title: "How Do You Know If a Spread Is Too High?",
    metaDescription: "Spreads inflate when the market overreacts to narratives. Here's how to spot a stretched line before you bet the wrong side.",
    directAnswer: "A spread is likely too high when the market has overreacted to obvious narratives — a popular team getting heavy public action, a blowout from last week, or a big name returning from injury.",
    explanation: `Sportsbooks don't set lines by modeling alone. They set lines to attract roughly equal money on both sides. When public perception is lopsided — everyone assuming a popular team will blow out an unpopular one — books push the spread wider than the matchup actually warrants. That's where inflated lines live.

Common signals that a spread is stretched: a nationally recognized team laying more than six points at home without a proven matchup advantage, a favorite coming off a highlight win against a weaker opponent, a spread that widened after a lineup announcement without the injury actually mattering much to the outcome.

The opposite is also true. Spreads can be too small when key injuries or matchup factors aren't fully reflected yet. Reading a spread well means knowing when the number reflects real advantages and when it reflects narrative.`,
    example: "The Chiefs are -8.5 at home against the Broncos after blowing Denver out 38-10 two weeks ago. Public money is piling on Kansas City. But Denver's defense has adjusted schemes since that game, their starting quarterback is back from a one-week absence, and the Chiefs' offensive line is banged up. -8.5 on a division road rematch feels more like a lazy line than a sharp one.",
    decisionContext: "When you suspect a spread is too high, the question isn't 'will the favorite cover?' — it's 'is the gap between these teams really the size the number is claiming?' If your read on the actual matchup gap is smaller than the spread, you have a reason to look at the underdog. If the gap actually matches the spread despite the narrative, pass. Your decision is always yours.",
    faqs: [
      { q: "What does 'inflated line' mean?", a: "A line wider than the actual matchup warrants, usually because of public perception or recency bias. The favorite looks bigger on paper than the game will actually play." },
      { q: "Should I always fade popular teams?", a: "No — 'fade the public' as a blanket rule ignores when the public is right. The useful move is checking whether the line reflects real matchup factors or just name recognition." },
      { q: "How do I know if it's narrative or reality?", a: "Look at the specifics — rest differential, injury reports, lineup changes, tactical adjustments. If the line feels driven by one big recent game rather than the full picture, it's probably stretched." },
      { q: "Do sharps bet against inflated spreads?", a: "Often. Sharp money is a common source of reverse line movement — the public loads one way, sharps go the other, and the line moves against the public." },
    ],
    relatedSlugs: ["how-does-a-point-spread-work", "what-does-line-movement-mean", "what-is-sharp-money"],
  },
  {
    slug: "what-to-look-for-betting-a-total",
    title: "What Should You Look For Before Betting a Total?",
    metaDescription: "Totals come down to pace, matchup quality, injuries, and weather. Here's the specific checklist to run before you bet.",
    directAnswer: "Before betting a total, check pace, pitching or defense quality, injuries to key offensive players, weather (for outdoor sports), and where the line has moved since it opened.",
    explanation: `Totals are about scoring environment, not winners. The line reflects the market's expectation for combined points. To decide whether it's too high or too low, you need a feel for what actually drives scoring in tonight's game.

In the NBA, pace and rest matter more than most bettors realize. A fast-paced team on fresh legs produces more possessions and more points. An injury to a key ball-handler usually slows the pace for that team's offense. In baseball, it's the starting pitcher matchup, bullpen fatigue, ballpark factors, and weather. In football, weather (wind especially), injuries to skill players, and defensive matchups drive it.

Also read the line itself. A total that opened 224.5 and moved to 228 is the market absorbing information. Ask why it moved — that why is more useful than the number alone.`,
    example: "A Nuggets-Warriors game has an opening total of 238. By gametime it's 233.5. The move is driven by a Steph Curry game-time decision. If Curry plays, the total feels right at 238. If he sits, 233.5 is probably still too high — Golden State without Curry is a meaningfully different offense, and the market may have only partially adjusted. The bet, if there is one, lives in reading whether the adjustment went far enough.",
    decisionContext: "A total is a statement about pace and efficiency. Evaluating it means understanding what produces scoring in the specific game, not betting your feeling about whether teams 'like to score.' Check pace metrics, injuries to volume scorers or top defenders, weather if it applies, and how the line has moved. When the market's read lines up with yours, there's no edge. When it doesn't, that's where to look. Your decision is always yours.",
    faqs: [
      { q: "Does pace always predict over/under?", a: "It's the biggest single factor in basketball totals, but not everything. Efficiency, three-point variance, and foul-heavy referees can pull a fast game under or a slow game over." },
      { q: "How much does weather affect football totals?", a: "Wind is the biggest factor — sustained winds over 15–20 mph reduce passing efficiency and field-goal accuracy. Rain and snow matter less than most bettors think unless they're extreme." },
      { q: "What are 'overs bettors' and 'unders bettors'?", a: "Shorthand for bettors who psychologically prefer one direction. Unders bettors tend to be sharper on average because rooting for scoring is more emotionally satisfying, which pushes public money toward the over." },
      { q: "Why do totals move differently from spreads?", a: "Spreads balance action between two teams; totals balance action between two scoring environments. A strong-side injury might drop a spread without moving the total much." },
    ],
    relatedSlugs: ["what-does-over-under-mean", "how-injuries-affect-betting-lines", "what-does-line-movement-mean"],
  },
  {
    slug: "what-does-public-on-one-side-mean",
    title: "What Does It Mean When the Public Is on One Side?",
    metaDescription: "Heavy public action is a signal, not a verdict. Here's how to read lopsided public betting percentages without getting misled.",
    directAnswer: "When the public is on one side, most of the casual betting money is piling onto that team or total — and that imbalance usually says more about popularity than about the bet's actual value.",
    explanation: `'The public' refers to recreational bettors — the large volume of smaller bets that sportsbooks see on every game. When 75% or 80% of bets come in on one side, that's a lopsided public. Books publish these percentages, and bettors use them as signals.

The useful thing isn't that the public is usually wrong — long-term, the public wins close to 50% of the time on spread and total bets, just not often enough to overcome the juice. What matters is the direction of the money. If public action is piling in on Team A but the line moves toward Team B, that gap tells you sharp bettors are taking the other side in large enough amounts to offset the public volume.

That combination — heavy public action plus line movement against it — is called reverse line movement. It's one of the more reliable signals that sharp money has an opinion.`,
    example: "The Lakers are getting 82% of the bets against the Kings. The line opened Lakers -4.5 and has moved to Lakers -3.5. That's textbook reverse line movement. Public money is drowning one side, but the line is moving the other direction — which means somebody is betting very large amounts on Sacramento. The book is moving the line to protect itself from a smaller number of much larger sharp bets.",
    decisionContext: "Public percentages by themselves are weak signals — the public can be right, and often is on obvious matchups. What's useful is watching how the line responds to public pressure. A line that holds or moves against heavy public action is telling you something. A line that follows public money is just following the herd. Read the gap between public direction and line direction. Your decision is always yours.",
    faqs: [
      { q: "Where do public betting percentages come from?", a: "Sportsbooks release aggregate data showing what percentage of bets (and sometimes money) is on each side. Third-party sites publish and track it." },
      { q: "What's the difference between 'public bets' and 'public money'?", a: "Bets is count — how many wagers landed on each side. Money is dollar volume. Big gaps between bets and money usually means sharp action on the smaller-count side." },
      { q: "Is the public ever right?", a: "Frequently. The public is right more often than it's wrong — just not often enough to overcome the juice." },
      { q: "What's 'chalk'?", a: "Betting slang for the favorite. 'Public is on the chalk' means casual bettors are loading up on the favored side." },
    ],
    relatedSlugs: ["what-is-sharp-money", "what-does-line-movement-mean", "what-is-closing-line-value"],
  },
  {
    slug: "how-injuries-affect-betting-lines",
    title: "How Do Injuries Affect Betting Lines?",
    metaDescription: "Injuries move lines in proportion to impact — not counting stats. Here's how to read injury-driven line movement.",
    directAnswer: "Injuries move betting lines in proportion to how much the missing player actually impacts winning — star absences cause big moves, depth-player absences barely register.",
    explanation: `Sportsbooks price games based on rosters. When a key player is ruled out, the line adjusts to reflect the reduced team quality on that side. A top-five NBA player's absence can move a spread by five or six points. A marginal starter's absence might move it a half-point or nothing at all.

The size of the move depends on two things: how much the player produces in winning outcomes (not just in counting stats), and how replaceable they are. A high-volume scorer on a team with no offensive backup causes a bigger swing than a high-scorer on a deep team. A starting pitcher in baseball moves the total more than the run line — his replacement affects how many runs get scored more than who wins.

Breaking injury news is where most pre-game line movement comes from. The earlier you see it, the better your number will be. Late scratches at warmup often cause games to come off the board for minutes while books reprice.`,
    example: "A Bucks-Heat game opens Milwaukee -5.5. An hour before tip, Giannis Antetokounmpo is downgraded from questionable to out. The line drops to Milwaukee -2.5 within minutes. That three-point swing is the market estimating Giannis's full impact — defensive anchor, rim pressure, and transition offense all lost in one absence.",
    decisionContext: "Injury impact isn't just about stats. It's about how the team's style and structure change with and without the player. A scoring wing out of a balanced offense might move the line three points. The same player out of an offense that relies entirely on him might move it six. When evaluating an injury's effect, ask not 'how much does he score?' but 'how differently does this team play without him?' Your decision is always yours.",
    faqs: [
      { q: "How fast do lines move on injury news?", a: "Within minutes, depending on severity and book. Major star news often takes games off the board while books reprice." },
      { q: "What counts as a 'key' injury?", a: "A player who materially affects win probability. Stars always qualify; role players qualify if the starter is already hurt or the system depends on them." },
      { q: "Do injuries affect totals or just spreads?", a: "Both, in different ways. Spread moves capture who wins; total moves capture how much scoring changes." },
      { q: "Can I profit from injury news?", a: "If you see it before the line adjusts, yes. The window is small — books respond in minutes, and being set up with live odds feeds is how bettors capture injury value." },
    ],
    relatedSlugs: ["what-does-line-movement-mean", "what-does-taken-off-the-board-mean", "how-to-know-if-spread-is-too-high"],
  },
  {
    slug: "what-is-line-shopping",
    title: "What Is Line Shopping and Why Does It Matter?",
    metaDescription: "Line shopping means comparing the same bet across books and taking the best number. It's the clearest edge a casual bettor has.",
    directAnswer: "Line shopping is comparing the same bet across multiple sportsbooks and placing it at whichever offers the best price.",
    explanation: `Different sportsbooks post slightly different lines on the same game. One book might have Lakers -5, another -5.5, another -4.5. These gaps are small per bet but enormous over time — getting -4.5 instead of -5.5 on a single spread bet is a full-point advantage, which converts to real money over hundreds of wagers.

The same logic applies to every market. Moneyline prices differ. Totals differ. Player prop lines vary even more widely because they're priced less efficiently. Professional bettors have accounts at many books and route each bet to the best available number.

You're not doing anything sneaky — this is how books compete. Their margins are built on the assumption that most bettors stay loyal to one book. Shopping a line can turn a losing bet into a push, or a push into a win, just by getting the better number.`,
    example: "You want to bet the Chiefs -3.5 against the Dolphins. Book A has -3.5 at -110. Book B has -3 at -115. Book C has -3.5 at -105. You bet at Book C. The Chiefs win by exactly 4. At Books A and C you win. At Book B (priced at -3), you'd have also won, but you also got cheaper juice at C (-105 means you risked less per dollar of win). Same bet, different profit — the gap pays you for shopping.",
    decisionContext: "Line shopping is one of the few clear, no-downside edges a casual bettor has over the book. It doesn't require picking more winners or outsmarting anyone — it just requires the discipline to check prices before betting. Over a full season, the difference between the best available number and the first number you see can be several percentage points of profit. The sharpest bettors treat line shopping as non-optional. Your decision is always yours.",
    faqs: [
      { q: "How many books should I have accounts at?", a: "At least three. Different books specialize in different markets, and more outlets means more chances to find the best number." },
      { q: "Is line shopping worth the effort?", a: "Yes. Getting a better number on half your bets turns a breakeven bettor into a profitable one over time — ignoring price differences is leaving money on the table." },
      { q: "Where can I compare lines?", a: "Odds aggregator sites show lines across major books in real time. Checking two or three books before betting takes under a minute." },
      { q: "Do books ban people for line shopping?", a: "No. Shopping lines is standard. What gets accounts limited is consistently beating the closing line — a sign you're winning long-term." },
    ],
    relatedSlugs: ["what-is-juice-or-vig", "how-do-sportsbooks-make-money", "what-is-closing-line-value"],
  },
];

/** Look up an article by its slug. Returns null when not found. */
export function getLearnArticle(slug: string): LearnArticle | null {
  return LEARN_ARTICLES.find((a) => a.slug === slug) ?? null;
}
