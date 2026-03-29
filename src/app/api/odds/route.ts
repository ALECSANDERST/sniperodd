import { NextRequest, NextResponse } from "next/server";
import { getUpcomingGames, getGameOdds } from "@/lib/odds-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (eventId) {
    const sportKey = searchParams.get("sportKey") || undefined;
    const odds = await getGameOdds(eventId, sportKey);
    if (!odds) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }
    return NextResponse.json(odds);
  }

  const games = await getUpcomingGames();
  return NextResponse.json(games);
}
