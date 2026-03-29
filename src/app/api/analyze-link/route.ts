import { NextRequest, NextResponse } from "next/server";
import { parseLink } from "@/lib/link-parser";
import { matchEvents } from "@/lib/link-matcher";
import { scrapeOddsFromLink } from "@/lib/link-scraper";
import { getUpcomingGames, getGameOdds } from "@/lib/odds-api";
import type { SportEvent, GameOdds, OddsMarket } from "@/types";

/**
 * Merge odds from multiple sources, keeping the best price for each outcome.
 */
function mergeOdds(primary: GameOdds, secondary: GameOdds): GameOdds {
  const marketMap = new Map<string, OddsMarket>();

  // Start with primary markets
  for (const market of primary.markets) {
    marketMap.set(market.key, { ...market, outcomes: [...market.outcomes] });
  }

  // Merge secondary markets
  for (const market of secondary.markets) {
    const existing = marketMap.get(market.key);
    if (!existing) {
      marketMap.set(market.key, { ...market, outcomes: [...market.outcomes] });
    } else {
      // Keep best price for each outcome
      for (const outcome of market.outcomes) {
        const existingOutcome = existing.outcomes.find(
          (o) => o.name === outcome.name && o.point === outcome.point
        );
        if (existingOutcome) {
          existingOutcome.price = Math.max(existingOutcome.price, outcome.price);
        } else {
          existing.outcomes.push(outcome);
        }
      }
    }
  }

  return {
    ...primary,
    markets: Array.from(marketMap.values()),
  };
}

/**
 * Generate realistic mock odds for events not in any API.
 */
function generateMockOddsForEvent(homeTeam: string, awayTeam: string): GameOdds {
  const homeWin = +(1.8 + Math.random() * 1.5).toFixed(2);
  const draw = +(2.8 + Math.random() * 1.0).toFixed(2);
  const awayWin = +(2.0 + Math.random() * 2.0).toFixed(2);

  const markets: OddsMarket[] = [
    {
      key: "h2h",
      label: "Resultado (1X2)",
      outcomes: [
        { name: homeTeam, price: homeWin },
        { name: "Draw", price: draw },
        { name: awayTeam, price: awayWin },
      ],
    },
    {
      key: "totals",
      label: "Over/Under",
      outcomes: [
        { name: "Over", price: 1.65, point: 1.5 },
        { name: "Under", price: 2.20, point: 1.5 },
        { name: "Over", price: 2.05, point: 2.5 },
        { name: "Under", price: 1.80, point: 2.5 },
        { name: "Over", price: 3.10, point: 3.5 },
        { name: "Under", price: 1.38, point: 3.5 },
      ],
    },
    {
      key: "btts",
      label: "Ambas Marcam",
      outcomes: [
        { name: "Yes", price: +(1.7 + Math.random() * 0.4).toFixed(2) },
        { name: "No", price: +(1.8 + Math.random() * 0.4).toFixed(2) },
      ],
    },
    {
      key: "h2h_h1",
      label: "Resultado 1º Tempo",
      outcomes: [
        { name: homeTeam, price: +(homeWin + 0.6).toFixed(2) },
        { name: "Draw", price: +(1.9 + Math.random() * 0.4).toFixed(2) },
        { name: awayTeam, price: +(awayWin + 0.8).toFixed(2) },
      ],
    },
    {
      key: "totals_h1",
      label: "Over/Under 1º Tempo",
      outcomes: [
        { name: "Over", price: 1.90, point: 0.5 },
        { name: "Under", price: 1.90, point: 0.5 },
        { name: "Over", price: 3.30, point: 1.5 },
        { name: "Under", price: 1.35, point: 1.5 },
      ],
    },
    {
      key: "spreads",
      label: "Handicap",
      outcomes: [
        { name: homeTeam, price: 1.90, point: -0.5 },
        { name: awayTeam, price: 1.90, point: 0.5 },
      ],
    },
  ];

  return {
    id: `link_${Date.now()}`,
    homeTeam,
    awayTeam,
    commenceTime: new Date(Date.now() + 3600000).toISOString(),
    markets,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL é obrigatória" },
        { status: 400 }
      );
    }

    // 1. Parse the link
    const parsed = parseLink(url.trim());

    // 2. Buscar odds de múltiplas fontes em paralelo
    const [events, scrapedOdds] = await Promise.all([
      getUpcomingGames(),
      // Tentar scrape direto da casa de apostas
      parsed.homeTeam && parsed.awayTeam
        ? scrapeOddsFromLink(url.trim(), parsed.source, parsed.homeTeam, parsed.awayTeam)
        : Promise.resolve(null),
    ]);

    // 3. Match against API events
    const matches = matchEvents(parsed, events);
    const bestMatch = matches[0] || null;

    // 4. Buscar odds da API se tiver match confiante
    let apiOdds: GameOdds | null = null;
    if (bestMatch && bestMatch.confidence >= 70) {
      apiOdds = await getGameOdds(bestMatch.event.id, bestMatch.event.sportKey);
    }

    // 5. Determinar melhor fonte de odds
    let finalOdds: GameOdds | null = null;
    let oddsSource = "mock";

    if (scrapedOdds && scrapedOdds.markets.length > 0) {
      // Odds scraped diretamente da casa — prioridade máxima
      finalOdds = scrapedOdds;
      oddsSource = "live";

      // Se também temos odds da API, fazer merge (melhores preços)
      if (apiOdds && apiOdds.markets.length > 0) {
        finalOdds = mergeOdds(scrapedOdds, apiOdds);
        oddsSource = "live+api";
      }
    } else if (apiOdds && apiOdds.markets.length > 0) {
      // Odds da API de odds
      finalOdds = apiOdds;
      oddsSource = "api";
    }

    // 6. Se temos match confiante com odds
    if (bestMatch && bestMatch.confidence >= 70 && finalOdds) {
      return NextResponse.json({
        parsed,
        match: bestMatch,
        odds: finalOdds,
        suggestions: matches,
        synthetic: false,
        oddsSource,
      });
    }

    // 7. Se extraímos os times do link
    if (parsed.homeTeam && parsed.awayTeam) {
      const syntheticEvent: SportEvent = {
        id: `link_${Date.now()}`,
        homeTeam: parsed.homeTeam,
        awayTeam: parsed.awayTeam,
        commenceTime: new Date(Date.now() + 3600000).toISOString(),
        sport: "Futebol",
        sportKey: parsed.sportKey || "soccer",
      };

      // Usar odds scraped se disponíveis, senão mock
      if (!finalOdds) {
        finalOdds = generateMockOddsForEvent(parsed.homeTeam, parsed.awayTeam);
        oddsSource = "estimated";
      }

      return NextResponse.json({
        parsed,
        match: {
          event: syntheticEvent,
          confidence: oddsSource === "live" ? 85 : 60,
          matchedBy: "partial" as const,
        },
        odds: finalOdds,
        suggestions: matches.length > 0 ? matches : [],
        synthetic: oddsSource !== "live",
        oddsSource,
      });
    }

    // 8. Nenhum time extraído
    return NextResponse.json({
      parsed,
      match: bestMatch,
      odds: finalOdds,
      suggestions: matches,
      synthetic: false,
      oddsSource: "none",
    });
  } catch (error) {
    console.error("Analyze link error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar o link. Verifique a URL e tente novamente." },
      { status: 500 }
    );
  }
}
