/**
 * BallDontLie API — data quality test
 * Run: node test-bdl.mjs
 *
 * Looking for:
 *   NBA injuries: Embiid (PHI), Edwards (MIN), DiVincenzo (MIN), Dosunmu (MIN)
 *   NBA roster:   Sochan on NYK
 *   MLB probable pitchers: Holmes (NYM), Gausman (TOR) — expect unconfirmed
 */

const API_KEY = "a601ed3c-282a-4281-b228-5d83f2223be6";
const BASE    = "https://api.balldontlie.io/v1";
const TODAY   = "2026-05-04";

const HEADERS = {
  Authorization: API_KEY,
  "Content-Type": "application/json",
};

const TARGET_INJURIES = ["embiid", "edwards", "divincenzo", "dosunmu"];
const TARGET_MLB      = ["holmes", "gausman"];

// ── helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hit(label, url) {
  await sleep(800); // stay well under rate limit

  console.log(`\n${"─".repeat(72)}`);
  console.log(`▶ ${label}`);
  console.log(`  ${url}`);
  console.log("─".repeat(72));

  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();

  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  console.log(`  HTTP ${res.status} ${res.statusText}`);

  if (!res.ok) {
    console.log("  RAW BODY:", text);
    return null;
  }

  console.log(JSON.stringify(json, null, 2));
  return json;
}

// ── NBA: injuries ──────────────────────────────────────────────────────────

async function testNBAInjuries() {
  // BDL v1 uses /injuries (no /nba/ prefix)
  const data = await hit(
    "NBA INJURIES — full list",
    `${BASE}/injuries?per_page=100`
  );

  if (!data?.data) return;

  console.log("\n── INJURY TARGETS ───────────────────────────────────────────");
  const matches = data.data.filter((r) => {
    const last = (r.player?.last_name ?? "").toLowerCase();
    const full = (r.player?.first_name ?? "" + " " + (r.player?.last_name ?? "")).toLowerCase();
    return TARGET_INJURIES.some((t) => last.includes(t) || full.includes(t));
  });

  if (matches.length) {
    console.log(`Found ${matches.length} target player(s):`);
    matches.forEach((r) => console.log(" •", JSON.stringify(r, null, 4)));
  } else {
    console.log("  None of the target players found in injury list.");
    console.log(`  Total entries returned: ${data.data.length}`);
    if (data.data.length > 0) {
      console.log("  First 5 entries for field-shape reference:");
      data.data.slice(0, 5).forEach((r) => console.log(" •", JSON.stringify(r, null, 4)));
    }
  }

  // Check if there are more pages
  if (data.meta?.next_cursor) {
    console.log(`\n  NOTE: Results are paginated. next_cursor = ${data.meta.next_cursor}`);
    console.log("  Fetching page 2...");
    const page2 = await hit(
      "NBA INJURIES — page 2",
      `${BASE}/injuries?per_page=100&cursor=${data.meta.next_cursor}`
    );
    if (page2?.data) {
      const p2matches = page2.data.filter((r) => {
        const last = (r.player?.last_name ?? "").toLowerCase();
        return TARGET_INJURIES.some((t) => last.includes(t));
      });
      if (p2matches.length) {
        console.log("  Page 2 targets found:");
        p2matches.forEach((r) => console.log(" •", JSON.stringify(r, null, 4)));
      }
    }
  }
}

// ── NBA: NYK roster → look for Sochan ─────────────────────────────────────

async function testNYKRoster() {
  // Step 1: find NYK team ID
  const teamsData = await hit(
    "NBA TEAMS — full list",
    `${BASE}/teams`
  );

  let nykId = null;
  if (teamsData?.data) {
    const nyk = teamsData.data.find(
      (t) =>
        t.abbreviation === "NYK" ||
        (t.name ?? "").toLowerCase().includes("knick") ||
        (t.full_name ?? "").toLowerCase().includes("knick")
    );
    nykId = nyk?.id ?? null;
    console.log(`\n── NYK record: ${JSON.stringify(nyk)} → id = ${nykId}`);
  }

  if (!nykId) {
    console.log("  Could not find NYK — skipping roster check.");
    return;
  }

  // Step 2: active players on NYK
  const rosterData = await hit(
    `NBA PLAYERS — NYK (team_ids[]=${nykId})`,
    `${BASE}/players/active?team_ids[]=${nykId}&per_page=100`
  );

  // Fallback: try /players if /players/active doesn't exist
  let roster = rosterData;
  if (!roster?.data) {
    roster = await hit(
      `NBA PLAYERS (fallback) — NYK`,
      `${BASE}/players?team_ids[]=${nykId}&per_page=100`
    );
  }

  if (!roster?.data) return;

  console.log("\n── SOCHAN SEARCH ────────────────────────────────────────────");
  const sochan = roster.data.filter((p) =>
    (p.last_name ?? p.name ?? "").toLowerCase().includes("sochan")
  );

  if (sochan.length) {
    console.log("  Sochan found on NYK:");
    sochan.forEach((p) => console.log(" •", JSON.stringify(p, null, 4)));
  } else {
    console.log("  Sochan NOT found on NYK.");
    console.log(`  Total NYK players returned: ${roster.data.length}`);
    console.log("  Full NYK roster (names only):");
    roster.data.forEach((p) =>
      console.log(`    ${p.first_name ?? ""} ${p.last_name ?? p.name ?? ""}`.trim())
    );
  }
}

// ── MLB: probable pitchers ─────────────────────────────────────────────────

async function testMLBProbablePitchers() {
  // BDL may not have MLB at all — probe a few candidates
  const candidates = [
    { label: "MLB games today",             url: `${BASE}/mlb/games?date=${TODAY}` },
    { label: "MLB probable pitchers",       url: `${BASE}/mlb/probable_pitchers?date=${TODAY}` },
    { label: "MLB game starters",           url: `${BASE}/mlb/game_starters?date=${TODAY}` },
    { label: "MLB player stats — pitching", url: `${BASE}/mlb/player_stats?date=${TODAY}&per_page=50` },
    { label: "MLB stats",                   url: `${BASE}/mlb/stats?date=${TODAY}&per_page=50` },
  ];

  let found = null;
  for (const c of candidates) {
    const data = await hit(c.label, c.url);
    if (data && !data.error) { found = { ...c, data }; break; }
  }

  if (!found) {
    console.log("\n── MLB RESULT ───────────────────────────────────────────────");
    console.log("  No MLB endpoints responded successfully.");
    console.log("  BallDontLie may not include MLB data on this tier.");
    return;
  }

  console.log("\n── MLB PITCHER TARGETS ──────────────────────────────────────");
  const raw = JSON.stringify(found.data).toLowerCase();
  TARGET_MLB.forEach((name) => {
    const present = raw.includes(name);
    console.log(`  ${present ? "✓" : "✗"} ${name}: ${present ? "FOUND" : "NOT found"}`);
  });
}

// ── run ────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n${"═".repeat(72)}`);
  console.log("  BALLDONTLIE API — DATA QUALITY TEST");
  console.log(`  Date: ${TODAY}  |  Base: ${BASE}`);
  console.log(`${"═".repeat(72)}`);

  await testNBAInjuries();
  await testNYKRoster();
  await testMLBProbablePitchers();

  console.log(`\n${"═".repeat(72)}`);
  console.log("  DONE");
  console.log(`${"═".repeat(72)}\n`);
})();
