import { NextRequest, NextResponse } from "next/server";
import { parseLink } from "@/lib/link-parser";
import { matchEvents } from "@/lib/link-matcher";
import { getUpcomingGames, getGameOdds } from "@/lib/odds-api";
import type { SportEvent, GameOdds, OddsMarket } from "@/types";

/**
 * Generate realistic mock odds for events not in the API.
 * This allows the system to always work even when the event
 * is not covered by the odds providers.
 */
function generateMockOddsForEvent(homeTeam: string, awayTeam: string): GameOdds {
  // Slightly randomized but realistic odds
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

    // 2. Fetch available events
    const events = await getUpcomingGames();

    // 3. Match against events
    const matches = matchEvents(parsed, events);

    // 4. Try to get odds from API
    let odds = null;
    const bestMatch = matches[0] || null;

    if (bestMatch && bestMatch.confidence >= 70) {
      odds = await getGameOdds(bestMatch.event.id, bestMatch.event.sportKey);
    }

    // 5. If no confident match but we extracted team names, create a synthetic event with mock odds
    const noConfidentMatch = !bestMatch || bestMatch.confidence < 70 || !odds;
    if (noConfidentMatch && parsed.homeTeam && parsed.awayTeam) {
      const syntheticEvent: SportEvent = {
        id: `link_${Date.now()}`,
        homeTeam: parsed.homeTeam,
        awayTeam: parsed.awayTeam,
        commenceTime: new Date(Date.now() + 3600000).toISOString(),
        sport: "Futebol",
        sportKey: parsed.sportKey || "soccer",
      };

      const syntheticOdds = generateMockOddsForEvent(parsed.homeTeam, parsed.awayTeam);

      return NextResponse.json({
        parsed,
        match: {
          event: syntheticEvent,
          confidence: 60,
          matchedBy: "partial" as const,
        },
        odds: syntheticOdds,
        suggestions: [],
        synthetic: true,
      });
    }

    return NextResponse.json({
      parsed,
      match: bestMatch,
      odds,
      suggestions: matches,
      synthetic: false,
    });
  } catch (error) {
    console.error("Analyze link error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar o link. Verifique a URL e tente novamente." },
      { status: 500 }
    );
  }
}
