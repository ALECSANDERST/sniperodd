import { NextRequest, NextResponse } from "next/server";
import { parseLink } from "@/lib/link-parser";
import { matchEvents } from "@/lib/link-matcher";
import { getUpcomingGames, getGameOdds } from "@/lib/odds-api";

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

    // 4. If high confidence match, fetch odds
    let odds = null;
    const bestMatch = matches[0] || null;

    if (bestMatch && bestMatch.confidence >= 70) {
      odds = await getGameOdds(bestMatch.event.id, bestMatch.event.sportKey);
    }

    return NextResponse.json({
      parsed,
      match: bestMatch,
      odds,
      suggestions: matches,
    });
  } catch (error) {
    console.error("Analyze link error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar o link. Verifique a URL e tente novamente." },
      { status: 500 }
    );
  }
}
