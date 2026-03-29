// =============================================
// ENGINE DE VALIDAÇÃO DE COERÊNCIA DE APOSTAS
// =============================================
// Valida compatibilidade semântica e matemática
// entre seleções de uma aposta combinada.
//
// Cada seleção gera "constraints" sobre o estado
// da partida (placar do intervalo e final).
// Duas seleções conflitam quando suas constraints
// não podem ser simultaneamente verdadeiras.
// =============================================

import { BetSelection } from "@/types";

// =============================================
// TIPOS
// =============================================

type Comparison = ">" | ">=" | "<" | "<=" | "=" | "!=";

/** Constraint sobre um valor numérico do jogo */
interface NumericConstraint {
  subject:
    | "ht_home_goals"
    | "ht_away_goals"
    | "ht_total_goals"
    | "ft_home_goals"
    | "ft_away_goals"
    | "ft_total_goals";
  op: Comparison;
  value: number;
}

/** Constraint relacional entre dois valores */
interface RelationalConstraint {
  type: "relational";
  left: "ht_home_goals" | "ht_away_goals" | "ft_home_goals" | "ft_away_goals";
  op: Comparison;
  right: "ht_home_goals" | "ht_away_goals" | "ft_home_goals" | "ft_away_goals";
}

type Constraint = ({ type: "numeric" } & NumericConstraint) | RelationalConstraint;

interface SelectionImplication {
  market: string;
  selection: string;
  constraints: Constraint[];
  description: string; // explicação legível
}

export interface ConflictDetail {
  selectionA: { market: string; selection: string };
  selectionB: { market: string; selection: string };
  reason: string;
  severity: "impossible" | "incoherent";
}

export interface CoherenceResult {
  valid: boolean;
  score: number; // 0-100
  label: "muito_coerente" | "coerente" | "fraca" | "incoerente" | "impossivel";
  conflicts: ConflictDetail[];
  suggestions: string[];
}

// =============================================
// EXTRAÇÃO DE CONSTRAINTS POR SELEÇÃO
// =============================================

function num(
  subject: NumericConstraint["subject"],
  op: Comparison,
  value: number
): Constraint {
  return { type: "numeric", subject, op, value };
}

function rel(
  left: RelationalConstraint["left"],
  op: Comparison,
  right: RelationalConstraint["right"]
): Constraint {
  return { type: "relational", left, op, right };
}

// Cache de constraints por seleção (evita recalcular em loops combinatórios)
const constraintCache = new Map<string, SelectionImplication>();

function getConstraintCacheKey(selection: BetSelection, homeTeam: string, awayTeam: string): string {
  return `${selection.market}|${selection.selection}|${homeTeam}|${awayTeam}`;
}

/**
 * Extrai constraints semânticas de uma seleção.
 * Cada seleção implica condições sobre o estado da partida.
 * Resultados são cacheados para evitar recálculo em loops combinatórios.
 */
export function extractConstraints(
  selection: BetSelection,
  homeTeam: string,
  awayTeam: string
): SelectionImplication {
  const cacheKey = getConstraintCacheKey(selection, homeTeam, awayTeam);
  const cached = constraintCache.get(cacheKey);
  if (cached) return cached;
  const m = selection.market;
  const s = selection.selection;
  const constraints: Constraint[] = [];
  let description = "";

  // Normalizar para comparação
  const sel = s.toLowerCase().trim();
  const homeLower = homeTeam.toLowerCase().trim();
  const awayLower = awayTeam.toLowerCase().trim();

  // Helper: seleção contém time da casa ou visitante
  const isHome = sel.includes(homeLower);
  const isAway = sel.includes(awayLower);

  // =============================================
  // RESULTADO (1X2)
  // =============================================
  if (m === "Resultado (1X2)") {
    if (sel.includes("empate")) {
      constraints.push(rel("ft_home_goals", "=", "ft_away_goals"));
      description = "Placar final empatado";
    } else if (isHome && sel.includes("vence")) {
      constraints.push(rel("ft_home_goals", ">", "ft_away_goals"));
      constraints.push(num("ft_home_goals", ">=", 1));
      description = `${homeTeam} vence (pelo menos 1 gol mandante)`;
    } else if (isAway && sel.includes("vence")) {
      constraints.push(rel("ft_away_goals", ">", "ft_home_goals"));
      constraints.push(num("ft_away_goals", ">=", 1));
      description = `${awayTeam} vence (pelo menos 1 gol visitante)`;
    }
  }

  // =============================================
  // DUPLA CHANCE
  // =============================================
  if (m === "Dupla Chance") {
    if (sel.includes("empate") && isHome) {
      // Home ou Empate → away não vence
      constraints.push(rel("ft_home_goals", ">=", "ft_away_goals"));
      description = `${homeTeam} vence ou empata`;
    } else if (sel.includes("empate") && isAway) {
      constraints.push(rel("ft_away_goals", ">=", "ft_home_goals"));
      description = `${awayTeam} vence ou empata`;
    } else if (isHome && isAway) {
      // Home ou Away → sem empate
      constraints.push(rel("ft_home_goals", "!=", "ft_away_goals"));
      constraints.push(num("ft_total_goals", ">=", 1));
      description = "Sem empate (pelo menos 1 gol)";
    }
  }

  // =============================================
  // OVER/UNDER (JOGO COMPLETO)
  // =============================================
  if (m === "Over/Under") {
    const overMatch = sel.match(/over\s+([\d.]+)/);
    const underMatch = sel.match(/under\s+([\d.]+)/);
    if (overMatch) {
      const line = parseFloat(overMatch[1]);
      const minGoals = Math.ceil(line);
      constraints.push(num("ft_total_goals", ">=", minGoals));
      description = `Mínimo ${minGoals} gols no jogo`;
    } else if (underMatch) {
      const line = parseFloat(underMatch[1]);
      const maxGoals = Math.floor(line);
      constraints.push(num("ft_total_goals", "<=", maxGoals));
      description = `Máximo ${maxGoals} gols no jogo`;
    }
  }

  // =============================================
  // AMBAS MARCAM
  // =============================================
  if (m === "Ambas Marcam") {
    if (sel === "sim") {
      constraints.push(num("ft_home_goals", ">=", 1));
      constraints.push(num("ft_away_goals", ">=", 1));
      constraints.push(num("ft_total_goals", ">=", 2));
      description = "Ambos os times marcam (mínimo 2 gols)";
    } else if (sel.startsWith("n")) {
      // "não" — pelo menos um time não marca (home=0 OR away=0)
      // Não podemos representar OR em constraints, mas marcamos com tag especial
      // para que as regras semânticas detectem conflitos (ex: BTTS:Não + Over 3.5)
      // Constraint mínima: o total de gols não é restrito, mas sinalizamos a seleção
      description = "Pelo menos um time não marca";
    }
  }

  // =============================================
  // RESULTADO 1º TEMPO
  // =============================================
  if (m === "Resultado 1ºT") {
    if (sel.includes("empate")) {
      constraints.push(rel("ht_home_goals", "=", "ht_away_goals"));
      description = "Empate no intervalo";
    } else if (isHome && sel.includes("vence")) {
      constraints.push(rel("ht_home_goals", ">", "ht_away_goals"));
      constraints.push(num("ht_home_goals", ">=", 1));
      constraints.push(num("ht_total_goals", ">=", 1));
      description = `${homeTeam} vencendo no intervalo (mínimo 1 gol 1ºT)`;
    } else if (isAway && sel.includes("vence")) {
      constraints.push(rel("ht_away_goals", ">", "ht_home_goals"));
      constraints.push(num("ht_away_goals", ">=", 1));
      constraints.push(num("ht_total_goals", ">=", 1));
      description = `${awayTeam} vencendo no intervalo (mínimo 1 gol 1ºT)`;
    }
  }

  // =============================================
  // OVER/UNDER 1º TEMPO
  // =============================================
  if (m === "Over/Under 1ºT") {
    const overMatch = sel.match(/over\s+([\d.]+)/);
    const underMatch = sel.match(/under\s+([\d.]+)/);
    if (overMatch) {
      const line = parseFloat(overMatch[1]);
      const minGoals = Math.ceil(line);
      constraints.push(num("ht_total_goals", ">=", minGoals));
      description = `Mínimo ${minGoals} gols no 1º tempo`;
    } else if (underMatch) {
      const line = parseFloat(underMatch[1]);
      const maxGoals = Math.floor(line);
      constraints.push(num("ht_total_goals", "<=", maxGoals));
      description = `Máximo ${maxGoals} gols no 1º tempo`;
    }
  }

  // =============================================
  // HANDICAP
  // =============================================
  if (m === "Handicap") {
    const handicapMatch = sel.match(/([+-]?\d+\.?\d*)\s*$/);
    if (handicapMatch) {
      const handicap = parseFloat(handicapMatch[1]);
      if (isHome) {
        // Home com handicap: home_goals + handicap > away_goals
        if (handicap < 0) {
          // Home -1.5: precisa vencer por 2+
          const marginNeeded = Math.ceil(Math.abs(handicap));
          constraints.push(num("ft_home_goals", ">=", marginNeeded));
          description = `${homeTeam} vence por ${marginNeeded}+ gols`;
        } else {
          // Home +1.5: pode perder por até 1
          description = `${homeTeam} com handicap +${handicap}`;
        }
      } else if (isAway) {
        if (handicap < 0) {
          const marginNeeded = Math.ceil(Math.abs(handicap));
          constraints.push(num("ft_away_goals", ">=", marginNeeded));
          description = `${awayTeam} vence por ${marginNeeded}+ gols`;
        } else {
          description = `${awayTeam} com handicap +${handicap}`;
        }
      }
    }
  }

  // =============================================
  // INTERVALO/FINAL
  // =============================================
  if (m === "Intervalo/Final") {
    // Formato: "HT_Result / FT_Result"
    const parts = s.split("/").map((p) => p.trim().toLowerCase());
    if (parts.length === 2) {
      const [htPart, ftPart] = parts;

      // HT constraints
      if (htPart.includes("empate")) {
        constraints.push(rel("ht_home_goals", "=", "ht_away_goals"));
      } else if (htPart.includes(homeLower)) {
        constraints.push(rel("ht_home_goals", ">", "ht_away_goals"));
        constraints.push(num("ht_total_goals", ">=", 1));
      } else if (htPart.includes(awayLower)) {
        constraints.push(rel("ht_away_goals", ">", "ht_home_goals"));
        constraints.push(num("ht_total_goals", ">=", 1));
      }

      // FT constraints
      if (ftPart.includes("empate")) {
        constraints.push(rel("ft_home_goals", "=", "ft_away_goals"));
      } else if (ftPart.includes(homeLower)) {
        constraints.push(rel("ft_home_goals", ">", "ft_away_goals"));
        constraints.push(num("ft_home_goals", ">=", 1));
      } else if (ftPart.includes(awayLower)) {
        constraints.push(rel("ft_away_goals", ">", "ft_home_goals"));
        constraints.push(num("ft_away_goals", ">=", 1));
      }

      description = `Intervalo: ${parts[0]} / Final: ${parts[1]}`;
    }
  }

  const result = { market: m, selection: s, constraints, description };
  constraintCache.set(cacheKey, result);
  return result;
}

// =============================================
// VERIFICAÇÃO DE CONFLITOS ENTRE CONSTRAINTS
// =============================================

/**
 * Verifica se duas constraints numéricas sobre o mesmo subject são contraditórias.
 */
function numericConflict(a: NumericConstraint, b: NumericConstraint): boolean {
  if (a.subject !== b.subject) return false;

  // Gerar range permitido por cada constraint e verificar interseção
  // a.op a.value vs b.op b.value
  const aRange = constraintToRange(a);
  const bRange = constraintToRange(b);

  return aRange.max < bRange.min || bRange.max < aRange.min;
}

function constraintToRange(c: NumericConstraint): { min: number; max: number } {
  const MAX_GOALS = 20; // teto prático
  switch (c.op) {
    case ">=":
      return { min: c.value, max: MAX_GOALS };
    case ">":
      return { min: c.value + 1, max: MAX_GOALS };
    case "<=":
      return { min: 0, max: c.value };
    case "<":
      return { min: 0, max: c.value - 1 };
    case "=":
      return { min: c.value, max: c.value };
    case "!=":
      return { min: 0, max: MAX_GOALS }; // não restringe range
  }
}

/**
 * Verifica se duas constraints relacionais são contraditórias.
 */
function relationalConflict(a: RelationalConstraint, b: RelationalConstraint): boolean {
  // Mesmos subjects
  if (a.left === b.left && a.right === b.right) {
    return areOpsContradictory(a.op, b.op);
  }
  // Subjects invertidos
  if (a.left === b.right && a.right === b.left) {
    return areOpsContradictory(a.op, invertOp(b.op));
  }
  return false;
}

function areOpsContradictory(a: Comparison, b: Comparison): boolean {
  const contradictions: [Comparison, Comparison][] = [
    [">", "="],
    [">", "<"],
    [">", "<="],
    [">=", "<"],
    ["<", "="],
    ["<", ">"],
    ["<", ">="],
    ["<=", ">"],
    ["=", "!="],
    ["=", ">"],
    ["=", "<"],
  ];
  return contradictions.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x)
  );
}

function invertOp(op: Comparison): Comparison {
  switch (op) {
    case ">": return "<";
    case "<": return ">";
    case ">=": return "<=";
    case "<=": return ">=";
    case "=": return "=";
    case "!=": return "!=";
  }
}

/**
 * Verifica conflito entre uma constraint relacional e uma numérica.
 * Ex: ht_home > ht_away (time vence HT) vs ht_total <= 0 (under 0.5 HT)
 */
function mixedConflict(
  relC: RelationalConstraint,
  numC: NumericConstraint
): boolean {
  // Se relacional exige A > B, então total >= 1 para HT goals
  if (relC.op === ">" || relC.op === ">=") {
    // A > B implica A >= 1 se estamos falando de gols

    // Caso: "home > away" no HT + "ht_total <= 0"
    if (
      relC.left === "ht_home_goals" &&
      relC.right === "ht_away_goals" &&
      numC.subject === "ht_total_goals"
    ) {
      if (relC.op === ">") {
        // home > away implica total >= 1
        if (numC.op === "<=" && numC.value < 1) return true;
        if (numC.op === "=" && numC.value < 1) return true;
        if (numC.op === "<" && numC.value <= 1) return true;
      }
    }

    if (
      relC.left === "ht_away_goals" &&
      relC.right === "ht_home_goals" &&
      numC.subject === "ht_total_goals"
    ) {
      if (relC.op === ">") {
        if (numC.op === "<=" && numC.value < 1) return true;
        if (numC.op === "=" && numC.value < 1) return true;
        if (numC.op === "<" && numC.value <= 1) return true;
      }
    }

    // Caso: "home > away" FT + "ft_total <= 0"
    if (
      relC.left === "ft_home_goals" &&
      relC.right === "ft_away_goals" &&
      numC.subject === "ft_total_goals"
    ) {
      if (relC.op === ">") {
        if (numC.op === "<=" && numC.value < 1) return true;
        if (numC.op === "=" && numC.value < 1) return true;
      }
    }
    if (
      relC.left === "ft_away_goals" &&
      relC.right === "ft_home_goals" &&
      numC.subject === "ft_total_goals"
    ) {
      if (relC.op === ">") {
        if (numC.op === "<=" && numC.value < 1) return true;
        if (numC.op === "=" && numC.value < 1) return true;
      }
    }
  }

  // Empate (A = B) com home_goals >= N ou away_goals >= N não é conflito direto
  // Mas empate (A = B) com total <= 0 em FT é OK (0-0)

  // Home > Away implica home >= 1
  if (
    relC.op === ">" &&
    relC.left === "ft_home_goals" &&
    relC.right === "ft_away_goals" &&
    numC.subject === "ft_home_goals"
  ) {
    if (numC.op === "<=" && numC.value < 1) return true;
    if (numC.op === "=" && numC.value === 0) return true;
  }
  if (
    relC.op === ">" &&
    relC.left === "ft_away_goals" &&
    relC.right === "ft_home_goals" &&
    numC.subject === "ft_away_goals"
  ) {
    if (numC.op === "<=" && numC.value < 1) return true;
    if (numC.op === "=" && numC.value === 0) return true;
  }

  // HT versions
  if (
    relC.op === ">" &&
    relC.left === "ht_home_goals" &&
    relC.right === "ht_away_goals" &&
    numC.subject === "ht_home_goals"
  ) {
    if (numC.op === "<=" && numC.value < 1) return true;
    if (numC.op === "=" && numC.value === 0) return true;
  }
  if (
    relC.op === ">" &&
    relC.left === "ht_away_goals" &&
    relC.right === "ht_home_goals" &&
    numC.subject === "ht_away_goals"
  ) {
    if (numC.op === "<=" && numC.value < 1) return true;
    if (numC.op === "=" && numC.value === 0) return true;
  }

  // Empate no HT (A = B) + "home vence HT" não pode — mas isso é relational vs relational
  // Empate FT (A = B) + ft_home >= 1 é OK (1-1, 2-2, etc.)

  return false;
}

/**
 * Verifica se dois conjuntos de constraints de duas seleções têm conflito.
 */
function checkConstraintConflict(
  implA: SelectionImplication,
  implB: SelectionImplication
): ConflictDetail | null {
  for (const cA of implA.constraints) {
    for (const cB of implB.constraints) {
      let conflict = false;

      if (cA.type === "numeric" && cB.type === "numeric") {
        conflict = numericConflict(cA, cB);
      } else if (cA.type === "relational" && cB.type === "relational") {
        conflict = relationalConflict(cA, cB);
      } else if (cA.type === "relational" && cB.type === "numeric") {
        conflict = mixedConflict(cA, cB);
      } else if (cA.type === "numeric" && cB.type === "relational") {
        conflict = mixedConflict(cB, cA);
      }

      if (conflict) {
        return {
          selectionA: { market: implA.market, selection: implA.selection },
          selectionB: { market: implB.market, selection: implB.selection },
          reason: buildConflictReason(implA, implB),
          severity: "impossible",
        };
      }
    }
  }
  return null;
}

// =============================================
// REGRAS DE INCOMPATIBILIDADE SEMÂNTICA
// Cobre casos que constraints puras não pegam
// =============================================

interface SemanticRule {
  /** Retorna conflito se as duas seleções forem incompatíveis */
  check: (
    a: BetSelection,
    b: BetSelection,
    homeTeam: string,
    awayTeam: string
  ) => ConflictDetail | null;
}

const SEMANTIC_RULES: SemanticRule[] = [
  // BTTS:Não + mercados que exigem gols de ambos os times
  {
    check(a, b, home, away) {
      const bttsNo = findByMarketSel(a, b, "Ambas Marcam", (s) =>
        s.toLowerCase().startsWith("n")
      );
      if (!bttsNo) return null;
      const other = bttsNo.other;

      // Over 2.5+ com time vencendo pode implicar BTTS em muitos cenários,
      // mas não é matematicamente impossível (3-0 é over 2.5 sem BTTS)
      // Porém: BTTS:Não + "ambos marcam implícito" é conflito

      // Intervalo/Final com ambos times marcando
      // Não é diretamente detectável sem mais info

      return null;
    },
  },

  // BTTS:Sim + Under 1.5 (impossível: BTTS exige ≥2 gols)
  {
    check(a, b) {
      const bttsSim = findByMarketSel(a, b, "Ambas Marcam", (s) =>
        s.toLowerCase() === "sim"
      );
      if (!bttsSim) return null;
      const other = bttsSim.other;

      if (other.market === "Over/Under") {
        const underMatch = other.selection.toLowerCase().match(/under\s+([\d.]+)/);
        if (underMatch) {
          const line = parseFloat(underMatch[1]);
          if (line <= 1.5) {
            return {
              selectionA: { market: a.market, selection: a.selection },
              selectionB: { market: b.market, selection: b.selection },
              reason: `'Ambas Marcam: Sim' exige pelo menos 2 gols, mas 'Under ${line}' permite no máximo ${Math.floor(line)} gol(s).`,
              severity: "impossible",
            };
          }
        }
      }
      return null;
    },
  },

  // BTTS:Não + Resultado que implica ambos marcarem
  // (não é impossível: time pode vencer sem BTTS)
  // Mas: BTTS:Não + Over 3.5 é incoerente (possível mas improvável)
  {
    check(a, b) {
      const bttsNo = findByMarketSel(a, b, "Ambas Marcam", (s) =>
        s.toLowerCase().startsWith("n")
      );
      if (!bttsNo) return null;
      const other = bttsNo.other;

      if (other.market === "Over/Under") {
        const overMatch = other.selection.toLowerCase().match(/over\s+([\d.]+)/);
        if (overMatch) {
          const line = parseFloat(overMatch[1]);
          if (line >= 3.5) {
            return {
              selectionA: { market: a.market, selection: a.selection },
              selectionB: { market: b.market, selection: b.selection },
              reason: `'Ambas Marcam: Não' com 'Over ${line}' é altamente improvável — exigiria ${Math.ceil(line)}+ gols de apenas um time.`,
              severity: "incoherent",
            };
          }
        }
      }
      return null;
    },
  },

  // Empate FT + mercados que exigem vencedor
  {
    check(a, b, home, away) {
      const empate = findByMarketSel(a, b, "Resultado (1X2)", (s) =>
        s.toLowerCase().includes("empate")
      );
      if (!empate) return null;
      const other = empate.other;

      // Empate + Dupla Chance (Home ou Away) = conflito
      if (other.market === "Dupla Chance") {
        const sel = other.selection.toLowerCase();
        if (sel.includes(home.toLowerCase()) && sel.includes(away.toLowerCase()) && !sel.includes("empate")) {
          return {
            selectionA: { market: a.market, selection: a.selection },
            selectionB: { market: b.market, selection: b.selection },
            reason: `'Empate' é incompatível com '${other.selection}' que exige um vencedor.`,
            severity: "impossible",
          };
        }
      }

      return null;
    },
  },

  // Resultado FT + Resultado FT diferente (dois resultados no mesmo jogo)
  {
    check(a, b) {
      if (a.market === "Resultado (1X2)" && b.market === "Resultado (1X2)") {
        if (a.selection !== b.selection) {
          return {
            selectionA: { market: a.market, selection: a.selection },
            selectionB: { market: b.market, selection: b.selection },
            reason: `Não é possível ter dois resultados finais diferentes no mesmo jogo.`,
            severity: "impossible",
          };
        }
      }
      return null;
    },
  },

  // Resultado 1ºT + Resultado 1ºT diferente
  {
    check(a, b) {
      if (a.market === "Resultado 1ºT" && b.market === "Resultado 1ºT") {
        if (a.selection !== b.selection) {
          return {
            selectionA: { market: a.market, selection: a.selection },
            selectionB: { market: b.market, selection: b.selection },
            reason: `Não é possível ter dois resultados de 1º tempo diferentes.`,
            severity: "impossible",
          };
        }
      }
      return null;
    },
  },

  // Intervalo/Final vs Resultado 1ºT
  {
    check(a, b, home, away) {
      const htFt = findByMarket(a, b, "Intervalo/Final");
      if (!htFt) return null;
      const other = htFt.other;
      if (other.market !== "Resultado 1ºT") return null;

      const htFtSel = htFt.sel.selection.toLowerCase();
      const parts = htFtSel.split("/").map((p) => p.trim());
      if (parts.length !== 2) return null;

      const htPartIF = parts[0]; // parte do intervalo no Intervalo/Final
      const htResult = other.selection.toLowerCase();

      // Extrair resultado do HT do Intervalo/Final
      const htIFisHome = htPartIF.includes(home.toLowerCase());
      const htIFisAway = htPartIF.includes(away.toLowerCase());
      const htIFisDraw = htPartIF.includes("empate");

      const htResultIsHome = htResult.includes(home.toLowerCase()) && htResult.includes("vence");
      const htResultIsAway = htResult.includes(away.toLowerCase()) && htResult.includes("vence");
      const htResultIsDraw = htResult.includes("empate");

      // Conflito: HT parts diferentes
      if (htIFisHome && htResultIsAway) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige ${home} vencendo no intervalo, mas '${other.selection}' exige ${away} vencendo.`,
          "impossible"
        );
      }
      if (htIFisAway && htResultIsHome) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige ${away} vencendo no intervalo, mas '${other.selection}' exige ${home} vencendo.`,
          "impossible"
        );
      }
      if (htIFisDraw && (htResultIsHome || htResultIsAway)) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige empate no intervalo, mas '${other.selection}' exige um time vencendo o 1º tempo.`,
          "impossible"
        );
      }
      if ((htIFisHome || htIFisAway) && htResultIsDraw) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige um time vencendo no intervalo, mas '${other.selection}' exige empate no 1º tempo.`,
          "impossible"
        );
      }

      return null;
    },
  },

  // Intervalo/Final vs Resultado FT
  {
    check(a, b, home, away) {
      const htFt = findByMarket(a, b, "Intervalo/Final");
      if (!htFt) return null;
      const other = htFt.other;
      if (other.market !== "Resultado (1X2)") return null;

      const htFtSel = htFt.sel.selection.toLowerCase();
      const parts = htFtSel.split("/").map((p) => p.trim());
      if (parts.length !== 2) return null;

      const ftPartIF = parts[1]; // parte do final no Intervalo/Final
      const ftResult = other.selection.toLowerCase();

      const ftIFisHome = ftPartIF.includes(home.toLowerCase());
      const ftIFisAway = ftPartIF.includes(away.toLowerCase());
      const ftIFisDraw = ftPartIF.includes("empate");

      const ftResultIsHome = ftResult.includes(home.toLowerCase()) && ftResult.includes("vence");
      const ftResultIsAway = ftResult.includes(away.toLowerCase()) && ftResult.includes("vence");
      const ftResultIsDraw = ftResult.includes("empate");

      if (ftIFisHome && ftResultIsAway) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige ${home} vencendo no final, mas '${other.selection}' exige ${away} vencendo.`,
          "impossible"
        );
      }
      if (ftIFisAway && ftResultIsHome) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige ${away} vencendo no final, mas '${other.selection}' exige ${home} vencendo.`,
          "impossible"
        );
      }
      if (ftIFisDraw && (ftResultIsHome || ftResultIsAway)) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige empate no final, mas '${other.selection}' exige um vencedor.`,
          "impossible"
        );
      }
      if ((ftIFisHome || ftIFisAway) && ftResultIsDraw) {
        return makeConflict(a, b,
          `'${htFt.sel.selection}' exige um vencedor no final, mas '${other.selection}' exige empate.`,
          "impossible"
        );
      }

      return null;
    },
  },

  // Intervalo/Final vs Over/Under 1ºT
  {
    check(a, b, home, away) {
      const htFt = findByMarket(a, b, "Intervalo/Final");
      if (!htFt) return null;
      const other = htFt.other;
      if (other.market !== "Over/Under 1ºT") return null;

      const htFtSel = htFt.sel.selection.toLowerCase();
      const parts = htFtSel.split("/").map((p) => p.trim());
      if (parts.length !== 2) return null;

      const htPartIF = parts[0];
      const htTeamWins = htPartIF.includes(home.toLowerCase()) || htPartIF.includes(away.toLowerCase());
      const htIsDraw = htPartIF.includes("empate");

      const underMatch = other.selection.toLowerCase().match(/under\s+([\d.]+)/);
      if (underMatch) {
        const line = parseFloat(underMatch[1]);
        if (line <= 0.5 && htTeamWins) {
          return makeConflict(a, b,
            `'${htFt.sel.selection}' exige um time vencendo no intervalo (≥1 gol), mas 'Under ${line} 1ºT' exige 0 gols no 1º tempo.`,
            "impossible"
          );
        }
      }

      return null;
    },
  },

  // Under 0.5 1ºT + qualquer time vencendo 1ºT
  {
    check(a, b, home, away) {
      const underHT = findByMarketSel(a, b, "Over/Under 1ºT", (s) => {
        const m = s.toLowerCase().match(/under\s+([\d.]+)/);
        return m ? parseFloat(m[1]) <= 0.5 : false;
      });
      if (!underHT) return null;
      const other = underHT.other;

      if (other.market === "Resultado 1ºT") {
        const sel = other.selection.toLowerCase();
        if (sel.includes("vence")) {
          const team = sel.includes(home.toLowerCase()) ? home : away;
          return makeConflict(a, b,
            `'Under 0.5 gols 1ºT' exige 0x0 no intervalo, mas '${other.selection}' exige que ${team} esteja vencendo (≥1 gol).`,
            "impossible"
          );
        }
      }

      return null;
    },
  },

  // Over/Under conflitante no mesmo tempo (Over 2.5 + Under 1.5)
  {
    check(a, b) {
      if (a.market !== b.market) return null;
      if (a.market !== "Over/Under" && a.market !== "Over/Under 1ºT") return null;

      const aOver = a.selection.toLowerCase().match(/over\s+([\d.]+)/);
      const bUnder = b.selection.toLowerCase().match(/under\s+([\d.]+)/);
      const aUnder = a.selection.toLowerCase().match(/under\s+([\d.]+)/);
      const bOver = b.selection.toLowerCase().match(/over\s+([\d.]+)/);

      if (aOver && bUnder) {
        const overLine = parseFloat(aOver[1]);
        const underLine = parseFloat(bUnder[1]);
        if (overLine >= underLine) {
          return makeConflict(a, b,
            `'Over ${overLine}' e 'Under ${underLine}' são matematicamente impossíveis juntos.`,
            "impossible"
          );
        }
      }
      if (aUnder && bOver) {
        const underLine = parseFloat(aUnder[1]);
        const overLine = parseFloat(bOver[1]);
        if (overLine >= underLine) {
          return makeConflict(a, b,
            `'Under ${underLine}' e 'Over ${overLine}' são matematicamente impossíveis juntos.`,
            "impossible"
          );
        }
      }
      // Dois overs ou dois unders no mesmo mercado
      if (aOver && bOver) {
        return makeConflict(a, b,
          `Duas seleções de Over no mesmo mercado são redundantes.`,
          "incoherent"
        );
      }
      if (aUnder && bUnder) {
        return makeConflict(a, b,
          `Duas seleções de Under no mesmo mercado são redundantes.`,
          "incoherent"
        );
      }

      return null;
    },
  },

  // Dupla Chance + Resultado que contradiz
  {
    check(a, b, home, away) {
      const dc = findByMarket(a, b, "Dupla Chance");
      if (!dc) return null;
      const other = dc.other;
      if (other.market !== "Resultado (1X2)") return null;

      const dcSel = dc.sel.selection.toLowerCase();
      const resSel = other.selection.toLowerCase();

      // "Home ou Empate" + "Away vence" = impossível
      if (dcSel.includes(home.toLowerCase()) && dcSel.includes("empate") && resSel.includes(away.toLowerCase()) && resSel.includes("vence")) {
        return makeConflict(a, b,
          `'${dc.sel.selection}' exclui vitória de ${away}, mas '${other.selection}' exige exatamente isso.`,
          "impossible"
        );
      }
      if (dcSel.includes(away.toLowerCase()) && dcSel.includes("empate") && resSel.includes(home.toLowerCase()) && resSel.includes("vence")) {
        return makeConflict(a, b,
          `'${dc.sel.selection}' exclui vitória de ${home}, mas '${other.selection}' exige exatamente isso.`,
          "impossible"
        );
      }
      // "Home ou Away" + "Empate" = impossível
      if (dcSel.includes(home.toLowerCase()) && dcSel.includes(away.toLowerCase()) && resSel.includes("empate")) {
        return makeConflict(a, b,
          `'${dc.sel.selection}' exclui empate, mas '${other.selection}' exige empate.`,
          "impossible"
        );
      }

      return null;
    },
  },

  // HT goals constraints cross-validation: Over 1ºT vs Under jogo
  {
    check(a, b) {
      const overHT = findByMarketSel(a, b, "Over/Under 1ºT", (s) =>
        s.toLowerCase().includes("over")
      );
      if (!overHT) return null;
      const other = overHT.other;
      if (other.market !== "Over/Under") return null;

      const htOverMatch = overHT.sel.selection.toLowerCase().match(/over\s+([\d.]+)/);
      const ftUnderMatch = other.selection.toLowerCase().match(/under\s+([\d.]+)/);
      if (!htOverMatch || !ftUnderMatch) return null;

      const htMinGoals = Math.ceil(parseFloat(htOverMatch[1]));
      const ftMaxGoals = Math.floor(parseFloat(ftUnderMatch[1]));

      if (htMinGoals > ftMaxGoals) {
        return makeConflict(a, b,
          `'Over ${htOverMatch[1]} 1ºT' exige ${htMinGoals}+ gols só no 1º tempo, mas 'Under ${ftUnderMatch[1]}' permite máximo ${ftMaxGoals} gols no jogo inteiro.`,
          "impossible"
        );
      }

      return null;
    },
  },

  // BTTS:Sim + Empate FT = possível mas fraco se under
  // BTTS:Não + Over high = incoerente (already covered above)

  // Resultado FT + Dupla Chance redundante (não conflito, mas incoerente)
  {
    check(a, b, home, away) {
      const res = findByMarket(a, b, "Resultado (1X2)");
      if (!res) return null;
      const other = res.other;
      if (other.market !== "Dupla Chance") return null;

      const resSel = res.sel.selection.toLowerCase();
      const dcSel = other.selection.toLowerCase();

      // "Home vence" + "Home ou Empate" = redundante
      if (resSel.includes(home.toLowerCase()) && resSel.includes("vence") && dcSel.includes(home.toLowerCase()) && dcSel.includes("empate")) {
        return makeConflict(a, b,
          `'${res.sel.selection}' já está incluído em '${other.selection}'. Combinação redundante que desperdiça valor de odd.`,
          "incoherent"
        );
      }
      if (resSel.includes(away.toLowerCase()) && resSel.includes("vence") && dcSel.includes(away.toLowerCase()) && dcSel.includes("empate")) {
        return makeConflict(a, b,
          `'${res.sel.selection}' já está incluído em '${other.selection}'. Combinação redundante.`,
          "incoherent"
        );
      }

      return null;
    },
  },
];

// =============================================
// HELPERS
// =============================================

function findByMarket(
  a: BetSelection,
  b: BetSelection,
  market: string
): { sel: BetSelection; other: BetSelection } | null {
  if (a.market === market) return { sel: a, other: b };
  if (b.market === market) return { sel: b, other: a };
  return null;
}

function findByMarketSel(
  a: BetSelection,
  b: BetSelection,
  market: string,
  predicate: (s: string) => boolean
): { sel: BetSelection; other: BetSelection } | null {
  if (a.market === market && predicate(a.selection)) return { sel: a, other: b };
  if (b.market === market && predicate(b.selection)) return { sel: b, other: a };
  return null;
}

function makeConflict(
  a: BetSelection,
  b: BetSelection,
  reason: string,
  severity: "impossible" | "incoherent"
): ConflictDetail {
  return {
    selectionA: { market: a.market, selection: a.selection },
    selectionB: { market: b.market, selection: b.selection },
    reason,
    severity,
  };
}

function buildConflictReason(
  implA: SelectionImplication,
  implB: SelectionImplication
): string {
  return `'${implA.selection}' (${implA.description}) entra em conflito com '${implB.selection}' (${implB.description}).`;
}

// =============================================
// FUNÇÃO PRINCIPAL DE VALIDAÇÃO
// =============================================

/**
 * Valida a coerência de um conjunto de seleções de aposta.
 * Retorna score de coerência, conflitos encontrados e sugestões.
 */
export function validateBetCoherence(
  selections: BetSelection[],
  homeTeam: string,
  awayTeam: string
): CoherenceResult {
  if (selections.length <= 1) {
    return {
      valid: true,
      score: 100,
      label: "muito_coerente",
      conflicts: [],
      suggestions: [],
    };
  }

  const conflicts: ConflictDetail[] = [];
  const implications = selections.map((s) =>
    extractConstraints(s, homeTeam, awayTeam)
  );

  // Fase 1: Verificação por constraints (impossibilidade matemática)
  for (let i = 0; i < implications.length; i++) {
    for (let j = i + 1; j < implications.length; j++) {
      const conflict = checkConstraintConflict(implications[i], implications[j]);
      if (conflict && !isDuplicateConflict(conflicts, conflict)) {
        conflicts.push(conflict);
      }
    }
  }

  // Fase 2: Regras semânticas (cobrem casos que constraints puras não pegam)
  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      for (const rule of SEMANTIC_RULES) {
        const conflict = rule.check(selections[i], selections[j], homeTeam, awayTeam);
        if (conflict && !isDuplicateConflict(conflicts, conflict)) {
          conflicts.push(conflict);
        }
      }
    }
  }

  // Calcular score
  const impossibleCount = conflicts.filter((c) => c.severity === "impossible").length;
  const incoherentCount = conflicts.filter((c) => c.severity === "incoherent").length;

  let score: number;
  if (impossibleCount > 0) {
    score = 0; // Impossibilidade matemática = score 0
  } else if (incoherentCount > 0) {
    score = Math.max(20, 70 - incoherentCount * 20);
  } else {
    // Sem conflitos: calcular coerência positiva
    score = calculatePositiveCoherence(selections, homeTeam, awayTeam);
  }

  const label = getCoherenceLabel(score, impossibleCount > 0);
  const valid = impossibleCount === 0 && score >= 40;

  // Gerar sugestões
  const suggestions = generateSuggestions(conflicts, selections, homeTeam, awayTeam);

  return { valid, score, label, conflicts, suggestions };
}

function isDuplicateConflict(existing: ConflictDetail[], newConflict: ConflictDetail): boolean {
  return existing.some(
    (c) =>
      (c.selectionA.selection === newConflict.selectionA.selection &&
        c.selectionB.selection === newConflict.selectionB.selection) ||
      (c.selectionA.selection === newConflict.selectionB.selection &&
        c.selectionB.selection === newConflict.selectionA.selection)
  );
}

function getCoherenceLabel(
  score: number,
  hasImpossible: boolean
): CoherenceResult["label"] {
  if (hasImpossible) return "impossivel";
  if (score >= 80) return "muito_coerente";
  if (score >= 60) return "coerente";
  if (score >= 40) return "fraca";
  return "incoerente";
}

/**
 * Calcula coerência positiva quando não há conflitos.
 * Avalia se as seleções se reforçam mutuamente.
 */
function calculatePositiveCoherence(
  selections: BetSelection[],
  homeTeam: string,
  awayTeam: string
): number {
  let score = 70; // base sem conflitos

  // Bônus por consistência direcional
  const directions = new Set<string>();
  for (const s of selections) {
    const sel = s.selection.toLowerCase();
    const home = homeTeam.toLowerCase();
    const away = awayTeam.toLowerCase();

    if (sel.includes(home) && sel.includes("vence")) directions.add("home_win");
    if (sel.includes(away) && sel.includes("vence")) directions.add("away_win");
    if (sel.includes("empate")) directions.add("draw");
    if (sel.includes("over")) directions.add("goals_high");
    if (sel.includes("under")) directions.add("goals_low");
    if (s.market === "Ambas Marcam" && sel === "sim") directions.add("goals_high");
    if (s.market === "Ambas Marcam" && sel.startsWith("n")) directions.add("goals_low");
  }

  // Direções consistentes: bônus
  if (directions.size <= 2) score += 15;
  else if (directions.size <= 3) score += 5;

  // Conflito direcional suave (não impossível mas incoerente)
  if (directions.has("home_win") && directions.has("away_win")) score -= 20;
  if (directions.has("goals_high") && directions.has("goals_low")) score -= 15;
  if (directions.has("draw") && (directions.has("home_win") || directions.has("away_win"))) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function generateSuggestions(
  conflicts: ConflictDetail[],
  selections: BetSelection[],
  homeTeam: string,
  awayTeam: string
): string[] {
  const suggestions: string[] = [];

  for (const conflict of conflicts) {
    if (conflict.severity === "impossible") {
      // Sugerir remoção de uma das seleções conflitantes
      suggestions.push(
        `Remova '${conflict.selectionA.selection}' ou '${conflict.selectionB.selection}' para resolver o conflito.`
      );

      // Sugerir alternativa
      const selA = conflict.selectionA.selection.toLowerCase();
      if (selA.includes("under 0.5") && selA.includes("1ºt")) {
        suggestions.push(
          `Considere trocar 'Under 0.5 1ºT' por 'Under 1.5 1ºT' se quiser manter poucas chances de gol no 1º tempo.`
        );
      }
      if (selA.includes("vence") && selA.includes("1ºt")) {
        suggestions.push(
          `Considere usar 'Empate 1ºT' se o outro mercado exige poucos gols no 1º tempo.`
        );
      }
    }
  }

  return [...new Set(suggestions)]; // remover duplicatas
}

// =============================================
// VALIDAÇÃO RÁPIDA (para uso no gerador)
// =============================================

/**
 * Verifica rapidamente se um conjunto de seleções tem impossibilidade.
 * Mais rápido que validateBetCoherence completo.
 */
export function hasImpossibleConflict(
  selections: BetSelection[],
  homeTeam: string,
  awayTeam: string
): boolean {
  if (selections.length <= 1) return false;

  const implications = selections.map((s) =>
    extractConstraints(s, homeTeam, awayTeam)
  );

  // Constraint check
  for (let i = 0; i < implications.length; i++) {
    for (let j = i + 1; j < implications.length; j++) {
      if (checkConstraintConflict(implications[i], implications[j])) {
        return true;
      }
    }
  }

  // Semantic rules (only impossible)
  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      for (const rule of SEMANTIC_RULES) {
        const conflict = rule.check(selections[i], selections[j], homeTeam, awayTeam);
        if (conflict && conflict.severity === "impossible") {
          return true;
        }
      }
    }
  }

  return false;
}
