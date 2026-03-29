import {
  GameInput,
  GameOdds,
  GameScenario,
  GeneratedBet,
  GenerationResult,
  BetSelection,
  BetRiskLevel,
  BetCoherenceInfo,
  ExposureAnalysis,
  OddsMarket,
  OddsOutcome,
  QualityScore,
  RiskProfile,
  RISK_PROFILE_CONFIG,
} from "@/types";
import {
  validateBetCoherence,
  hasImpossibleConflict,
  type CoherenceResult,
} from "./bet-coherence-validator";

// Re-exportar para uso externo (UI, hooks)
export { validateBetCoherence } from "./bet-coherence-validator";
export type { CoherenceResult, ConflictDetail } from "./bet-coherence-validator";

// Helper: converter SelectionCandidate[] → BetSelection[]
function toBetSelections(selections: SelectionCandidate[]): BetSelection[] {
  return selections.map((s) => ({ market: s.market, selection: s.selection, odd: s.odd }));
}

// =============================================
// 1. CLASSIFICAÇÃO DO JOGO
// =============================================

interface ScenarioAnalysis {
  scenario: GameScenario;
  label: string;
  confidence: number; // 0–100
  favoriteTeam: string | null;
  underdogTeam: string | null;
}

function analyzeScenario(odds: GameOdds): ScenarioAnalysis {
  const h2h = odds.markets.find((m) => m.key === "h2h");
  const totals = odds.markets.find((m) => m.key === "totals");
  const btts = odds.markets.find((m) => m.key === "btts");

  const base: ScenarioAnalysis = {
    scenario: "jogo_equilibrado",
    label: "Jogo Equilibrado",
    confidence: 60,
    favoriteTeam: null,
    underdogTeam: null,
  };

  if (!h2h) return base;

  const homeOdd = h2h.outcomes.find((o) => o.name === odds.homeTeam)?.price || 3.0;
  const awayOdd = h2h.outcomes.find((o) => o.name === odds.awayTeam)?.price || 3.0;
  const drawOdd = h2h.outcomes.find((o) => o.name === "Draw")?.price || 3.3;

  const favoriteOdd = Math.min(homeOdd, awayOdd);
  const underdogOdd = Math.max(homeOdd, awayOdd);
  const favoriteTeam = homeOdd < awayOdd ? odds.homeTeam : odds.awayTeam;
  const underdogTeam = homeOdd < awayOdd ? odds.awayTeam : odds.homeTeam;

  const over25 = totals?.outcomes.find((o) => o.name === "Over" && o.point === 2.5)?.price || 2.0;
  const under25 = totals?.outcomes.find((o) => o.name === "Under" && o.point === 2.5)?.price || 1.85;
  const bttsYes = btts?.outcomes.find((o) => o.name === "Yes")?.price || 1.9;

  // Favorito forte: odd < 1.80
  if (favoriteOdd < 1.80) {
    const confidence = Math.min(95, 70 + (1.80 - favoriteOdd) * 100);
    return {
      scenario: "favorito_forte",
      label: `Favorito Forte (${favoriteTeam})`,
      confidence,
      favoriteTeam,
      underdogTeam,
    };
  }

  // Favorito leve: 1.80 – 2.30
  if (favoriteOdd >= 1.80 && favoriteOdd <= 2.30 && underdogOdd > 3.0) {
    const confidence = Math.min(85, 60 + (2.30 - favoriteOdd) * 50);
    return {
      scenario: "favorito_leve",
      label: `Favorito Leve (${favoriteTeam})`,
      confidence,
      favoriteTeam,
      underdogTeam,
    };
  }

  // Jogo aberto: over 2.5 < 1.85 ou BTTS < 1.70
  if (over25 < 1.85 || bttsYes < 1.70) {
    const goalsSignal = (1.85 - over25) * 40 + (1.70 - bttsYes) * 30;
    return {
      scenario: "jogo_aberto",
      label: "Jogo Aberto (Tendência de Gols)",
      confidence: Math.min(90, 65 + Math.max(0, goalsSignal)),
      favoriteTeam: favoriteOdd < 2.5 ? favoriteTeam : null,
      underdogTeam: favoriteOdd < 2.5 ? underdogTeam : null,
    };
  }

  // Jogo truncado: under 2.5 baixo + empate provável
  if (under25 < 1.70 || (drawOdd < 3.0 && over25 > 2.20)) {
    const truncSignal = (1.70 - under25) * 40 + (3.0 - drawOdd) * 20;
    return {
      scenario: "jogo_truncado",
      label: "Jogo Truncado (Poucos Gols)",
      confidence: Math.min(88, 60 + Math.max(0, truncSignal)),
      favoriteTeam: favoriteOdd < 2.3 ? favoriteTeam : null,
      underdogTeam: favoriteOdd < 2.3 ? underdogTeam : null,
    };
  }

  // Jogo equilibrado
  const balance = Math.abs(homeOdd - awayOdd);
  const eqConfidence = Math.min(85, 55 + (1 - Math.min(balance, 1)) * 30);
  return {
    scenario: "jogo_equilibrado",
    label: "Jogo Equilibrado",
    confidence: eqConfidence,
    favoriteTeam: favoriteOdd < 2.5 ? favoriteTeam : null,
    underdogTeam: favoriteOdd < 2.5 ? underdogTeam : null,
  };
}

// =============================================
// 2. POOL DE SELEÇÕES POR CENÁRIO
// =============================================

interface SelectionCandidate {
  market: string;
  selection: string;
  odd: number;
  tags: string[]; // tags para correlação
}

function getOutcome(market: OddsMarket | undefined, name: string, point?: number): OddsOutcome | undefined {
  if (!market) return undefined;
  return market.outcomes.find((o) => o.name === name && (point === undefined || o.point === point));
}

function buildCandidatePool(odds: GameOdds, analysis: ScenarioAnalysis): SelectionCandidate[] {
  const candidates: SelectionCandidate[] = [];
  const h2h = odds.markets.find((m) => m.key === "h2h");
  const totals = odds.markets.find((m) => m.key === "totals");
  const btts = odds.markets.find((m) => m.key === "btts");
  const h2h_h1 = odds.markets.find((m) => m.key === "h2h_h1");
  const totals_h1 = odds.markets.find((m) => m.key === "totals_h1");
  const spreads = odds.markets.find((m) => m.key === "spreads");

  const home = odds.homeTeam;
  const away = odds.awayTeam;
  const fav = analysis.favoriteTeam;
  const dog = analysis.underdogTeam;

  // === RESULTADO 1X2 ===
  const homeW = getOutcome(h2h, home);
  const awayW = getOutcome(h2h, away);
  const draw = getOutcome(h2h, "Draw");

  if (homeW) candidates.push({ market: "Resultado (1X2)", selection: `${home} vence`, odd: homeW.price, tags: ["home_win", "gols_home"] });
  if (awayW) candidates.push({ market: "Resultado (1X2)", selection: `${away} vence`, odd: awayW.price, tags: ["away_win", "gols_away"] });
  if (draw) candidates.push({ market: "Resultado (1X2)", selection: "Empate", odd: draw.price, tags: ["empate", "truncado"] });

  // === DUPLA CHANCE (calculada) ===
  if (homeW && draw) {
    const dc = 1 / (1 / homeW.price + 1 / draw.price);
    candidates.push({ market: "Dupla Chance", selection: `${home} ou Empate`, odd: +dc.toFixed(2), tags: ["home_win", "empate", "seguro"] });
  }
  if (awayW && draw) {
    const dc = 1 / (1 / awayW.price + 1 / draw.price);
    candidates.push({ market: "Dupla Chance", selection: `${away} ou Empate`, odd: +dc.toFixed(2), tags: ["away_win", "empate", "seguro"] });
  }
  if (homeW && awayW) {
    const dc = 1 / (1 / homeW.price + 1 / awayW.price);
    candidates.push({ market: "Dupla Chance", selection: `${home} ou ${away}`, odd: +dc.toFixed(2), tags: ["gols", "sem_empate"] });
  }

  // === OVER/UNDER ===
  for (const pt of [1.5, 2.5, 3.5]) {
    const over = getOutcome(totals, "Over", pt);
    const under = getOutcome(totals, "Under", pt);
    if (over) candidates.push({ market: "Over/Under", selection: `Over ${pt} gols`, odd: over.price, tags: ["gols", "over", `over_${pt}`] });
    if (under) candidates.push({ market: "Over/Under", selection: `Under ${pt} gols`, odd: under.price, tags: ["sem_gols", "under", `under_${pt}`] });
  }

  // === AMBAS MARCAM ===
  const bttsY = getOutcome(btts, "Yes");
  const bttsN = getOutcome(btts, "No");
  if (bttsY) candidates.push({ market: "Ambas Marcam", selection: "Sim", odd: bttsY.price, tags: ["gols", "btts_sim", "aberto"] });
  if (bttsN) candidates.push({ market: "Ambas Marcam", selection: "Não", odd: bttsN.price, tags: ["btts_nao", "truncado", "favorito"] });

  // === 1º TEMPO ===
  const homeH1 = getOutcome(h2h_h1, home);
  const awayH1 = getOutcome(h2h_h1, away);
  const drawH1 = getOutcome(h2h_h1, "Draw");
  if (homeH1) candidates.push({ market: "Resultado 1ºT", selection: `${home} vence 1ºT`, odd: homeH1.price, tags: ["home_win", "primeiro_tempo", "exotico"] });
  if (awayH1) candidates.push({ market: "Resultado 1ºT", selection: `${away} vence 1ºT`, odd: awayH1.price, tags: ["away_win", "primeiro_tempo", "exotico"] });
  if (drawH1) candidates.push({ market: "Resultado 1ºT", selection: "Empate 1ºT", odd: drawH1.price, tags: ["empate", "primeiro_tempo", "truncado"] });

  // === OVER/UNDER 1ºT ===
  for (const pt of [0.5, 1.5]) {
    const over = getOutcome(totals_h1, "Over", pt);
    const under = getOutcome(totals_h1, "Under", pt);
    if (over) candidates.push({ market: "Over/Under 1ºT", selection: `Over ${pt} gols 1ºT`, odd: over.price, tags: ["gols", "primeiro_tempo", `over_h1_${pt}`] });
    if (under) candidates.push({ market: "Over/Under 1ºT", selection: `Under ${pt} gols 1ºT`, odd: under.price, tags: ["sem_gols", "primeiro_tempo", `under_h1_${pt}`] });
  }

  // === HANDICAP ===
  const homeSpread = getOutcome(spreads, home);
  const awaySpread = getOutcome(spreads, away);
  if (homeSpread && homeSpread.point !== undefined) {
    candidates.push({ market: "Handicap", selection: `${home} ${homeSpread.point > 0 ? "+" : ""}${homeSpread.point}`, odd: homeSpread.price, tags: homeSpread.point < 0 ? ["home_win", "favorito"] : ["away_win", "underdog"] });
  }
  if (awaySpread && awaySpread.point !== undefined) {
    candidates.push({ market: "Handicap", selection: `${away} ${awaySpread.point > 0 ? "+" : ""}${awaySpread.point}`, odd: awaySpread.price, tags: awaySpread.point < 0 ? ["away_win", "favorito"] : ["home_win", "underdog"] });
  }

  // === INTERVALO/FINAL (combinações para modos agressivos) ===
  if (homeH1 && homeW) {
    candidates.push({
      market: "Intervalo/Final",
      selection: `${home} / ${home}`,
      odd: +(homeH1.price * homeW.price * 0.65).toFixed(2), // desconto correlação
      tags: ["home_win", "intervalo_final", "exotico"],
    });
  }
  if (drawH1 && homeW) {
    candidates.push({
      market: "Intervalo/Final",
      selection: `Empate / ${home}`,
      odd: +(drawH1.price * homeW.price * 0.75).toFixed(2),
      tags: ["home_win", "intervalo_final", "exotico", "truncado_1t"],
    });
  }
  if (drawH1 && awayW) {
    candidates.push({
      market: "Intervalo/Final",
      selection: `Empate / ${away}`,
      odd: +(drawH1.price * awayW.price * 0.75).toFixed(2),
      tags: ["away_win", "intervalo_final", "exotico", "truncado_1t"],
    });
  }
  if (awayH1 && awayW) {
    candidates.push({
      market: "Intervalo/Final",
      selection: `${away} / ${away}`,
      odd: +(awayH1.price * awayW.price * 0.65).toFixed(2),
      tags: ["away_win", "intervalo_final", "exotico"],
    });
  }

  return candidates;
}

// =============================================
// 3. CORRELAÇÃO INTELIGENTE
// =============================================

// Pares que se reforçam
const POSITIVE_CORRELATIONS: [string, string][] = [
  ["home_win", "gols_home"],
  ["away_win", "gols_away"],
  ["gols", "over"],
  ["gols", "btts_sim"],
  ["btts_sim", "over"],
  ["aberto", "over"],
  ["truncado", "under"],
  ["truncado", "btts_nao"],
  ["empate", "truncado"],
  ["favorito", "btts_nao"],
  ["sem_gols", "under"],
  ["primeiro_tempo", "exotico"],
];

// Pares que se contradizem
const NEGATIVE_CORRELATIONS: [string, string][] = [
  ["under", "btts_sim"],
  ["over", "btts_nao"],
  ["empate", "home_win"],
  ["empate", "away_win"],
  ["home_win", "away_win"],
  ["gols", "sem_gols"],
  ["truncado", "aberto"],
  ["under_2.5", "over_3.5"],
  ["under_1.5", "over_2.5"],
  ["under_1.5", "btts_sim"],
];

function getCorrelationScore(selections: SelectionCandidate[]): number {
  if (selections.length <= 1) return 80;

  let positiveHits = 0;
  let negativeHits = 0;
  let totalChecks = 0;

  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      const tagsA = selections[i].tags;
      const tagsB = selections[j].tags;

      for (const [a, b] of POSITIVE_CORRELATIONS) {
        if ((tagsA.includes(a) && tagsB.includes(b)) || (tagsA.includes(b) && tagsB.includes(a))) {
          positiveHits++;
          totalChecks++;
        }
      }
      for (const [a, b] of NEGATIVE_CORRELATIONS) {
        if ((tagsA.includes(a) && tagsB.includes(b)) || (tagsA.includes(b) && tagsB.includes(a))) {
          negativeHits++;
          totalChecks++;
        }
      }
    }
  }

  if (totalChecks === 0) return 65;

  // Cada hit negativo pesa -30, cada positivo +15
  const raw = 70 + positiveHits * 15 - negativeHits * 30;
  return Math.max(0, Math.min(100, raw));
}

function hasConflict(selections: SelectionCandidate[], homeTeam?: string, awayTeam?: string): boolean {
  // Fase 1: Tag-based (rápido)
  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      const tagsA = selections[i].tags;
      const tagsB = selections[j].tags;
      for (const [a, b] of NEGATIVE_CORRELATIONS) {
        if ((tagsA.includes(a) && tagsB.includes(b)) || (tagsA.includes(b) && tagsB.includes(a))) {
          return true;
        }
      }
    }
  }

  // Fase 2: Validação semântica profunda (se temos os nomes dos times)
  if (homeTeam && awayTeam) {
    if (hasImpossibleConflict(toBetSelections(selections), homeTeam, awayTeam)) {
      return true;
    }
  }

  return false;
}

// =============================================
// 4. SCORE DE QUALIDADE
// =============================================

function calculateQualityScore(
  selections: SelectionCandidate[],
  totalOdd: number,
  scenario: GameScenario,
  profile?: RiskProfile
): QualityScore {
  // Coerência do cenário (0–25)
  const scenarioTags: Record<GameScenario, string[]> = {
    favorito_forte: ["home_win", "away_win", "favorito", "btts_nao", "over"],
    favorito_leve: ["home_win", "away_win", "favorito", "gols", "seguro"],
    jogo_equilibrado: ["empate", "seguro", "gols", "truncado"],
    jogo_aberto: ["gols", "over", "btts_sim", "aberto"],
    jogo_truncado: ["truncado", "under", "btts_nao", "empate", "sem_gols"],
  };
  const relevantTags = scenarioTags[scenario];
  const matchingTags = selections.reduce((count, s) => {
    return count + s.tags.filter((t) => relevantTags.includes(t)).length;
  }, 0);
  const totalTags = selections.reduce((c, s) => c + s.tags.length, 0);
  const coherence = totalTags > 0 ? Math.min(25, Math.round((matchingTags / totalTags) * 25)) : 10;

  // Número de seleções (0–20) — perfis extremos aceitam mais seleções sem penalização
  const isHighRiskProfile = profile === "extremo" || profile === "ultra_agressivo" || profile === "muito_agressivo";
  let selCountScore: number;
  if (isHighRiskProfile) {
    selCountScore = selections.length <= 3 ? 20 : selections.length <= 4 ? 18 : selections.length <= 5 ? 16 : 14;
  } else {
    selCountScore = selections.length <= 2 ? 20 : selections.length <= 3 ? 16 : selections.length <= 4 ? 12 : selections.length <= 5 ? 8 : 4;
  }

  // Risco da odd (0–20) — perfis extremos não penalizam odds altas
  let oddRisk = 20;
  if (profile === "extremo") {
    // Para perfil extremo, odds altas são DESEJÁVEIS — não penalizar
    if (totalOdd >= 80) oddRisk = 20;
    else if (totalOdd >= 50) oddRisk = 16;
    else if (totalOdd >= 20) oddRisk = 12;
    else oddRisk = 6; // penalizar odds BAIXAS no perfil extremo
  } else if (profile === "ultra_agressivo") {
    if (totalOdd >= 20) oddRisk = 18;
    else if (totalOdd >= 10) oddRisk = 16;
    else if (totalOdd > 5) oddRisk = 14;
    else oddRisk = 10;
  } else {
    if (totalOdd > 50) oddRisk = 4;
    else if (totalOdd > 20) oddRisk = 8;
    else if (totalOdd > 10) oddRisk = 12;
    else if (totalOdd > 5) oddRisk = 16;
  }

  // Tipo de mercado (0–15) — mercados principais valem mais
  const mainMarkets = ["Resultado (1X2)", "Over/Under", "Ambas Marcam", "Dupla Chance"];
  const mainCount = selections.filter((s) => mainMarkets.includes(s.market)).length;
  const marketType = Math.min(15, Math.round((mainCount / Math.max(1, selections.length)) * 15));

  // Correlação (0–20)
  const correlationRaw = getCorrelationScore(selections);
  const correlation = Math.round((correlationRaw / 100) * 20);

  const total = coherence + selCountScore + oddRisk + marketType + correlation;
  const label = total >= 85 ? "excelente" as const : total >= 70 ? "boa" as const : "descartada" as const;

  return { total, coherence, selectionCount: selCountScore, oddRisk, marketType, correlation, label };
}

// =============================================
// 5. GESTÃO DE BANCA
// =============================================

interface BankLayer {
  label: string;
  oddMin: number;
  oddMax: number;
  maxSelections: number;
  stakePercent: number;
  riskLevel: BetRiskLevel;
}

function getBankDistribution(profile: RiskProfile, betCount: number, totalInvestment: number): BankLayer[] {
  const configs: Record<RiskProfile, BankLayer[]> = {
    conservador: [
      { label: "Base Segura", oddMin: 1.5, oddMax: 1.9, maxSelections: 1, stakePercent: 0.50, riskLevel: "baixo" },
      { label: "Base", oddMin: 1.9, oddMax: 2.2, maxSelections: 2, stakePercent: 0.30, riskLevel: "baixo" },
      { label: "Moderada", oddMin: 2.2, oddMax: 2.5, maxSelections: 2, stakePercent: 0.20, riskLevel: "medio" },
    ],
    moderado: [
      { label: "Base", oddMin: 2.0, oddMax: 2.5, maxSelections: 2, stakePercent: 0.50, riskLevel: "baixo" },
      { label: "Média", oddMin: 2.5, oddMax: 3.2, maxSelections: 2, stakePercent: 0.30, riskLevel: "medio" },
      { label: "Agressiva", oddMin: 3.2, oddMax: 4.0, maxSelections: 3, stakePercent: 0.20, riskLevel: "alto" },
    ],
    agressivo: [
      { label: "Média", oddMin: 4.0, oddMax: 5.5, maxSelections: 2, stakePercent: 0.40, riskLevel: "medio" },
      { label: "Agressiva", oddMin: 5.5, oddMax: 7.5, maxSelections: 3, stakePercent: 0.30, riskLevel: "alto" },
      { label: "Muito Agressiva", oddMin: 7.5, oddMax: 10.0, maxSelections: 3, stakePercent: 0.30, riskLevel: "muito_alto" },
    ],
    muito_agressivo: [
      { label: "Moderada", oddMin: 3.0, oddMax: 5.0, maxSelections: 2, stakePercent: 0.40, riskLevel: "medio" },
      { label: "Agressiva", oddMin: 8.0, oddMax: 14.0, maxSelections: 3, stakePercent: 0.35, riskLevel: "alto" },
      { label: "Muito Agressiva", oddMin: 14.0, oddMax: 20.0, maxSelections: 4, stakePercent: 0.25, riskLevel: "muito_alto" },
    ],
    ultra_agressivo: [
      { label: "Ultra I", oddMin: 20.0, oddMax: 28.0, maxSelections: 5, stakePercent: 0.40, riskLevel: "muito_alto" },
      { label: "Ultra II", oddMin: 28.0, oddMax: 35.0, maxSelections: 5, stakePercent: 0.35, riskLevel: "extremo" },
      { label: "Ultra III", oddMin: 35.0, oddMax: 40.0, maxSelections: 5, stakePercent: 0.25, riskLevel: "extremo" },
    ],
    extremo: [
      { label: "Extrema I", oddMin: 80.0, oddMax: 120.0, maxSelections: 6, stakePercent: 0.40, riskLevel: "extremo" },
      { label: "Extrema II", oddMin: 120.0, oddMax: 160.0, maxSelections: 6, stakePercent: 0.35, riskLevel: "extremo" },
      { label: "Extrema III", oddMin: 160.0, oddMax: 200.0, maxSelections: 6, stakePercent: 0.25, riskLevel: "extremo" },
    ],
  };

  let layers = configs[profile];

  // Se o usuário quer mais apostas, subdividir camadas
  if (betCount > layers.length) {
    const extra = betCount - layers.length;
    const middleIdx = Math.min(1, layers.length - 1);
    const middle = layers[middleIdx];
    const range = middle.oddMax - middle.oddMin;
    const subStake = middle.stakePercent / (extra + 1);

    const newLayers: BankLayer[] = [];
    for (let i = 0; i < layers.length; i++) {
      if (i === middleIdx) {
        for (let j = 0; j <= extra; j++) {
          const subMin = middle.oddMin + (range / (extra + 1)) * j;
          const subMax = middle.oddMin + (range / (extra + 1)) * (j + 1);
          newLayers.push({ ...middle, oddMin: +subMin.toFixed(2), oddMax: +subMax.toFixed(2), stakePercent: subStake, label: `${middle.label} ${j + 1}` });
        }
      } else {
        newLayers.push(layers[i]);
      }
    }
    layers = newLayers;
  } else if (betCount < layers.length) {
    layers = layers.slice(0, betCount);
    // Renormalizar stakes
    const totalStake = layers.reduce((s, l) => s + l.stakePercent, 0);
    layers = layers.map((l) => ({ ...l, stakePercent: l.stakePercent / totalStake }));
  }

  return layers;
}

// =============================================
// 6. GERAÇÃO DE COMBINAÇÕES
// =============================================

function generateCombinations(
  candidates: SelectionCandidate[],
  maxSelections: number,
  oddMin: number,
  oddMax: number,
  homeTeam?: string,
  awayTeam?: string
): { selections: SelectionCandidate[]; totalOdd: number }[] {
  const results: { selections: SelectionCandidate[]; totalOdd: number }[] = [];
  const MAX_RESULTS = 500;

  // Gerar combinações recursivamente com early pruning
  function combine(
    start: number,
    current: SelectionCandidate[],
    oddAcc: number,
    pool: SelectionCandidate[]
  ) {
    if (results.length >= MAX_RESULTS) return;

    // Odd acumulada já excede máximo — podar ramo inteiro
    if (oddAcc > oddMax) return;

    // Combo válida: verificar se está no range
    if (current.length >= 1 && oddAcc >= oddMin && oddAcc <= oddMax) {
      if (!hasConflict(current, homeTeam, awayTeam)) {
        results.push({ selections: [...current], totalOdd: +oddAcc.toFixed(2) });
      }
    }

    // Atingiu tamanho máximo
    if (current.length >= maxSelections) return;

    for (let i = start; i < pool.length; i++) {
      const nextOdd = oddAcc * pool[i].odd;
      // Early pruning: se a odd parcial já excede o máximo, pular
      if (nextOdd > oddMax) continue;
      current.push(pool[i]);
      combine(i + 1, current, nextOdd, pool);
      current.pop();
    }
  }

  // Para combos grandes (5+), limitar pool
  const pool = maxSelections >= 5 ? candidates.slice(0, maxSelections >= 6 ? 10 : 12) : candidates;
  combine(0, [], 1, pool);

  return results;
}

// =============================================
// 7. EXPLICAÇÃO DA APOSTA
// =============================================

function generateExplanation(
  selections: SelectionCandidate[],
  scenario: GameScenario,
  layer: string,
  quality: QualityScore
): string {
  const scenarioDescriptions: Record<GameScenario, string> = {
    favorito_forte: "O favorito tem grande vantagem neste jogo",
    favorito_leve: "Há um leve favorito, mas o jogo pode surpreender",
    jogo_equilibrado: "As equipes estão equilibradas nas odds",
    jogo_aberto: "Tendência de jogo com muitos gols",
    jogo_truncado: "Jogo com tendência defensiva e poucos gols",
  };

  const markets = selections.map((s) => s.selection).join(" + ");
  const qualityText = quality.total >= 85 ? "Excelente coerência" : quality.total >= 75 ? "Boa coerência" : "Coerência aceitável";

  return `${layer}: ${scenarioDescriptions[scenario]}. ${qualityText} entre seleções (${markets}). Score ${quality.total}/100.`;
}

// =============================================
// 8. HELPERS DE GERAÇÃO
// =============================================

function findBestCombo(
  candidates: SelectionCandidate[],
  layer: BankLayer,
  usedSelectionKeys: Set<string>,
  analysis: { scenario: GameScenario; confidence: number },
  minScore: number,
  profile?: RiskProfile,
  homeTeam?: string,
  awayTeam?: string
) {
  // generateCombinations já filtra conflitos via hasConflict (tag + semântico)
  const combos = generateCombinations(candidates, layer.maxSelections, layer.oddMin, layer.oddMax, homeTeam, awayTeam);

  let scored = combos.map((c) => ({
    ...c,
    quality: calculateQualityScore(c.selections, c.totalOdd, analysis.scenario, profile),
  }));

  // Filtrar por score mínimo
  scored = scored.filter((c) => c.quality.total >= minScore);

  // Filtrar seleções já usadas
  scored = scored.filter((c) =>
    !c.selections.some((s) => usedSelectionKeys.has(`${s.market}:${s.selection}`))
  );

  scored.sort((a, b) => b.quality.total - a.quality.total);
  return scored.length > 0 ? scored[0] : null;
}

function buildBet(
  combo: { selections: SelectionCandidate[]; totalOdd: number; quality: QualityScore },
  stake: number,
  layer: BankLayer,
  index: number,
  analysis: { scenario: GameScenario; confidence: number },
  homeTeam?: string,
  awayTeam?: string
): GeneratedBet {
  // Calcular coerência semântica
  const betSels = toBetSelections(combo.selections);
  let coherence: BetCoherenceInfo | undefined;
  if (homeTeam && awayTeam) {
    const result = validateBetCoherence(betSels, homeTeam, awayTeam);
    coherence = {
      score: result.score,
      label: result.label,
      conflicts: result.conflicts.map((c) => ({ reason: c.reason, severity: c.severity })),
    };
  }

  return {
    id: `bet_${index + 1}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    selections: betSels,
    totalOdd: combo.totalOdd,
    stake,
    potentialReturn: +(stake * combo.totalOdd).toFixed(2),
    riskLevel: layer.riskLevel,
    explanation: generateExplanation(combo.selections, analysis.scenario, layer.label, combo.quality),
    layer: layer.label,
    quality: combo.quality,
    coherence,
  };
}

function getProfileOddRange(profile: RiskProfile): { oddMin: number; oddMax: number; maxSelections: number; riskLevel: BetRiskLevel } {
  // Range expandido baseado em RISK_PROFILE_CONFIG (margem ±20% para fallback)
  const cfg = RISK_PROFILE_CONFIG[profile];
  const riskMap: Record<RiskProfile, BetRiskLevel> = {
    conservador: "baixo",
    moderado: "medio",
    agressivo: "alto",
    muito_agressivo: "alto",
    ultra_agressivo: "muito_alto",
    extremo: "extremo",
  };
  return {
    oddMin: +(cfg.oddMin * 0.8).toFixed(2),
    oddMax: +(cfg.oddMax * 1.2).toFixed(2),
    maxSelections: cfg.maxSelections,
    riskLevel: riskMap[profile],
  };
}

// =============================================
// 10. FUNÇÃO PRINCIPAL
// =============================================

export function generateBets(input: GameInput, odds: GameOdds): GenerationResult {
  const analysis = analyzeScenario(odds);
  const candidates = buildCandidatePool(odds, analysis);
  const layers = getBankDistribution(input.riskProfile, input.betCount, input.totalInvestment);

  const usedSelectionKeys = new Set<string>();
  const bets: GeneratedBet[] = [];

  const homeTeam = odds.homeTeam;
  const awayTeam = odds.awayTeam;

  // Gerar uma aposta para cada camada
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const minQuality = (input.riskProfile === "extremo" || input.riskProfile === "ultra_agressivo") ? 50 : 70;

    // Tentar com o range original, depois relaxar progressivamente
    let best = findBestCombo(candidates, layer, usedSelectionKeys, analysis, minQuality, input.riskProfile, homeTeam, awayTeam);

    // Relaxar: expandir range de odds em ±30%
    if (!best) {
      const relaxedLayer = { ...layer, oddMin: +(layer.oddMin * 0.7).toFixed(2), oddMax: +(layer.oddMax * 1.3).toFixed(2) };
      best = findBestCombo(candidates, relaxedLayer, usedSelectionKeys, analysis, Math.max(minQuality - 20, 30), input.riskProfile, homeTeam, awayTeam);
    }

    // Relaxar mais: qualquer odd, score mínimo 0
    if (!best) {
      const wideLayer = { ...layer, oddMin: 1.3, oddMax: Math.max(layer.oddMax * 2, 10) };
      best = findBestCombo(candidates, wideLayer, usedSelectionKeys, analysis, 0, input.riskProfile, homeTeam, awayTeam);
    }

    if (!best) continue;

    best.selections.forEach((s) => usedSelectionKeys.add(`${s.market}:${s.selection}`));
    const stake = +(input.totalInvestment * layer.stakePercent).toFixed(2);

    bets.push(buildBet(best, stake, layer, i, analysis, homeTeam, awayTeam));
  }

  // Se não gerou o número solicitado, preencher com apostas extras
  if (bets.length < input.betCount) {
    const profileConfig = getProfileOddRange(input.riskProfile);

    // Fase 1: Tentar com range do perfil, seleções não usadas, scores progressivos
    for (const minScore of [60, 40, 20, 0]) {
      if (bets.length >= input.betCount) break;

      const combos = generateCombinations(candidates, profileConfig.maxSelections, profileConfig.oddMin, profileConfig.oddMax, homeTeam, awayTeam);
      let scored = combos.map((c) => ({
        ...c,
        quality: calculateQualityScore(c.selections, c.totalOdd, analysis.scenario, input.riskProfile),
      }));

      if (minScore > 0) scored = scored.filter((c) => c.quality.total >= minScore);
      scored = scored.filter((c) => !c.selections.some((s) => usedSelectionKeys.has(`${s.market}:${s.selection}`)));
      scored.sort((a, b) => b.quality.total - a.quality.total);

      for (const combo of scored) {
        if (bets.length >= input.betCount) break;
        if (combo.selections.some((s) => usedSelectionKeys.has(`${s.market}:${s.selection}`))) continue;

        combo.selections.forEach((s) => usedSelectionKeys.add(`${s.market}:${s.selection}`));
        bets.push(buildBet(combo, 0, {
          ...profileConfig, label: `Camada ${bets.length + 1}`, stakePercent: 0,
          riskLevel: (combo.totalOdd >= 10 ? "muito_alto" : combo.totalOdd >= 5 ? "alto" : combo.totalOdd >= 3 ? "medio" : "baixo") as BetRiskLevel,
        }, bets.length, analysis, homeTeam, awayTeam));
      }
    }

    // Fase 2: Range bem amplo (1.3 a 50x), permitindo qualquer combinação coerente
    if (bets.length < input.betCount) {
      const wideCombos = generateCombinations(candidates, Math.max(profileConfig.maxSelections, 3), 1.3, 50, homeTeam, awayTeam);
      let wideScored = wideCombos.map((c) => ({
        ...c,
        quality: calculateQualityScore(c.selections, c.totalOdd, analysis.scenario, input.riskProfile),
      }));
      // Não filtrar por seleções usadas individualmente — filtrar combos já idênticos
      const existingCombos = new Set(bets.map((b) => b.selections.map((s) => `${s.market}:${s.selection}`).sort().join("|")));
      wideScored = wideScored.filter((c) => {
        const key = c.selections.map((s) => `${s.market}:${s.selection}`).sort().join("|");
        return !existingCombos.has(key);
      });
      wideScored.sort((a, b) => b.quality.total - a.quality.total);

      for (const combo of wideScored) {
        if (bets.length >= input.betCount) break;
        const key = combo.selections.map((s) => `${s.market}:${s.selection}`).sort().join("|");
        if (existingCombos.has(key)) continue;
        existingCombos.add(key);

        bets.push(buildBet(combo, 0, {
          label: `Camada ${bets.length + 1}`, oddMin: 1.3, oddMax: 50, maxSelections: 3, stakePercent: 0,
          riskLevel: (combo.totalOdd >= 10 ? "muito_alto" : combo.totalOdd >= 5 ? "alto" : combo.totalOdd >= 3 ? "medio" : "baixo") as BetRiskLevel,
        }, bets.length, analysis, homeTeam, awayTeam));
      }
    }

    // Fase 3: Último recurso — apostas simples (1 seleção cada)
    if (bets.length < input.betCount) {
      const existingCombos = new Set(bets.map((b) => b.selections.map((s) => `${s.market}:${s.selection}`).sort().join("|")));
      const singleCandidates = candidates
        .filter((c) => c.odd >= 1.3)
        .sort((a, b) => b.odd - a.odd);

      for (const cand of singleCandidates) {
        if (bets.length >= input.betCount) break;
        const key = `${cand.market}:${cand.selection}`;
        if (existingCombos.has(key)) continue;
        existingCombos.add(key);

        const singleCombo = { selections: [cand], totalOdd: cand.odd, quality: calculateQualityScore([cand], cand.odd, analysis.scenario, input.riskProfile) };
        bets.push(buildBet(singleCombo, 0, {
          label: `Simples ${bets.length + 1}`, oddMin: 1.3, oddMax: 10, maxSelections: 1, stakePercent: 0,
          riskLevel: (cand.odd >= 5 ? "alto" : cand.odd >= 3 ? "medio" : "baixo") as BetRiskLevel,
        }, bets.length, analysis, homeTeam, awayTeam));
      }
    }
  }

  // Redistribuir stakes proporcionalmente entre todas as apostas
  if (bets.length > 0) {
    const stakeEach = +(input.totalInvestment / bets.length).toFixed(2);
    for (const bet of bets) {
      bet.stake = stakeEach;
      bet.potentialReturn = +(bet.stake * bet.totalOdd).toFixed(2);
    }
  }

  // Ajustar stakes para somar exatamente o total investido
  if (bets.length > 0) {
    const totalStaked = bets.reduce((s, b) => s + b.stake, 0);
    const diff = input.totalInvestment - totalStaked;
    if (Math.abs(diff) > 0.01) {
      bets[0].stake = +(bets[0].stake + diff).toFixed(2);
      bets[0].potentialReturn = +(bets[0].stake * bets[0].totalOdd).toFixed(2);
    }
  }

  // Validar: apostas acima de 20x não podem ter mais de 20% da banca (exceto perfis extremos)
  if (input.riskProfile !== "extremo" && input.riskProfile !== "ultra_agressivo") {
    const highRiskTotal = bets.filter((b) => b.totalOdd >= 20).reduce((s, b) => s + b.stake, 0);
    const maxHighRisk = input.totalInvestment * 0.20;
    if (highRiskTotal > maxHighRisk && bets.length > 1) {
      const excess = highRiskTotal - maxHighRisk;
      const highRiskBets = bets.filter((b) => b.totalOdd >= 20);
      const safeBase = bets.find((b) => b.totalOdd < 20);
      if (highRiskBets.length > 0 && safeBase) {
        const reduceEach = excess / highRiskBets.length;
        let actualReduced = 0;
        for (const b of highRiskBets) {
          const reduction = Math.min(reduceEach, b.stake * 0.9); // nunca tirar mais de 90% do stake
          b.stake = +(b.stake - reduction).toFixed(2);
          b.potentialReturn = +(b.stake * b.totalOdd).toFixed(2);
          actualReduced += reduction;
        }
        safeBase.stake = +(safeBase.stake + actualReduced).toFixed(2);
        safeBase.potentialReturn = +(safeBase.stake * safeBase.totalOdd).toFixed(2);
      }
    }
  }

  // Análise de exposição
  const totalExposed = bets.reduce((sum, b) => sum + b.stake, 0);
  const avgOdd = bets.length > 0 ? bets.reduce((sum, b) => sum + b.totalOdd, 0) / bets.length : 0;

  let aggregateRisk: BetRiskLevel = "baixo";
  if (avgOdd > 50) aggregateRisk = "extremo";
  else if (avgOdd > 15) aggregateRisk = "muito_alto";
  else if (avgOdd > 5) aggregateRisk = "alto";
  else if (avgOdd > 2.5) aggregateRisk = "medio";

  // Distribuição por tipo
  const typeMap = new Map<string, number>();
  for (const b of bets) {
    const key = b.layer;
    typeMap.set(key, (typeMap.get(key) || 0) + b.stake);
  }
  const distributionByType = Array.from(typeMap.entries()).map(([label, amount]) => ({
    label,
    percent: totalExposed > 0 ? +((amount / totalExposed) * 100).toFixed(1) : 0,
    amount: +amount.toFixed(2),
  }));

  const highRiskPercent = totalExposed > 0
    ? +((bets.filter((b) => b.totalOdd >= 20).reduce((s, b) => s + b.stake, 0) / totalExposed) * 100).toFixed(1)
    : 0;

  const exposure: ExposureAnalysis = {
    totalExposed,
    exposedPercent: input.totalInvestment > 0 ? +((totalExposed / input.totalInvestment) * 100).toFixed(1) : 0,
    sameScenario: true,
    aggregateRisk,
    scenario: analysis.scenario,
    scenarioLabel: analysis.label,
    distributionByType,
    highRiskPercent,
    scenarioDependency: analysis.confidence,
  };

  return {
    bets,
    exposure,
    scenario: analysis.scenario,
    scenarioLabel: analysis.label,
    scenarioConfidence: analysis.confidence,
  };
}
