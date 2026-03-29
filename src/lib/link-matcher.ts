import { ParsedLink, SportEvent, LinkMatchResult } from "@/types";

/**
 * Normalize a team name for comparison:
 * - Remove accents
 * - Lowercase
 * - Remove common suffixes (FC, SC, CF, etc.)
 * - Handle common abbreviations
 */
function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/\b(fc|sc|cf|ac|rc|ec|se|cr|cd|ud|rcd|afc|sfc)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate similarity between two strings (0-100).
 * Uses a combination of inclusion check and character overlap.
 */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  // Exact match
  if (na === nb) return 100;

  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return 90;

  // Check word overlap
  const wordsA = na.split(/\s+/);
  const wordsB = nb.split(/\s+/);
  const commonWords = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
  const wordScore = (commonWords.length / Math.max(wordsA.length, wordsB.length)) * 80;

  // Levenshtein-based for short strings
  if (na.length < 20 && nb.length < 20) {
    const dist = levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);
    const levScore = ((maxLen - dist) / maxLen) * 100;
    return Math.max(wordScore, levScore);
  }

  return wordScore;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Common Brazilian team abbreviations map.
 */
const TEAM_ALIASES: Record<string, string[]> = {
  "flamengo": ["fla", "mengao", "flamengo rj"],
  "palmeiras": ["pal", "verdao", "palmeiras sp"],
  "corinthians": ["cor", "timao", "corinthians sp"],
  "sao paulo": ["spfc", "sp", "sao paulo fc", "tricolor"],
  "santos": ["san", "peixe", "santos fc"],
  "botafogo": ["bot", "botafogo rj", "fogao"],
  "fluminense": ["flu", "fluminense rj"],
  "vasco": ["vas", "vasco da gama", "vascao"],
  "atletico mineiro": ["cam", "galo", "atletico mg"],
  "cruzeiro": ["cru", "cruzeiro mg", "raposa"],
  "gremio": ["gre", "gremio rs", "tricolor gaucho"],
  "internacional": ["int", "inter", "colorado", "internacional rs"],
  "real madrid": ["real", "rm", "madrid"],
  "barcelona": ["barca", "fcb", "barcelona fc"],
  "manchester city": ["man city", "city", "mcfc"],
  "manchester united": ["man utd", "united", "mufc"],
  "liverpool": ["lfc", "pool", "liverpool fc"],
  "bayern munchen": ["bayern", "bayern munich", "fcb munich"],
  "borussia dortmund": ["dortmund", "bvb"],
  "paris saint germain": ["psg", "paris sg"],
  "juventus": ["juve", "juventus fc"],
  "ac milan": ["milan", "acm"],
  "inter milan": ["inter", "internazionale"],
};

function matchWithAliases(parsed: string, eventTeam: string): number {
  const base = similarity(parsed, eventTeam);
  if (base >= 80) return base;

  const normalizedParsed = normalize(parsed);
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const allNames = [canonical, ...aliases];
    const parsedMatch = allNames.some(
      (a) => normalize(a) === normalizedParsed || normalizedParsed.includes(normalize(a))
    );
    const eventMatch = allNames.some((a) => {
      const na = normalize(a);
      const ne = normalize(eventTeam);
      return ne === na || ne.includes(na) || na.includes(ne);
    });
    if (parsedMatch && eventMatch) return 95;
  }

  return base;
}

/**
 * Match a parsed link against available events.
 * Returns matches sorted by confidence (descending).
 */
export function matchEvents(parsed: ParsedLink, events: SportEvent[]): LinkMatchResult[] {
  if (!parsed.homeTeam && !parsed.awayTeam) {
    // No team info extracted - try matching the slug against team names
    const slugResults: LinkMatchResult[] = [];
    for (const event of events) {
      const homeScore = similarity(parsed.eventSlug, event.homeTeam);
      const awayScore = similarity(parsed.eventSlug, event.awayTeam);
      const best = Math.max(homeScore, awayScore);
      if (best >= 40) {
        slugResults.push({
          event,
          confidence: Math.round(best * 0.6), // lower confidence for slug-only matches
          matchedBy: "partial",
        });
      }
    }
    return slugResults.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  const results: LinkMatchResult[] = [];

  for (const event of events) {
    let homeScore = 0;
    let awayScore = 0;

    if (parsed.homeTeam) {
      homeScore = Math.max(
        matchWithAliases(parsed.homeTeam, event.homeTeam),
        matchWithAliases(parsed.homeTeam, event.awayTeam)
      );
    }

    if (parsed.awayTeam) {
      awayScore = Math.max(
        matchWithAliases(parsed.awayTeam, event.awayTeam),
        matchWithAliases(parsed.awayTeam, event.homeTeam)
      );
    }

    // Both teams matched
    if (parsed.homeTeam && parsed.awayTeam) {
      const avgScore = (homeScore + awayScore) / 2;
      if (avgScore >= 50) {
        results.push({
          event,
          confidence: Math.round(avgScore),
          matchedBy: avgScore >= 85 ? "exact" : "fuzzy",
        });
      }
    }
    // Only one team
    else {
      const score = Math.max(homeScore, awayScore);
      if (score >= 60) {
        results.push({
          event,
          confidence: Math.round(score * 0.85),
          matchedBy: score >= 85 ? "fuzzy" : "partial",
        });
      }
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
