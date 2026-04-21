/**
 * Abbreviation → full team name lookups for NBA and MLB.
 * Used to rehydrate display names for legacy cached breakdowns that were
 * generated before the game_snapshot column existed. Multiple abbreviations
 * map to the same team (e.g. GS / GSW, NO / NOP, CWS, etc.) because Tank01,
 * the Odds API, and the MLB Stats API disagree on a handful.
 */

export interface TeamNames {
  city: string;
  nickname: string;
  full: string;
}

const NBA: Record<string, TeamNames> = {
  ATL: { city: "Atlanta",        nickname: "Hawks",          full: "Atlanta Hawks" },
  BOS: { city: "Boston",         nickname: "Celtics",        full: "Boston Celtics" },
  BKN: { city: "Brooklyn",       nickname: "Nets",           full: "Brooklyn Nets" },
  BRK: { city: "Brooklyn",       nickname: "Nets",           full: "Brooklyn Nets" },
  CHA: { city: "Charlotte",      nickname: "Hornets",        full: "Charlotte Hornets" },
  CHO: { city: "Charlotte",      nickname: "Hornets",        full: "Charlotte Hornets" },
  CHI: { city: "Chicago",        nickname: "Bulls",          full: "Chicago Bulls" },
  CLE: { city: "Cleveland",      nickname: "Cavaliers",      full: "Cleveland Cavaliers" },
  DAL: { city: "Dallas",         nickname: "Mavericks",      full: "Dallas Mavericks" },
  DEN: { city: "Denver",         nickname: "Nuggets",        full: "Denver Nuggets" },
  DET: { city: "Detroit",        nickname: "Pistons",        full: "Detroit Pistons" },
  GS:  { city: "Golden State",   nickname: "Warriors",       full: "Golden State Warriors" },
  GSW: { city: "Golden State",   nickname: "Warriors",       full: "Golden State Warriors" },
  HOU: { city: "Houston",        nickname: "Rockets",        full: "Houston Rockets" },
  IND: { city: "Indiana",        nickname: "Pacers",         full: "Indiana Pacers" },
  LAC: { city: "LA",             nickname: "Clippers",       full: "LA Clippers" },
  LAL: { city: "Los Angeles",    nickname: "Lakers",         full: "Los Angeles Lakers" },
  MEM: { city: "Memphis",        nickname: "Grizzlies",      full: "Memphis Grizzlies" },
  MIA: { city: "Miami",          nickname: "Heat",           full: "Miami Heat" },
  MIL: { city: "Milwaukee",      nickname: "Bucks",          full: "Milwaukee Bucks" },
  MIN: { city: "Minnesota",      nickname: "Timberwolves",   full: "Minnesota Timberwolves" },
  NO:  { city: "New Orleans",    nickname: "Pelicans",       full: "New Orleans Pelicans" },
  NOP: { city: "New Orleans",    nickname: "Pelicans",       full: "New Orleans Pelicans" },
  NY:  { city: "New York",       nickname: "Knicks",         full: "New York Knicks" },
  NYK: { city: "New York",       nickname: "Knicks",         full: "New York Knicks" },
  OKC: { city: "Oklahoma City",  nickname: "Thunder",        full: "Oklahoma City Thunder" },
  ORL: { city: "Orlando",        nickname: "Magic",          full: "Orlando Magic" },
  PHI: { city: "Philadelphia",   nickname: "76ers",          full: "Philadelphia 76ers" },
  PHX: { city: "Phoenix",        nickname: "Suns",           full: "Phoenix Suns" },
  POR: { city: "Portland",       nickname: "Trail Blazers",  full: "Portland Trail Blazers" },
  SAC: { city: "Sacramento",     nickname: "Kings",          full: "Sacramento Kings" },
  SA:  { city: "San Antonio",    nickname: "Spurs",          full: "San Antonio Spurs" },
  SAS: { city: "San Antonio",    nickname: "Spurs",          full: "San Antonio Spurs" },
  TOR: { city: "Toronto",        nickname: "Raptors",        full: "Toronto Raptors" },
  UTA: { city: "Utah",           nickname: "Jazz",           full: "Utah Jazz" },
  WAS: { city: "Washington",     nickname: "Wizards",        full: "Washington Wizards" },
};

const MLB: Record<string, TeamNames> = {
  ARI: { city: "Arizona",        nickname: "Diamondbacks",   full: "Arizona Diamondbacks" },
  AZ:  { city: "Arizona",        nickname: "Diamondbacks",   full: "Arizona Diamondbacks" },
  ATL: { city: "Atlanta",        nickname: "Braves",         full: "Atlanta Braves" },
  BAL: { city: "Baltimore",      nickname: "Orioles",        full: "Baltimore Orioles" },
  BOS: { city: "Boston",         nickname: "Red Sox",        full: "Boston Red Sox" },
  CHC: { city: "Chicago",        nickname: "Cubs",           full: "Chicago Cubs" },
  CWS: { city: "Chicago",        nickname: "White Sox",      full: "Chicago White Sox" },
  CHW: { city: "Chicago",        nickname: "White Sox",      full: "Chicago White Sox" },
  CIN: { city: "Cincinnati",     nickname: "Reds",           full: "Cincinnati Reds" },
  CLE: { city: "Cleveland",      nickname: "Guardians",      full: "Cleveland Guardians" },
  COL: { city: "Colorado",       nickname: "Rockies",        full: "Colorado Rockies" },
  DET: { city: "Detroit",        nickname: "Tigers",         full: "Detroit Tigers" },
  HOU: { city: "Houston",        nickname: "Astros",         full: "Houston Astros" },
  KC:  { city: "Kansas City",    nickname: "Royals",         full: "Kansas City Royals" },
  LAA: { city: "Los Angeles",    nickname: "Angels",         full: "Los Angeles Angels" },
  LAD: { city: "Los Angeles",    nickname: "Dodgers",        full: "Los Angeles Dodgers" },
  MIA: { city: "Miami",          nickname: "Marlins",        full: "Miami Marlins" },
  MIL: { city: "Milwaukee",      nickname: "Brewers",        full: "Milwaukee Brewers" },
  MIN: { city: "Minnesota",      nickname: "Twins",          full: "Minnesota Twins" },
  NYM: { city: "New York",       nickname: "Mets",           full: "New York Mets" },
  NYY: { city: "New York",       nickname: "Yankees",        full: "New York Yankees" },
  ATH: { city: "",               nickname: "Athletics",      full: "Athletics" },
  OAK: { city: "",               nickname: "Athletics",      full: "Athletics" },
  PHI: { city: "Philadelphia",   nickname: "Phillies",       full: "Philadelphia Phillies" },
  PIT: { city: "Pittsburgh",     nickname: "Pirates",        full: "Pittsburgh Pirates" },
  SD:  { city: "San Diego",      nickname: "Padres",         full: "San Diego Padres" },
  SF:  { city: "San Francisco",  nickname: "Giants",         full: "San Francisco Giants" },
  SEA: { city: "Seattle",        nickname: "Mariners",       full: "Seattle Mariners" },
  STL: { city: "St. Louis",      nickname: "Cardinals",      full: "St. Louis Cardinals" },
  TB:  { city: "Tampa Bay",      nickname: "Rays",           full: "Tampa Bay Rays" },
  TEX: { city: "Texas",          nickname: "Rangers",        full: "Texas Rangers" },
  TOR: { city: "Toronto",        nickname: "Blue Jays",      full: "Toronto Blue Jays" },
  WSH: { city: "Washington",     nickname: "Nationals",      full: "Washington Nationals" },
  WSN: { city: "Washington",     nickname: "Nationals",      full: "Washington Nationals" },
};

export function lookupTeam(abv: string | undefined | null, sport: "NBA" | "MLB"): TeamNames | null {
  if (!abv) return null;
  const key = abv.toUpperCase();
  const table = sport === "NBA" ? NBA : MLB;
  return table[key] ?? null;
}

/**
 * Parse the "YYYYMMDD_AWAY@HOME" game_id into its parts. Returns null if the
 * string doesn't match the expected format.
 */
export function parseGameId(gameId: string): { date: string; awayAbv: string; homeAbv: string } | null {
  const m = gameId.match(/^(\d{8})_([A-Z0-9]+)@([A-Z0-9]+)$/i);
  if (!m) return null;
  return { date: m[1], awayAbv: m[2].toUpperCase(), homeAbv: m[3].toUpperCase() };
}
