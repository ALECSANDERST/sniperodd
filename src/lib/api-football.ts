// =============================================
// PROVIDER: API-Football (api-sports.io)
// Free: 100 req/dia, todas as ligas, odds pre-match
// Docs: https://www.api-football.com/documentation-v3
// =============================================

import { GameOdds, OddsMarket, OddsOutcome, SportEvent } from "@/types";
import { getCached, setCache, TTL } from "@/lib/cache";

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const BASE_URL = "https://v3.football.api-sports.io";

// Mapeamento de ligas API-Football (IDs numéricos)
const LEAGUES = [
  { id: 71, name: "Brasileirão Série A" },
  { id: 72, name: "Brasileirão Série B" },
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
  { id: 94, name: "Primeira Liga" },
  { id: 88, name: "Eredivisie" },
  { id: 128, name: "Liga Profesional Argentina" },
  { id: 13, name: "Copa Libertadores" },
  { id: 11, name: "Copa Sudamericana" },
  { id: 2, name: "Champions League" },
  { id: 3, name: "Europa League" },
  { id: 262, name: "Liga MX" },
  { id: 253, name: "MLS" },
  { id: 203, name: "Süper Lig" },
  { id: 144, name: "Jupiler Pro League" },
  { id: 40, name: "Championship" },
  { id: 98, name: "J1 League" },
  { id: 292, name: "K League 1" },
  { id: 188, name: "A-League" },
];

// Bet IDs do API-Football para os mercados que usamos
const BET_IDS = {
  MATCH_WINNER: 1,       // 1X2
  OVER_UNDER: 5,         // Over/Under
  BTTS: 8,               // Both Teams Score
  HT_RESULT: 13,         // Half Time Result
  HT_OVER_UNDER: 6,      // Over/Under First Half
  HANDICAP: 4,           // Asian Handicap
};

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) return null;

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": API_KEY },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) return null;

  return json.response as T;
}

// =============================================
// JOGOS PRÓXIMOS
// =============================================

interface APIFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; country: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
}

export async function getUpcomingGamesAPIFootball(): Promise<SportEvent[]> {
  if (!API_KEY) return [];

  const cached = getCached<SportEvent[]>("apifb_games");
  if (cached) return cached;

  const allGames: SportEvent[] = [];
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Buscar por liga em batches (economizar requests do free tier)
  // Agrupar ligas prioritárias: brasileiras + top europeias
  const priorityLeagues = LEAGUES.slice(0, 14);

  for (const league of priorityLeagues) {
    const fixtures = await apiFetch<APIFixture[]>("/fixtures", {
      league: String(league.id),
      season: String(new Date().getFullYear()),
      from: today,
      to: nextWeek,
      status: "NS", // Not Started
    });

    if (!fixtures) continue;

    for (const f of fixtures) {
      allGames.push({
        id: `apifb_${f.fixture.id}`,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        commenceTime: f.fixture.date,
        sport: league.name,
        sportKey: `apifb_${league.id}`,
      });
    }
  }

  allGames.sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime());

  // Cache 30 min
  if (allGames.length > 0) {
    setCache("apifb_games", allGames, TTL.GAMES_LIST);
  }

  return allGames;
}

// =============================================
// ODDS DE UM JOGO
// =============================================

interface APIOddsBookmaker {
  id: number;
  name: string;
  bets: {
    id: number;
    name: string;
    values: { value: string; odd: string }[];
  }[];
}

interface APIOddsResponse {
  league: { id: number };
  fixture: { id: number };
  bookmakers: APIOddsBookmaker[];
}

export async function getGameOddsAPIFootball(eventId: string): Promise<GameOdds | null> {
  // Extrair fixture ID real
  const fixtureId = eventId.replace("apifb_", "");
  if (!fixtureId || !API_KEY) return null;

  const cacheKey = `apifb_odds_${fixtureId}`;
  const cached = getCached<GameOdds>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<APIOddsResponse[]>("/odds", {
    fixture: fixtureId,
  });

  if (!data || data.length === 0) return null;

  // Buscar info do fixture para nomes dos times
  const fixtures = await apiFetch<APIFixture[]>("/fixtures", {
    id: fixtureId,
  });

  const fixture = fixtures?.[0];
  if (!fixture) return null;

  const homeTeam = fixture.teams.home.name;
  const awayTeam = fixture.teams.away.name;

  // Agregar melhores odds de todos os bookmakers
  const markets = parseAPIFootballOdds(data[0].bookmakers, homeTeam, awayTeam);

  const result: GameOdds = {
    id: eventId,
    homeTeam,
    awayTeam,
    commenceTime: fixture.fixture.date,
    markets,
  };

  setCache(cacheKey, result, TTL.GAME_ODDS);
  return result;
}

// =============================================
// PARSER: API-Football → nosso formato OddsMarket[]
// =============================================

function parseAPIFootballOdds(
  bookmakers: APIOddsBookmaker[],
  homeTeam: string,
  awayTeam: string
): OddsMarket[] {
  // Agrupar melhores odds por mercado/outcome de todos os bookmakers
  const bestOdds = new Map<string, Map<string, OddsOutcome>>();

  for (const bk of bookmakers) {
    for (const bet of bk.bets) {
      const marketKey = mapBetToMarketKey(bet.id);
      if (!marketKey) continue;

      if (!bestOdds.has(marketKey)) {
        bestOdds.set(marketKey, new Map());
      }
      const marketMap = bestOdds.get(marketKey)!;

      for (const v of bet.values) {
        const outcome = mapValueToOutcome(bet.id, v, homeTeam, awayTeam);
        if (!outcome) continue;

        const key = outcome.point !== undefined
          ? `${outcome.name}_${outcome.point}`
          : outcome.name;

        const current = marketMap.get(key);
        if (!current || outcome.price > current.price) {
          marketMap.set(key, outcome);
        }
      }
    }
  }

  const marketLabels: Record<string, string> = {
    h2h: "Resultado (1X2)",
    totals: "Over/Under",
    btts: "Ambas Marcam",
    h2h_h1: "Resultado 1º Tempo",
    totals_h1: "Over/Under 1º Tempo",
    spreads: "Handicap",
  };

  const markets: OddsMarket[] = [];
  for (const [key, outcomes] of bestOdds) {
    markets.push({
      key,
      label: marketLabels[key] || key,
      outcomes: Array.from(outcomes.values()),
    });
  }

  return markets;
}

function mapBetToMarketKey(betId: number): string | null {
  switch (betId) {
    case BET_IDS.MATCH_WINNER: return "h2h";
    case BET_IDS.OVER_UNDER: return "totals";
    case BET_IDS.BTTS: return "btts";
    case BET_IDS.HT_RESULT: return "h2h_h1";
    case BET_IDS.HT_OVER_UNDER: return "totals_h1";
    case BET_IDS.HANDICAP: return "spreads";
    default: return null;
  }
}

function mapValueToOutcome(
  betId: number,
  v: { value: string; odd: string },
  homeTeam: string,
  awayTeam: string
): OddsOutcome | null {
  const price = parseFloat(v.odd);
  if (isNaN(price) || price <= 1) return null;

  switch (betId) {
    case BET_IDS.MATCH_WINNER: {
      if (v.value === "Home") return { name: homeTeam, price };
      if (v.value === "Away") return { name: awayTeam, price };
      if (v.value === "Draw") return { name: "Draw", price };
      return null;
    }

    case BET_IDS.OVER_UNDER: {
      const match = v.value.match(/^(Over|Under)\s+([\d.]+)$/);
      if (!match) return null;
      return { name: match[1], price, point: parseFloat(match[2]) };
    }

    case BET_IDS.BTTS: {
      if (v.value === "Yes") return { name: "Yes", price };
      if (v.value === "No") return { name: "No", price };
      return null;
    }

    case BET_IDS.HT_RESULT: {
      if (v.value === "Home") return { name: homeTeam, price };
      if (v.value === "Away") return { name: awayTeam, price };
      if (v.value === "Draw") return { name: "Draw", price };
      return null;
    }

    case BET_IDS.HT_OVER_UNDER: {
      const match = v.value.match(/^(Over|Under)\s+([\d.]+)$/);
      if (!match) return null;
      return { name: match[1], price, point: parseFloat(match[2]) };
    }

    case BET_IDS.HANDICAP: {
      // "Home -1.5", "Away +0.5"
      if (v.value.startsWith("Home")) {
        const pt = parseFloat(v.value.replace("Home", "").trim());
        if (isNaN(pt)) return null;
        return { name: homeTeam, price, point: pt };
      }
      if (v.value.startsWith("Away")) {
        const pt = parseFloat(v.value.replace("Away", "").trim());
        if (isNaN(pt)) return null;
        return { name: awayTeam, price, point: pt };
      }
      return null;
    }

    default:
      return null;
  }
}

export function isAPIFootballAvailable(): boolean {
  return !!API_KEY;
}

export function isAPIFootballEvent(eventId: string): boolean {
  return eventId.startsWith("apifb_");
}
