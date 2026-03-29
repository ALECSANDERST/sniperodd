import { describe, it, expect } from "vitest";
import {
  validateBetCoherence,
  hasImpossibleConflict,
  extractConstraints,
} from "../bet-coherence-validator";
import { BetSelection } from "@/types";

const HOME = "Mirassol";
const AWAY = "Palmeiras";

function sel(market: string, selection: string, odd = 2.0): BetSelection {
  return { market, selection, odd };
}

describe("bet-coherence-validator", () => {
  // ============================================
  // IMPOSSIBILIDADES MATEMÁTICAS
  // ============================================

  describe("impossibilidades matemáticas", () => {
    it("bloqueia: time vence 1ºT + Under 0.5 1ºT", () => {
      const selections = [
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
      expect(result.conflicts.some((c) => c.severity === "impossible")).toBe(true);
    });

    it("bloqueia: Empate/Time + Time vence 1ºT (conflito HT)", () => {
      const selections = [
        sel("Intervalo/Final", `Empate / ${HOME}`),
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
      expect(result.conflicts.some((c) => c.severity === "impossible")).toBe(true);
    });

    it("bloqueia: dois resultados finais diferentes", () => {
      const selections = [
        sel("Resultado (1X2)", `${HOME} vence`),
        sel("Resultado (1X2)", `${AWAY} vence`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: Over 2.5 + Under 1.5", () => {
      const selections = [
        sel("Over/Under", "Over 2.5 gols"),
        sel("Over/Under", "Under 1.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: BTTS Sim + Under 1.5", () => {
      const selections = [
        sel("Ambas Marcam", "Sim"),
        sel("Over/Under", "Under 1.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: dois resultados de 1ºT diferentes", () => {
      const selections = [
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Resultado 1ºT", "Empate 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: Empate + Dupla Chance (Home ou Away)", () => {
      const selections = [
        sel("Resultado (1X2)", "Empate"),
        sel("Dupla Chance", `${HOME} ou ${AWAY}`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: Dupla Chance (Home ou Empate) + Away vence", () => {
      const selections = [
        sel("Dupla Chance", `${HOME} ou Empate`),
        sel("Resultado (1X2)", `${AWAY} vence`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: Over 1.5 1ºT + Under 1.5 jogo", () => {
      const selections = [
        sel("Over/Under 1ºT", "Over 1.5 gols 1ºT"),
        sel("Over/Under", "Under 1.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: Intervalo/Final (Home/Home) + Away vence", () => {
      const selections = [
        sel("Intervalo/Final", `${HOME} / ${HOME}`),
        sel("Resultado (1X2)", `${AWAY} vence`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });

    it("bloqueia: Intervalo/Final (Home/Home) + Under 0.5 1ºT", () => {
      const selections = [
        sel("Intervalo/Final", `${HOME} / ${HOME}`),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
    });
  });

  // ============================================
  // CASO REAL DO USUÁRIO
  // ============================================

  describe("caso real: contradição do exemplo do usuário", () => {
    it("bloqueia combinação: BTTS Não + Mirassol vence 1ºT + Under 0.5 1ºT + Empate/Mirassol", () => {
      const selections = [
        sel("Ambas Marcam", "Não"),
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
        sel("Intervalo/Final", `Empate / ${HOME}`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      // Deve detectar pelo menos: vence 1ºT vs under 0.5 1ºT
      expect(
        result.conflicts.some((c) =>
          c.reason.includes("Under 0.5") || c.reason.includes("under 0.5")
        )
      ).toBe(true);
    });
  });

  // ============================================
  // INCOERÊNCIAS (NÃO IMPOSSÍVEIS, MAS FRACAS)
  // ============================================

  describe("incoerências", () => {
    it("detecta incoerência: BTTS Não + Over 3.5", () => {
      const selections = [
        sel("Ambas Marcam", "Não"),
        sel("Over/Under", "Over 3.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.conflicts.some((c) => c.severity === "incoherent")).toBe(true);
    });

    it("detecta incoerência: Resultado + Dupla Chance redundante", () => {
      const selections = [
        sel("Resultado (1X2)", `${HOME} vence`),
        sel("Dupla Chance", `${HOME} ou Empate`),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.conflicts.some((c) => c.severity === "incoherent")).toBe(true);
    });
  });

  // ============================================
  // COMBINAÇÕES VÁLIDAS
  // ============================================

  describe("combinações válidas", () => {
    it("aprova: Home vence + Over 2.5 + BTTS Sim", () => {
      const selections = [
        sel("Resultado (1X2)", `${HOME} vence`),
        sel("Over/Under", "Over 2.5 gols"),
        sel("Ambas Marcam", "Sim"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it("aprova: Empate + Under 2.5", () => {
      const selections = [
        sel("Resultado (1X2)", "Empate"),
        sel("Over/Under", "Under 2.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
    });

    it("aprova: Home vence 1ºT + Over 0.5 1ºT", () => {
      const selections = [
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Over/Under 1ºT", "Over 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
    });

    it("aprova: Empate 1ºT + Under 0.5 1ºT (ambos compatíveis com 0-0 HT)", () => {
      const selections = [
        sel("Resultado 1ºT", "Empate 1ºT"),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
    });

    it("aprova: Home/Home (Intervalo/Final) + Over 0.5 1ºT", () => {
      const selections = [
        sel("Intervalo/Final", `${HOME} / ${HOME}`),
        sel("Over/Under 1ºT", "Over 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
    });

    it("aprova: seleção única sempre é válida", () => {
      const selections = [sel("Resultado (1X2)", `${HOME} vence`)];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
    });

    it("aprova: BTTS Não + Under 2.5", () => {
      const selections = [
        sel("Ambas Marcam", "Não"),
        sel("Over/Under", "Under 2.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.valid).toBe(true);
    });
  });

  // ============================================
  // hasImpossibleConflict (função rápida)
  // ============================================

  describe("hasImpossibleConflict", () => {
    it("retorna true para combinação impossível", () => {
      const selections = [
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
      ];
      expect(hasImpossibleConflict(selections, HOME, AWAY)).toBe(true);
    });

    it("retorna false para combinação válida", () => {
      const selections = [
        sel("Resultado (1X2)", `${HOME} vence`),
        sel("Over/Under", "Over 2.5 gols"),
      ];
      expect(hasImpossibleConflict(selections, HOME, AWAY)).toBe(false);
    });
  });

  // ============================================
  // SCORE DE COERÊNCIA
  // ============================================

  describe("score de coerência", () => {
    it("score 0 para impossibilidade", () => {
      const selections = [
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.score).toBe(0);
      expect(result.label).toBe("impossivel");
    });

    it("score alto para combinação coerente", () => {
      const selections = [
        sel("Resultado (1X2)", `${HOME} vence`),
        sel("Over/Under", "Over 2.5 gols"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });
  });

  // ============================================
  // SUGESTÕES
  // ============================================

  describe("sugestões", () => {
    it("sugere alternativas quando há conflito", () => {
      const selections = [
        sel("Resultado 1ºT", `${HOME} vence 1ºT`),
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
      ];
      const result = validateBetCoherence(selections, HOME, AWAY);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // extractConstraints
  // ============================================

  describe("extractConstraints", () => {
    it("extrai constraints para resultado Home vence", () => {
      const impl = extractConstraints(
        sel("Resultado (1X2)", `${HOME} vence`),
        HOME,
        AWAY
      );
      expect(impl.constraints.length).toBeGreaterThan(0);
      expect(impl.description).toContain(HOME);
    });

    it("extrai constraints para Under 0.5 1ºT", () => {
      const impl = extractConstraints(
        sel("Over/Under 1ºT", "Under 0.5 gols 1ºT"),
        HOME,
        AWAY
      );
      expect(impl.constraints.length).toBeGreaterThan(0);
      // Deve ter constraint: ht_total_goals <= 0
      const numC = impl.constraints.find(
        (c) => c.type === "numeric" && c.subject === "ht_total_goals"
      );
      expect(numC).toBeDefined();
    });

    it("extrai constraints para Intervalo/Final", () => {
      const impl = extractConstraints(
        sel("Intervalo/Final", `Empate / ${HOME}`),
        HOME,
        AWAY
      );
      // Deve ter: HT empate (relational) + FT home vence (relational)
      expect(impl.constraints.length).toBeGreaterThanOrEqual(2);
    });
  });
});
