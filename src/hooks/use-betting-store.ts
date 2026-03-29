"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import {
  GameInput,
  SportEvent,
  GameOdds,
  GenerationResult,
  GeneratedBet,
  RiskProfile,
  StakeMode,
  RISK_PROFILE_CONFIG,
} from "@/types";
import { generateBets } from "@/lib/betting-engine";

interface BettingState {
  selectedGame: SportEvent | null;
  config: {
    totalInvestment: number;
    betCount: number;
    minOdd: number;
    maxOdd: number;
    riskProfile: RiskProfile;
    stakeMode: StakeMode;
  };
  result: GenerationResult | null;
  loading: boolean;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  game: string;
  riskProfile: RiskProfile;
  totalInvestment: number;
  totalStaked: number;
  potentialReturn: number;
  betsCount: number;
  avgQuality: number;
  scenario: string;
  bets: GeneratedBet[];
}

type Listener = () => void;

let state: BettingState = {
  selectedGame: null,
  config: {
    totalInvestment: 500,
    betCount: 3,
    minOdd: 2.0,
    maxOdd: 4.0,
    riskProfile: "moderado",
    stakeMode: "automatico",
  },
  result: null,
  loading: false,
  history: [],
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(partial: Partial<BettingState>) {
  state = { ...state, ...partial };
  emit();
}

function getSnapshot() {
  return state;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBettingStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setSelectedGame = useCallback((game: SportEvent | null) => {
    setState({ selectedGame: game });
  }, []);

  const updateConfig = useCallback((partial: Partial<BettingState["config"]>) => {
    setState({ config: { ...state.config, ...partial } });
  }, []);

  const setRiskProfile = useCallback((profile: RiskProfile) => {
    const cfg = RISK_PROFILE_CONFIG[profile];
    setState({
      config: {
        ...state.config,
        riskProfile: profile,
        minOdd: cfg.oddMin,
        maxOdd: cfg.oddMax,
      },
    });
  }, []);

  const generate = useCallback(async () => {
    if (!state.selectedGame) return;
    setState({ loading: true });

    try {
      const res = await fetch(
        `/api/odds?eventId=${state.selectedGame.id}&sportKey=${state.selectedGame.sportKey || ""}`
      );
      const odds: GameOdds = await res.json();

      const profileCfg = RISK_PROFILE_CONFIG[state.config.riskProfile];
      const input: GameInput = {
        eventId: state.selectedGame.id,
        homeTeam: state.selectedGame.homeTeam,
        awayTeam: state.selectedGame.awayTeam,
        totalInvestment: state.config.totalInvestment,
        betCount: state.config.betCount,
        minOdd: profileCfg.oddMin,
        maxOdd: profileCfg.oddMax,
        riskProfile: state.config.riskProfile,
        stakeMode: state.config.stakeMode,
      };

      const generated = generateBets(input, odds);
      setState({ result: generated, loading: false });

      // Add to history
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        game: `${state.selectedGame.homeTeam} vs ${state.selectedGame.awayTeam}`,
        riskProfile: state.config.riskProfile,
        totalInvestment: state.config.totalInvestment,
        totalStaked: generated.bets.reduce((s, b) => s + b.stake, 0),
        potentialReturn: generated.bets.reduce((s, b) => s + b.potentialReturn, 0),
        betsCount: generated.bets.length,
        avgQuality: generated.bets.length > 0
          ? Math.round(generated.bets.reduce((s, b) => s + b.quality.total, 0) / generated.bets.length)
          : 0,
        scenario: generated.scenarioLabel,
        bets: generated.bets,
      };
      setState({ history: [entry, ...state.history].slice(0, 50) });
    } catch {
      setState({ loading: false });
    }
  }, []);

  const toggleFix = useCallback((betId: string) => {
    if (!state.result) return;
    setState({
      result: {
        ...state.result,
        bets: state.result.bets.map((b) =>
          b.id === betId ? { ...b, fixed: !b.fixed } : b
        ),
      },
    });
  }, []);

  const editStake = useCallback((betId: string, newStake: number) => {
    if (!state.result) return;
    setState({
      result: {
        ...state.result,
        bets: state.result.bets.map((b) =>
          b.id === betId
            ? { ...b, stake: newStake, potentialReturn: +(newStake * b.totalOdd).toFixed(2) }
            : b
        ),
      },
    });
  }, []);

  const clearResult = useCallback(() => {
    setState({ result: null });
  }, []);

  return {
    ...snap,
    setSelectedGame,
    updateConfig,
    setRiskProfile,
    generate,
    toggleFix,
    editStake,
    clearResult,
  };
}
