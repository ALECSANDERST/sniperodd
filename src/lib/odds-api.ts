import { GameOdds, OddsMarket, SportEvent } from "@/types";
import { getCached, setCache, TTL } from "@/lib/cache";

const API_KEY = process.env.ODDS_API_KEY || "";
const BASE_URL = "https://api.the-odds-api.com/v4";

const MARKET_KEYS = [
  "h2h",           // Resultado 1X2
  "spreads",       // Handicap
  "totals",        // Over/Under
  "btts",          // Ambas marcam
  "h2h_h1",        // Resultado 1º tempo
  "totals_h1",     // Over/Under 1º tempo
];

const SOCCER_LEAGUES = [
  "soccer_brazil_campeonato",
  "soccer_brazil_serie_b",
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_spain_segunda_division",
  "soccer_italy_serie_a",
  "soccer_germany_bundesliga",
  "soccer_germany_bundesliga2",
  "soccer_france_ligue_one",
  "soccer_france_ligue_two",
  "soccer_portugal_primeira_liga",
  "soccer_netherlands_eredivisie",
  "soccer_argentina_primera_division",
  "soccer_conmebol_copa_libertadores",
  "soccer_conmebol_copa_sudamericana",
  "soccer_uefa_champs_league",
  "soccer_uefa_europa_league",
  "soccer_mexico_ligamx",
  "soccer_usa_mls",
  "soccer_turkey_super_league",
  "soccer_belgium_first_div",
  "soccer_efl_champ",
  "soccer_england_league1",
  "soccer_england_league2",
  "soccer_fa_cup",
  "soccer_fifa_world_cup",
  "soccer_fifa_world_cup_qualifiers_europe",
  "soccer_japan_j_league",
  "soccer_korea_kleague1",
  "soccer_australia_aleague",
  "soccer_chile_campeonato",
  "soccer_denmark_superliga",
  "soccer_greece_super_league",
  "soccer_poland_ekstraklasa",
  "soccer_saudi_arabia_pro_league",
  "soccer_china_superleague",
  "soccer_norway_eliteserien",
  "soccer_russia_premier_league",
  "soccer_austria_bundesliga",
  "soccer_finland_veikkausliiga",
  "soccer_league_of_ireland",
];

export async function getUpcomingGames(): Promise<SportEvent[]> {
  if (!API_KEY) return getMockGames();

  // Verificar cache
  const cached = getCached<SportEvent[]>("games_list");
  if (cached) return cached;

  const allGames: SportEvent[] = [];

  // Buscar de múltiplos campeonatos em paralelo
  const results = await Promise.allSettled(
    SOCCER_LEAGUES.map(async (league) => {
      const url = `${BASE_URL}/sports/${league}/odds/?apiKey=${API_KEY}&regions=eu&oddsFormat=decimal&markets=h2h`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((event: any) => ({
        id: event.id,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: event.commence_time,
        sport: event.sport_title,
        sportKey: event.sport_key,
      }));
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      allGames.push(...result.value);
    }
  }

  if (allGames.length === 0) return getMockGames();

  // Ordenar por data do jogo
  allGames.sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime());

  // Remover duplicatas por ID
  const seen = new Set<string>();
  const unique = allGames.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });

  // Salvar no cache (30 min)
  setCache("games_list", unique, TTL.GAMES_LIST);
  return unique;
}

export async function getGameOdds(eventId: string, sportKey?: string): Promise<GameOdds | null> {
  if (!API_KEY || eventId.startsWith("mock_")) {
    return getMockOdds(eventId);
  }

  // Verificar cache
  const cacheKey = `odds_${eventId}`;
  const cached = getCached<GameOdds>(cacheKey);
  if (cached) return cached;

  const marketsParam = MARKET_KEYS.join(",");
  const league = sportKey || "soccer";
  const url = `${BASE_URL}/sports/${league}/events/${eventId}/odds/?apiKey=${API_KEY}&regions=eu&oddsFormat=decimal&markets=${marketsParam}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return getMockOdds(eventId);
  }

  const data = await res.json();
  const parsed = parseOddsResponse(data);

  // Salvar no cache (10 min)
  setCache(cacheKey, parsed, TTL.GAME_ODDS);
  return parsed;
}

function parseOddsResponse(data: any): GameOdds {
  const markets: OddsMarket[] = [];

  if (!data.bookmakers || data.bookmakers.length === 0) {
    return {
      id: data.id,
      homeTeam: data.home_team,
      awayTeam: data.away_team,
      commenceTime: data.commence_time,
      markets: [],
    };
  }

  // Pegar a melhor odd de cada bookmaker
  const bestOdds = new Map<string, Map<string, { name: string; price: number; point?: number }>>();

  for (const bookmaker of data.bookmakers) {
    for (const market of bookmaker.markets) {
      if (!bestOdds.has(market.key)) {
        bestOdds.set(market.key, new Map());
      }
      const marketMap = bestOdds.get(market.key)!;

      for (const outcome of market.outcomes) {
        const key = outcome.point !== undefined
          ? `${outcome.name}_${outcome.point}`
          : outcome.name;

        const current = marketMap.get(key);
        if (!current || outcome.price > current.price) {
          marketMap.set(key, {
            name: outcome.name,
            price: outcome.price,
            point: outcome.point,
          });
        }
      }
    }
  }

  const marketLabels: Record<string, string> = {
    h2h: "Resultado (1X2)",
    spreads: "Handicap",
    totals: "Over/Under",
    btts: "Ambas Marcam",
    h2h_h1: "Resultado 1º Tempo",
    totals_h1: "Over/Under 1º Tempo",
  };

  for (const [key, outcomes] of bestOdds) {
    markets.push({
      key,
      label: marketLabels[key] || key,
      outcomes: Array.from(outcomes.values()),
    });
  }

  return {
    id: data.id,
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    commenceTime: data.commence_time,
    markets,
  };
}

// ===== DADOS MOCK PARA DEMO =====

function getMockGames(): SportEvent[] {
  return [
    {
      id: "mock_1",
      homeTeam: "Flamengo",
      awayTeam: "Palmeiras",
      commenceTime: new Date(Date.now() + 86400000).toISOString(),
      sport: "Campeonato Brasileiro",
      sportKey: "soccer_brazil_campeonato",
    },
    {
      id: "mock_2",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      commenceTime: new Date(Date.now() + 172800000).toISOString(),
      sport: "La Liga",
      sportKey: "soccer_spain_la_liga",
    },
    {
      id: "mock_3",
      homeTeam: "Manchester City",
      awayTeam: "Liverpool",
      commenceTime: new Date(Date.now() + 259200000).toISOString(),
      sport: "Premier League",
      sportKey: "soccer_epl",
    },
    {
      id: "mock_4",
      homeTeam: "México",
      awayTeam: "Portugal",
      commenceTime: new Date(Date.now() + 345600000).toISOString(),
      sport: "Amistoso Internacional",
      sportKey: "soccer",
    },
    {
      id: "mock_5",
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      commenceTime: new Date(Date.now() + 432000000).toISOString(),
      sport: "Campeonato Brasileiro",
      sportKey: "soccer_brazil_campeonato",
    },
    {
      id: "mock_6",
      homeTeam: "Bayern München",
      awayTeam: "Borussia Dortmund",
      commenceTime: new Date(Date.now() + 518400000).toISOString(),
      sport: "Bundesliga",
      sportKey: "soccer_germany_bundesliga",
    },
  ];
}

function getMockOdds(eventId: string): GameOdds {
  const games: Record<string, { home: string; away: string }> = {
    mock_1: { home: "Flamengo", away: "Palmeiras" },
    mock_2: { home: "Real Madrid", away: "Barcelona" },
    mock_3: { home: "Manchester City", away: "Liverpool" },
    mock_4: { home: "México", away: "Portugal" },
    mock_5: { home: "Corinthians", away: "São Paulo" },
    mock_6: { home: "Bayern München", away: "Borussia Dortmund" },
  };

  const game = games[eventId] || { home: "Time A", away: "Time B" };

  // Odds realistas variáveis por jogo
  const scenarios: Record<string, OddsMarket[]> = {
    mock_1: [ // Flamengo vs Palmeiras - Jogo equilibrado
      { key: "h2h", label: "Resultado (1X2)", outcomes: [
        { name: game.home, price: 2.25 }, { name: "Draw", price: 3.20 }, { name: game.away, price: 3.10 }
      ]},
      { key: "totals", label: "Over/Under", outcomes: [
        { name: "Over", price: 1.85, point: 1.5 }, { name: "Under", price: 1.95, point: 1.5 },
        { name: "Over", price: 2.10, point: 2.5 }, { name: "Under", price: 1.75, point: 2.5 },
        { name: "Over", price: 3.20, point: 3.5 }, { name: "Under", price: 1.35, point: 3.5 },
      ]},
      { key: "btts", label: "Ambas Marcam", outcomes: [
        { name: "Yes", price: 1.90 }, { name: "No", price: 1.90 }
      ]},
      { key: "h2h_h1", label: "Resultado 1º Tempo", outcomes: [
        { name: game.home, price: 2.80 }, { name: "Draw", price: 2.10 }, { name: game.away, price: 3.80 }
      ]},
      { key: "totals_h1", label: "Over/Under 1º Tempo", outcomes: [
        { name: "Over", price: 2.00, point: 0.5 }, { name: "Under", price: 1.80, point: 0.5 },
        { name: "Over", price: 3.50, point: 1.5 }, { name: "Under", price: 1.30, point: 1.5 },
      ]},
      { key: "spreads", label: "Handicap", outcomes: [
        { name: game.home, price: 1.90, point: -0.5 }, { name: game.away, price: 1.90, point: 0.5 },
      ]},
    ],
    mock_2: [ // Real Madrid vs Barcelona - Jogo aberto
      { key: "h2h", label: "Resultado (1X2)", outcomes: [
        { name: game.home, price: 2.10 }, { name: "Draw", price: 3.50 }, { name: game.away, price: 3.30 }
      ]},
      { key: "totals", label: "Over/Under", outcomes: [
        { name: "Over", price: 1.50, point: 1.5 }, { name: "Under", price: 2.60, point: 1.5 },
        { name: "Over", price: 1.75, point: 2.5 }, { name: "Under", price: 2.10, point: 2.5 },
        { name: "Over", price: 2.50, point: 3.5 }, { name: "Under", price: 1.55, point: 3.5 },
      ]},
      { key: "btts", label: "Ambas Marcam", outcomes: [
        { name: "Yes", price: 1.65 }, { name: "No", price: 2.20 }
      ]},
      { key: "h2h_h1", label: "Resultado 1º Tempo", outcomes: [
        { name: game.home, price: 2.60 }, { name: "Draw", price: 2.20 }, { name: game.away, price: 3.50 }
      ]},
      { key: "totals_h1", label: "Over/Under 1º Tempo", outcomes: [
        { name: "Over", price: 1.75, point: 0.5 }, { name: "Under", price: 2.05, point: 0.5 },
        { name: "Over", price: 3.00, point: 1.5 }, { name: "Under", price: 1.40, point: 1.5 },
      ]},
      { key: "spreads", label: "Handicap", outcomes: [
        { name: game.home, price: 1.85, point: -0.5 }, { name: game.away, price: 1.95, point: 0.5 },
      ]},
    ],
    mock_4: [ // México vs Portugal - Favorito dominante
      { key: "h2h", label: "Resultado (1X2)", outcomes: [
        { name: game.home, price: 4.50 }, { name: "Draw", price: 3.60 }, { name: game.away, price: 1.72 }
      ]},
      { key: "totals", label: "Over/Under", outcomes: [
        { name: "Over", price: 1.55, point: 1.5 }, { name: "Under", price: 2.45, point: 1.5 },
        { name: "Over", price: 1.90, point: 2.5 }, { name: "Under", price: 1.90, point: 2.5 },
        { name: "Over", price: 2.90, point: 3.5 }, { name: "Under", price: 1.42, point: 3.5 },
      ]},
      { key: "btts", label: "Ambas Marcam", outcomes: [
        { name: "Yes", price: 2.00 }, { name: "No", price: 1.80 }
      ]},
      { key: "h2h_h1", label: "Resultado 1º Tempo", outcomes: [
        { name: game.home, price: 5.50 }, { name: "Draw", price: 1.95 }, { name: game.away, price: 2.40 }
      ]},
      { key: "totals_h1", label: "Over/Under 1º Tempo", outcomes: [
        { name: "Over", price: 1.85, point: 0.5 }, { name: "Under", price: 1.95, point: 0.5 },
        { name: "Over", price: 3.30, point: 1.5 }, { name: "Under", price: 1.33, point: 1.5 },
      ]},
      { key: "spreads", label: "Handicap", outcomes: [
        { name: game.home, price: 1.90, point: 1.0 }, { name: game.away, price: 1.90, point: -1.0 },
      ]},
    ],
  };

  // Default para jogos sem cenário específico
  const defaultMarkets: OddsMarket[] = [
    { key: "h2h", label: "Resultado (1X2)", outcomes: [
      { name: game.home, price: 2.40 }, { name: "Draw", price: 3.30 }, { name: game.away, price: 2.90 }
    ]},
    { key: "totals", label: "Over/Under", outcomes: [
      { name: "Over", price: 1.70, point: 1.5 }, { name: "Under", price: 2.15, point: 1.5 },
      { name: "Over", price: 2.00, point: 2.5 }, { name: "Under", price: 1.85, point: 2.5 },
      { name: "Over", price: 3.00, point: 3.5 }, { name: "Under", price: 1.40, point: 3.5 },
    ]},
    { key: "btts", label: "Ambas Marcam", outcomes: [
      { name: "Yes", price: 1.85 }, { name: "No", price: 1.95 }
    ]},
    { key: "h2h_h1", label: "Resultado 1º Tempo", outcomes: [
      { name: game.home, price: 3.00 }, { name: "Draw", price: 2.15 }, { name: game.away, price: 3.40 }
    ]},
    { key: "totals_h1", label: "Over/Under 1º Tempo", outcomes: [
      { name: "Over", price: 1.90, point: 0.5 }, { name: "Under", price: 1.90, point: 0.5 },
      { name: "Over", price: 3.40, point: 1.5 }, { name: "Under", price: 1.32, point: 1.5 },
    ]},
    { key: "spreads", label: "Handicap", outcomes: [
      { name: game.home, price: 1.85, point: -0.5 }, { name: game.away, price: 1.95, point: 0.5 },
    ]},
  ];

  return {
    id: eventId,
    homeTeam: game.home,
    awayTeam: game.away,
    commenceTime: new Date(Date.now() + 86400000).toISOString(),
    markets: scenarios[eventId] || defaultMarkets,
  };
}
