# Tank01 Data Verification Process
*RawIntel internal — updated May 2026*

## What Tank01 gets wrong
Injury statuses go stale fastest — especially during NBA playoffs when rosters change game-to-game. Player availability marked "questionable" or "expected to play" can be hours old by tip-off. Lineup data and starter confirmations are the next highest risk.

## What the system already does
The breakdown prompt uses "if confirmed" framing for any unverified player status and auto-sets confidence to FRAGILE when multiple players have unverified availability. This is the primary defense.

## What you do before a Clear Spot breakdown publishes
For any Clear Spot breakdown involving a player with questionable/probable status: cross-check Tank01's injury return against one live source (ESPN gamecast, official team injury report, or beat reporter on X) before the breakdown goes out. If they conflict, downgrade to FRAGILE. Don't override the data — flag the uncertainty.

## If a user reports a factual error
1. Pull the breakdown and check the Tank01 response that generated it
2. If the stat was wrong: acknowledge it directly, update the breakdown if the game hasn't started
3. Log it — date, game, field that was wrong
4. If it happens twice in a week, audit the Tank01 endpoint for that data type

## The rule
A FRAGILE read is forgivable. A Clear Spot built on a wrong fact is not. When in doubt, downgrade.
