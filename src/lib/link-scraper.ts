import type { GameOdds, OddsMarket } from "@/types";

/**
 * Tenta buscar odds reais diretamente da casa de apostas.
 * Cada casa tem endpoints internos diferentes.
 */
export async function scrapeOddsFromLink(
  url: string,
  source: string,
  homeTeam: string,
  awayTeam: string
): Promise<GameOdds | null> {
  try {
    switch (source) {
      case "betano":
        return await scrapeBetano(url, homeTeam, awayTeam);
      default:
        return await scrapeGeneric(url, homeTeam, awayTeam);
    }
  } catch (error) {
    console.error(`Scrape failed for ${source}:`, error);
    return null;
  }
}

// =============================================
// BETANO SCRAPER
// =============================================

async function scrapeBetano(url: string, homeTeam: string, awayTeam: string): Promise<GameOdds | null> {
  // Extrair event ID do URL
  const eventIdMatch = url.match(/\/(\d{5,})\/?/);
  if (!eventIdMatch) return null;
  const eventId = eventIdMatch[1];

  // Betano expõe dados via endpoints internos
  const endpoints = [
    `https://www.betano.bet.br/api/sport/event/${eventId}/`,
    `https://api.betano.bet.br/api/sport/event/${eventId}/`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "Referer": url,
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const parsed = parseBetanoResponse(data, homeTeam, awayTeam, eventId);
      if (parsed && parsed.markets.length > 0) return parsed;
    } catch {
      continue;
    }
  }

  // Fallback: tentar buscar a página HTML e extrair dados do __NEXT_DATA__ ou script tags
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseHtmlForOdds(html, homeTeam, awayTeam, eventId);
  } catch {
    return null;
  }
}

function parseBetanoResponse(data: any, homeTeam: string, awayTeam: string, eventId: string): GameOdds | null {
  try {
    const markets: OddsMarket[] = [];
    const event = data?.data || data;

    // Tentar diferentes estruturas de resposta da Betano
    const marketData = event?.markets || event?.betOffers || event?.selections || [];

    if (Array.isArray(marketData)) {
      for (const market of marketData) {
        const parsed = parseBetanoMarket(market, homeTeam, awayTeam);
        if (parsed) markets.push(parsed);
      }
    }

    if (markets.length === 0) return null;

    return {
      id: `betano_${eventId}`,
      homeTeam: event?.homeTeamName || event?.home?.name || homeTeam,
      awayTeam: event?.awayTeamName || event?.away?.name || awayTeam,
      commenceTime: event?.startTime || event?.startDate || new Date().toISOString(),
      markets,
    };
  } catch {
    return null;
  }
}

function parseBetanoMarket(market: any, homeTeam: string, awayTeam: string): OddsMarket | null {
  try {
    const name = (market?.name || market?.marketName || market?.type || "").toLowerCase();
    const selections = market?.selections || market?.outcomes || market?.odds || [];

    if (!Array.isArray(selections) || selections.length === 0) return null;

    // Map market names to our keys
    let key = "unknown";
    let label = market?.name || "Mercado";

    if (/resultado|match result|1x2|winner/i.test(name) && !/tempo|half/i.test(name)) {
      key = "h2h";
      label = "Resultado (1X2)";
    } else if (/over.under|gols|goals|total/i.test(name) && !/tempo|half/i.test(name)) {
      key = "totals";
      label = "Over/Under";
    } else if (/ambas|both.*score|btts/i.test(name)) {
      key = "btts";
      label = "Ambas Marcam";
    } else if (/resultado.*tempo|1.*half.*result|half.time/i.test(name)) {
      key = "h2h_h1";
      label = "Resultado 1º Tempo";
    } else if (/over.*under.*tempo|1.*half.*total|half.time.*over/i.test(name)) {
      key = "totals_h1";
      label = "Over/Under 1º Tempo";
    } else if (/handicap|spread/i.test(name)) {
      key = "spreads";
      label = "Handicap";
    } else if (/dupla.*chance|double.*chance/i.test(name)) {
      key = "double_chance";
      label = "Dupla Chance";
    } else {
      return null; // Skip unknown markets
    }

    const outcomes = selections.map((sel: any) => {
      let selName = sel?.name || sel?.label || sel?.outcome || "";

      // Normalize selection names
      if (/casa|home|1/i.test(selName) && key === "h2h") selName = homeTeam;
      else if (/fora|away|2/i.test(selName) && key === "h2h") selName = awayTeam;
      else if (/empate|draw|x/i.test(selName)) selName = "Draw";
      else if (/sim|yes/i.test(selName)) selName = "Yes";
      else if (/não|no/i.test(selName)) selName = "No";

      return {
        name: selName,
        price: +(sel?.price || sel?.odd || sel?.decimal || 1).toFixed(2),
        ...(sel?.point !== undefined || sel?.line !== undefined
          ? { point: +(sel?.point || sel?.line) }
          : {}),
      };
    }).filter((o: any) => o.price > 1);

    if (outcomes.length === 0) return null;

    return { key, label, outcomes };
  } catch {
    return null;
  }
}

function parseHtmlForOdds(html: string, homeTeam: string, awayTeam: string, eventId: string): GameOdds | null {
  try {
    // Try to find JSON data embedded in the page
    const patterns = [
      /__NEXT_DATA__\s*=\s*({[\s\S]+?})\s*;?\s*<\/script>/,
      /window\.__DATA__\s*=\s*({[\s\S]+?})\s*;?\s*<\/script>/,
      /window\.initialState\s*=\s*({[\s\S]+?})\s*;?\s*<\/script>/,
      /"markets"\s*:\s*(\[[\s\S]+?\])\s*[,}]/,
      /"odds"\s*:\s*(\[[\s\S]+?\])\s*[,}]/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        try {
          const data = JSON.parse(match[1]);
          const parsed = parseBetanoResponse(data, homeTeam, awayTeam, eventId);
          if (parsed && parsed.markets.length > 0) return parsed;
        } catch {
          continue;
        }
      }
    }

    // Try to extract odds from HTML structure
    const markets: OddsMarket[] = [];
    const oddMatches = html.matchAll(/data-odd="([\d.]+)"/g);
    const odds: number[] = [];
    for (const m of oddMatches) {
      odds.push(parseFloat(m[1]));
    }

    // If we found at least 3 odds (home/draw/away), create a basic market
    if (odds.length >= 3) {
      markets.push({
        key: "h2h",
        label: "Resultado (1X2)",
        outcomes: [
          { name: homeTeam, price: odds[0] },
          { name: "Draw", price: odds[1] },
          { name: awayTeam, price: odds[2] },
        ],
      });
    }

    if (markets.length > 0) {
      return {
        id: `betano_${eventId}`,
        homeTeam,
        awayTeam,
        commenceTime: new Date().toISOString(),
        markets,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// =============================================
// GENERIC SCRAPER (fallback para qualquer site)
// =============================================

async function scrapeGeneric(url: string, homeTeam: string, awayTeam: string): Promise<GameOdds | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("json")) {
      const data = await res.json();
      return extractOddsFromJson(data, homeTeam, awayTeam);
    }

    const html = await res.text();

    // Look for JSON-LD or embedded data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        if (ld?.odds || ld?.offers) {
          return extractOddsFromJson(ld, homeTeam, awayTeam);
        }
      } catch { /* ignore */ }
    }

    return null;
  } catch {
    return null;
  }
}

function extractOddsFromJson(data: any, homeTeam: string, awayTeam: string): GameOdds | null {
  try {
    // Try common JSON structures
    const markets: OddsMarket[] = [];

    // Look for odds arrays at any level
    const findOdds = (obj: any, depth = 0): void => {
      if (depth > 5 || !obj || typeof obj !== "object") return;

      if (Array.isArray(obj)) {
        for (const item of obj) findOdds(item, depth + 1);
        return;
      }

      // Check if this object looks like a market
      if (obj.outcomes || obj.selections || obj.odds) {
        const selections = obj.outcomes || obj.selections || obj.odds;
        if (Array.isArray(selections) && selections.length >= 2) {
          const outcomes = selections
            .filter((s: any) => s.price || s.odd || s.decimal)
            .map((s: any) => ({
              name: s.name || s.label || s.outcome || "Selection",
              price: +(s.price || s.odd || s.decimal || 0),
              ...(s.point !== undefined ? { point: +s.point } : {}),
            }));

          if (outcomes.length >= 2) {
            markets.push({
              key: obj.key || obj.type || `market_${markets.length}`,
              label: obj.name || obj.label || `Mercado ${markets.length + 1}`,
              outcomes,
            });
          }
        }
      }

      for (const val of Object.values(obj)) {
        findOdds(val, depth + 1);
      }
    };

    findOdds(data);

    if (markets.length === 0) return null;

    return {
      id: `scraped_${Date.now()}`,
      homeTeam,
      awayTeam,
      commenceTime: new Date().toISOString(),
      markets,
    };
  } catch {
    return null;
  }
}
