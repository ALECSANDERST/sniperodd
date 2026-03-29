import { ParsedLink } from "@/types";

interface BettingHousePattern {
  name: string;
  match: RegExp;
  extract: (url: string) => { home: string | null; away: string | null; slug: string; sport: string | null };
}

function cleanTeamName(raw: string): string {
  return raw
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const patterns: BettingHousePattern[] = [
  // Betano: /sport/futebol/campeonato/flamengo-palmeiras/12345/
  {
    name: "betano",
    match: /betano\.com/i,
    extract: (url) => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      // Find slug with team names (usually contains hyphen and is before numeric ID)
      const teamSlug = segments.find((s, i) =>
        s.includes("-") && segments[i + 1]?.match(/^\d+$/)
      );
      if (teamSlug) {
        const parts = teamSlug.split(/-v-|-vs-|-x-/i);
        if (parts.length === 2) {
          return {
            home: cleanTeamName(parts[0]),
            away: cleanTeamName(parts[1]),
            slug: teamSlug,
            sport: segments.includes("futebol") ? "soccer" : null,
          };
        }
      }
      const slug = segments[segments.length - 2] || segments[segments.length - 1] || "";
      return { home: null, away: null, slug, sport: null };
    },
  },
  // Sportingbet: /sports/futebol/.../flamengo-v-palmeiras-12345
  {
    name: "sportingbet",
    match: /sportingbet\.com/i,
    extract: (url) => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1] || "";
      // Remove trailing event ID
      const withoutId = last.replace(/-\d+$/, "");
      const parts = withoutId.split(/-v-|-vs-|-x-/i);
      if (parts.length === 2) {
        return {
          home: cleanTeamName(parts[0]),
          away: cleanTeamName(parts[1]),
          slug: last,
          sport: segments.some((s) => s.includes("futebol")) ? "soccer" : null,
        };
      }
      return { home: null, away: null, slug: last, sport: null };
    },
  },
  // Bet365: hash-based routing, harder to parse
  {
    name: "bet365",
    match: /bet365\.com/i,
    extract: (url) => {
      const hash = new URL(url).hash || "";
      return { home: null, away: null, slug: hash.slice(0, 100), sport: null };
    },
  },
  // Betfair: /sport/futebol/campeonato/12345/flamengo-v-palmeiras
  {
    name: "betfair",
    match: /betfair\.com/i,
    extract: (url) => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const teamSlug = segments.find((s) => /-v-|-vs-/i.test(s));
      if (teamSlug) {
        const parts = teamSlug.split(/-v-|-vs-/i);
        if (parts.length === 2) {
          return {
            home: cleanTeamName(parts[0]),
            away: cleanTeamName(parts[1]),
            slug: teamSlug,
            sport: segments.includes("futebol") || segments.includes("football") ? "soccer" : null,
          };
        }
      }
      return { home: null, away: null, slug: segments[segments.length - 1] || "", sport: null };
    },
  },
  // 1xBet: /line/football/brazil/flamengo-palmeiras/
  {
    name: "1xbet",
    match: /1xbet\.com/i,
    extract: (url) => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const teamSlug = segments.find((s) => s.includes("-") && !["line", "football", "soccer", "live"].includes(s));
      if (teamSlug) {
        const clean = teamSlug.replace(/-\d+$/, "");
        const parts = clean.split(/-v-|-vs-|-/);
        if (parts.length >= 2) {
          return {
            home: cleanTeamName(parts[0]),
            away: cleanTeamName(parts[parts.length - 1]),
            slug: teamSlug,
            sport: segments.includes("football") ? "soccer" : null,
          };
        }
      }
      return { home: null, away: null, slug: segments[segments.length - 1] || "", sport: null };
    },
  },
  // Pixbet
  {
    name: "pixbet",
    match: /pixbet\.com/i,
    extract: (url) => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const teamSlug = segments.find((s) => /-vs-|-x-|-v-/i.test(s));
      if (teamSlug) {
        const parts = teamSlug.split(/-vs-|-x-|-v-/i);
        if (parts.length === 2) {
          return {
            home: cleanTeamName(parts[0]),
            away: cleanTeamName(parts[1].replace(/-\d+$/, "")),
            slug: teamSlug,
            sport: "soccer",
          };
        }
      }
      return { home: null, away: null, slug: segments[segments.length - 1] || "", sport: null };
    },
  },
  // Stake
  {
    name: "stake",
    match: /stake\.com/i,
    extract: (url) => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const teamSlug = segments.find((s) => /-vs-|-v-/i.test(s));
      if (teamSlug) {
        const parts = teamSlug.split(/-vs-|-v-/i);
        if (parts.length === 2) {
          return {
            home: cleanTeamName(parts[0]),
            away: cleanTeamName(parts[1].replace(/-\d+$/, "")),
            slug: teamSlug,
            sport: segments.includes("football") ? "soccer" : null,
          };
        }
      }
      return { home: null, away: null, slug: segments[segments.length - 1] || "", sport: null };
    },
  },
];

// Generic fallback: try to find "team1-vs-team2" or "team1-v-team2" in any URL
function genericExtract(url: string): { home: string | null; away: string | null; slug: string } {
  try {
    const path = new URL(url).pathname;
    // Match patterns like team1-vs-team2, team1-v-team2, team1-x-team2
    const vsMatch = path.match(/([a-z0-9-]+?)(?:-vs?-|-x-)([a-z0-9-]+?)(?:\/|\?|$|-\d)/i);
    if (vsMatch) {
      return {
        home: cleanTeamName(vsMatch[1]),
        away: cleanTeamName(vsMatch[2]),
        slug: vsMatch[0],
      };
    }
    const segments = path.split("/").filter(Boolean);
    return { home: null, away: null, slug: segments[segments.length - 1] || path };
  } catch {
    return { home: null, away: null, slug: url };
  }
}

export function parseLink(url: string): ParsedLink {
  // Validate URL
  try {
    new URL(url);
  } catch {
    return {
      source: "unknown",
      homeTeam: null,
      awayTeam: null,
      eventSlug: url,
      sportKey: null,
      rawUrl: url,
    };
  }

  // Try specific patterns first
  for (const pattern of patterns) {
    if (pattern.match.test(url)) {
      const result = pattern.extract(url);
      return {
        source: pattern.name,
        homeTeam: result.home,
        awayTeam: result.away,
        eventSlug: result.slug,
        sportKey: result.sport,
        rawUrl: url,
      };
    }
  }

  // Generic fallback
  const generic = genericExtract(url);
  const hostname = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
  return {
    source: hostname || "unknown",
    homeTeam: generic.home,
    awayTeam: generic.away,
    eventSlug: generic.slug,
    sportKey: null,
    rawUrl: url,
  };
}
