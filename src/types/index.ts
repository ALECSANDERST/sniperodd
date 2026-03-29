export type RiskProfile =
  | "conservador"
  | "moderado"
  | "agressivo"
  | "muito_agressivo"
  | "ultra_agressivo"
  | "extremo";

export type StakeMode = "automatico" | "manual";
export type BetRiskLevel = "baixo" | "medio" | "alto" | "muito_alto" | "extremo";

export type GameScenario =
  | "favorito_forte"
  | "favorito_leve"
  | "jogo_equilibrado"
  | "jogo_aberto"
  | "jogo_truncado";

export interface GameInput {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  totalInvestment: number;
  betCount: number;
  minOdd: number;
  maxOdd: number;
  riskProfile: RiskProfile;
  stakeMode: StakeMode;
}

export interface OddsMarket {
  key: string;
  label: string;
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface GameOdds {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  markets: OddsMarket[];
}

export interface BetSelection {
  market: string;
  selection: string;
  odd: number;
}

export interface QualityScore {
  total: number;
  coherence: number;
  selectionCount: number;
  oddRisk: number;
  marketType: number;
  correlation: number;
  label: "excelente" | "boa" | "descartada";
}

export interface GeneratedBet {
  id: string;
  selections: BetSelection[];
  totalOdd: number;
  stake: number;
  potentialReturn: number;
  riskLevel: BetRiskLevel;
  explanation: string;
  layer: string;
  quality: QualityScore;
  fixed?: boolean;
}

export interface ExposureAnalysis {
  totalExposed: number;
  exposedPercent: number;
  sameScenario: boolean;
  aggregateRisk: BetRiskLevel;
  scenario: GameScenario;
  scenarioLabel: string;
  distributionByType: { label: string; percent: number; amount: number }[];
  highRiskPercent: number;
  scenarioDependency: number;
}

export interface GenerationResult {
  bets: GeneratedBet[];
  exposure: ExposureAnalysis;
  scenario: GameScenario;
  scenarioLabel: string;
  scenarioConfidence: number;
}

export interface SportEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sport: string;
  sportKey: string;
}

export const RISK_PROFILE_CONFIG: Record<
  RiskProfile,
  { label: string; oddMin: number; oddMax: number; maxSelections: number; description: string }
> = {
  conservador: { label: "Conservador", oddMin: 1.5, oddMax: 2.5, maxSelections: 2, description: "Apostas seguras, retorno consistente" },
  moderado: { label: "Moderado", oddMin: 2.0, oddMax: 4.0, maxSelections: 3, description: "Equilíbrio entre risco e retorno" },
  agressivo: { label: "Agressivo", oddMin: 4.0, oddMax: 10.0, maxSelections: 3, description: "Odds maiores, potencial elevado" },
  muito_agressivo: { label: "Muito Agressivo", oddMin: 10.0, oddMax: 20.0, maxSelections: 4, description: "Combinações ousadas e coerentes" },
  ultra_agressivo: { label: "Ultra Agressivo", oddMin: 20.0, oddMax: 40.0, maxSelections: 5, description: "Mercados exóticos, alta alavancagem" },
  extremo: { label: "Extremo", oddMin: 80.0, oddMax: 200.0, maxSelections: 6, description: "High risk mode — foco em alavancagem" },
};
