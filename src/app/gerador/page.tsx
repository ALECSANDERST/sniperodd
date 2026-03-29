"use client";

import { useBettingStore } from "@/hooks/use-betting-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/shared/risk-badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/animate";
import GameSelector from "@/components/generator/game-selector";
import BetConfigurator from "@/components/generator/bet-configurator";
import BetCard from "@/components/generator/bet-card";
import {
  Brain,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Crosshair,
  DollarSign,
  ShieldAlert,
  CheckCircle,
  PieChart,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function GeradorPage() {
  const {
    selectedGame,
    config,
    result,
    loading,
    setSelectedGame,
    updateConfig,
    setRiskProfile,
    generate,
    toggleFix,
    editStake,
  } = useBettingStore();

  const totalReturn = result
    ? result.bets.reduce((s, b) => s + b.potentialReturn, 0)
    : 0;
  const totalStaked = result
    ? result.bets.reduce((s, b) => s + b.stake, 0)
    : 0;
  const avgQuality =
    result && result.bets.length > 0
      ? Math.round(
          result.bets.reduce((s, b) => s + b.quality.total, 0) /
            result.bets.length
        )
      : 0;

  const handleGenerate = async () => {
    await generate();
    toast.success("Apostas geradas com sucesso!", {
      description: "O motor analisou o cenário e gerou as melhores combinações.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-accent" />
            Gerador de Apostas
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Selecione o jogo, configure e gere apostas inteligentes
          </p>
        </div>

        <div className="flex gap-2">
          {result && (
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Regenerar
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={!selectedGame || loading}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {loading ? "Analisando..." : "Gerar Apostas"}
          </Button>
        </div>
      </div>

      {/* Configuration area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Game selector */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-accent" />
              <CardTitle>Selecionar Jogo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <GameSelector selected={selectedGame} onSelect={setSelectedGame} />
          </CardContent>
        </Card>

        {/* Configurator */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <CardTitle>Configuração</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <BetConfigurator
              config={config}
              onUpdate={updateConfig}
              onSetRiskProfile={setRiskProfile}
            />
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Scenario banner */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Card className="flex-1 border-accent/20 bg-accent/[0.03]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-accent">
                      {result.scenarioLabel}
                    </span>
                    <Badge>{result.scenarioConfidence}% confiança</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-5 text-xs">
                  <div>
                    <span className="text-text-muted block">Investido</span>
                    <span className="font-bold text-text-primary text-sm tabular-nums">
                      R${totalStaked.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <span className="text-text-muted block">Retorno</span>
                    <span className="font-bold text-accent text-sm tabular-nums">
                      R${totalReturn.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <span className="text-text-muted block">Lucro Máx</span>
                    <span className="font-bold text-accent text-sm tabular-nums">
                      R${(totalReturn - config.totalInvestment).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bets + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Bet cards */}
            <StaggerContainer className="lg:col-span-2 space-y-4">
              {result.bets.length > 0 ? (
                result.bets.map((bet, i) => (
                  <StaggerItem key={bet.id}>
                    <BetCard
                      bet={bet}
                      index={i}
                      onFix={toggleFix}
                      onEditStake={editStake}
                      onRegenerate={handleGenerate}
                      manualMode={config.stakeMode === "manual"}
                    />
                  </StaggerItem>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="w-10 h-10 text-warning/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-secondary">
                      Nenhuma aposta passou no filtro de qualidade
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Score mínimo: 70. Tente outro perfil de risco ou jogo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </StaggerContainer>

            {/* Exposure sidebar */}
            <div className="space-y-4">
              {/* Scenario */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent" />
                    <CardTitle>Cenário</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-accent">
                      {result.scenarioLabel}
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
                        <span>Confiança</span>
                        <span className="font-medium">{result.scenarioConfidence}%</span>
                      </div>
                      <Progress
                        value={result.scenarioConfidence}
                        indicatorClassName={
                          result.scenarioConfidence >= 80
                            ? "bg-risk-low"
                            : result.scenarioConfidence >= 60
                              ? "bg-info"
                              : "bg-warning"
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exposure */}
              {result.exposure && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-warning" />
                      <CardTitle>Exposição</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Banca Exposta</span>
                        <span className="text-xs font-bold text-text-primary tabular-nums">
                          R${result.exposure.totalExposed.toFixed(2)} ({result.exposure.exposedPercent}%)
                        </span>
                      </div>
                      <Progress
                        value={Math.min(result.exposure.exposedPercent, 100)}
                        indicatorClassName={
                          result.exposure.exposedPercent > 80
                            ? "bg-danger"
                            : result.exposure.exposedPercent > 50
                              ? "bg-warning"
                              : "bg-accent"
                        }
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" />
                          Mesmo Cenário
                        </span>
                        <span className={`text-xs font-semibold ${result.exposure.sameScenario ? "text-risk-low" : "text-danger"}`}>
                          {result.exposure.sameScenario ? "Sim" : "Não"}
                        </span>
                      </div>

                      {result.exposure.highRiskPercent > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            Odds 20x+
                          </span>
                          <span className={`text-xs font-bold ${result.exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`}>
                            {result.exposure.highRiskPercent}%
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs font-medium text-text-secondary">Risco Agregado</span>
                        <RiskBadge level={result.exposure.aggregateRisk} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Distribution */}
              {result.exposure?.distributionByType?.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-accent" />
                      <CardTitle>Distribuição</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.exposure.distributionByType.map((d) => (
                        <div key={d.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-text-secondary">{d.label}</span>
                            <span className="text-[11px] font-medium text-text-primary tabular-nums">
                              R${d.amount.toFixed(2)} ({d.percent}%)
                            </span>
                          </div>
                          <Progress value={d.percent} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-5">
              <Brain className="w-8 h-8 text-text-muted/40" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Selecione um jogo para começar
            </h3>
            <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
              O motor analisa o cenário, calcula correlações entre mercados, filtra
              conflitos e gera apostas com score de qualidade.
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-risk-low" />
                6 Perfis de Risco
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-info" />
                Score 0–100
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent" />
                Anti-correlação
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && !result && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-text-primary mb-1">
              Analisando cenário...
            </h3>
            <p className="text-sm text-text-muted">
              Calculando correlações, filtrando conflitos e otimizando distribuição
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
