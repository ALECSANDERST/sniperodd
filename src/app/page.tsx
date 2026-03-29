"use client";

import { useState, useCallback } from "react";
import {
  GameInput,
  SportEvent,
  GameOdds,
  GenerationResult,
  RiskProfile,
  StakeMode,
  RISK_PROFILE_CONFIG,
} from "@/types";
import { generateBets } from "@/lib/betting-engine";
import GameSelector from "@/components/GameSelector";
import BetConfigurator from "@/components/BetConfigurator";
import BetCard from "@/components/BetCard";
import ExposurePanel from "@/components/ExposurePanel";
import {
  Crosshair,
  Loader2,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Brain,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<SportEvent | null>(null);
  const [config, setConfig] = useState({
    totalInvestment: 500,
    betCount: 3,
    minOdd: 2.0,
    maxOdd: 4.0,
    riskProfile: "moderado" as RiskProfile,
    stakeMode: "automatico" as StakeMode,
  });
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  const handleGenerate = useCallback(async () => {
    if (!selectedGame) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/odds?eventId=${selectedGame.id}&sportKey=${selectedGame.sportKey || ""}`);
      const odds: GameOdds = await res.json();

      const profileCfg = RISK_PROFILE_CONFIG[config.riskProfile];
      const input: GameInput = {
        eventId: selectedGame.id,
        homeTeam: selectedGame.homeTeam,
        awayTeam: selectedGame.awayTeam,
        totalInvestment: config.totalInvestment,
        betCount: config.betCount,
        minOdd: profileCfg.oddMin,
        maxOdd: profileCfg.oddMax,
        riskProfile: config.riskProfile,
        stakeMode: config.stakeMode,
      };

      const generated = generateBets(input, odds);
      setResult(generated);
      setShowConfig(false);
    } catch (err) {
      console.error("Erro ao gerar apostas:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGame, config]);

  const handleFix = (betId: string) => {
    if (!result) return;
    setResult({
      ...result,
      bets: result.bets.map((b) =>
        b.id === betId ? { ...b, fixed: !b.fixed } : b
      ),
    });
  };

  const handleEditStake = (betId: string, newStake: number) => {
    if (!result) return;
    setResult({
      ...result,
      bets: result.bets.map((b) =>
        b.id === betId
          ? { ...b, stake: newStake, potentialReturn: +(newStake * b.totalOdd).toFixed(2) }
          : b
      ),
    });
  };

  const totalReturn = result ? result.bets.reduce((sum, b) => sum + b.potentialReturn, 0) : 0;
  const totalStaked = result ? result.bets.reduce((sum, b) => sum + b.stake, 0) : 0;
  const avgQuality = result && result.bets.length > 0
    ? Math.round(result.bets.reduce((sum, b) => sum + b.quality.total, 0) / result.bets.length)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                Sniper<span className="text-accent">Odd</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.5 bg-accent/10 text-accent rounded font-medium align-middle">PRO</span>
              </h1>
              <p className="text-[10px] text-text-muted">Motor Inteligente de Apostas</p>
            </div>
          </div>

          {result && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-text-muted">Score Médio</div>
                <div className={`text-sm font-bold ${avgQuality >= 85 ? "text-green-400" : avgQuality >= 75 ? "text-blue-400" : "text-orange-400"}`}>
                  {avgQuality}/100
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-muted">Retorno Potencial</div>
                <div className="text-sm font-bold text-green-400 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3.5 h-3.5" />
                  R${totalReturn.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Painel de configuração */}
        <div className="mb-6">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showConfig ? "Ocultar configuração" : "Mostrar configuração"}
          </button>

          {showConfig && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-bg-card p-5 card-glow">
                <GameSelector selected={selectedGame} onSelect={setSelectedGame} />
              </div>
              <div className="rounded-2xl border border-border bg-bg-card p-5 card-glow">
                <BetConfigurator config={config} onChange={setConfig} />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleGenerate}
              disabled={!selectedGame || loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-primary font-bold rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? "Analisando..." : "Gerar Apostas Inteligentes"}
            </button>

            {result && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-bg-card border border-border hover:bg-bg-card-hover text-text-secondary font-semibold rounded-xl transition-all text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novamente
              </button>
            )}
          </div>
        </div>

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            {/* Cenário + resumo rápido */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 p-3.5 rounded-xl bg-accent/5 border border-accent/20">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <div>
                  <span className="text-xs text-text-muted">Cenário: </span>
                  <span className="text-xs font-bold text-accent">{result.scenarioLabel}</span>
                  <span className="text-xs text-text-muted ml-2">({result.scenarioConfidence}% confiança)</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-bg-card border border-border text-xs">
                <div>
                  <span className="text-text-muted">Investido: </span>
                  <span className="font-bold text-text-primary">R${totalStaked.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-text-muted">Retorno: </span>
                  <span className="font-bold text-green-400">R${totalReturn.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-text-muted">Lucro máx: </span>
                  <span className="font-bold text-green-400">R${(totalReturn - config.totalInvestment).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Cards de apostas */}
              <div className="lg:col-span-2 space-y-3">
                {result.bets.map((bet, i) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    index={i}
                    onFix={handleFix}
                    onEditStake={handleEditStake}
                    manualMode={config.stakeMode === "manual"}
                  />
                ))}

                {result.bets.length === 0 && (
                  <div className="text-center py-12 rounded-2xl border border-border bg-bg-card">
                    <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">
                      Nenhuma aposta passou no filtro de qualidade (score mínimo: 70).
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Tente ajustar o perfil de risco ou selecionar outro jogo.
                    </p>
                  </div>
                )}
              </div>

              {/* Painel lateral */}
              <div>
                <ExposurePanel
                  exposure={result.exposure}
                  scenarioConfidence={result.scenarioConfidence}
                />
              </div>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!result && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center mx-auto mb-5">
              <Brain className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1.5">
              Selecione um jogo para começar
            </h2>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              O motor analisa o cenário, calcula correlações, filtra conflitos e gera apostas com score de qualidade.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                6 Perfis de Risco
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Score 0-100
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent" />
                Correlação Inteligente
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-4 text-center text-[10px] text-text-muted">
        SniperOdd PRO © {new Date().getFullYear()} — Motor Inteligente de Apostas.
        Apostas envolvem risco. Jogue com responsabilidade.
      </footer>
    </div>
  );
}
