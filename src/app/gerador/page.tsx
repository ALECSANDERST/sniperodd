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
  AlertTriangle,
  Crosshair,
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

  const totalReturn = result ? result.bets.reduce((s, b) => s + b.potentialReturn, 0) : 0;
  const totalStaked = result ? result.bets.reduce((s, b) => s + b.stake, 0) : 0;

  const handleGenerate = async () => {
    await generate();
    toast.success("Apostas geradas com sucesso!", {
      description: "O motor analisou o cenário e gerou as melhores combinações.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl italic tracking-tight text-gradient-gold">
              Gerador de Apostas
            </h2>
            <p className="text-sm text-text-secondary mt-1.5">
              Selecione o jogo, configure e gere apostas inteligentes
            </p>
          </div>
          <div className="flex gap-2">
            {result && (
              <Button variant="secondary" onClick={handleGenerate} disabled={loading} className="gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerar
              </Button>
            )}
            <Button onClick={handleGenerate} disabled={!selectedGame || loading} className="gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? "Analisando..." : "Gerar Apostas"}
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Config */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <FadeIn delay={0.05} className="lg:col-span-2">
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-4 h-4 text-accent" />
                <CardTitle>Selecionar Jogo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <GameSelector selected={selectedGame} onSelect={setSelectedGame} />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="lg:col-span-3">
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-accent" />
                <CardTitle>Configuração</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <BetConfigurator config={config} onUpdate={updateConfig} onSetRiskProfile={setRiskProfile} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Scenario banner */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="flex-1 border-accent/15 bg-accent-muted">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow shrink-0" />
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-extrabold text-accent">{result.scenarioLabel}</span>
                    <Badge>{result.scenarioConfidence}% confiança</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted block">Investido</span>
                      <span className="font-extrabold text-text-primary text-sm tabular-nums">R${totalStaked.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted block">Retorno</span>
                      <span className="font-extrabold text-accent text-sm tabular-nums">R${totalReturn.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted block">Lucro</span>
                      <span className="font-extrabold text-accent text-sm tabular-nums">R${(totalReturn - config.totalInvestment).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* Bets + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
                    <AlertTriangle className="w-10 h-10 text-warning/30 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-text-secondary">Nenhuma aposta passou no filtro</p>
                    <p className="text-xs text-text-muted mt-1">Score mínimo: 70. Tente outro perfil ou jogo.</p>
                  </CardContent>
                </Card>
              )}
            </StaggerContainer>

            {/* Sidebar */}
            <FadeIn delay={0.2} className="space-y-4">
              {/* Scenario */}
              <Card accent>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent" />
                    <CardTitle>Cenário</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-extrabold text-accent">{result.scenarioLabel}</div>
                    <div>
                      <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
                        <span className="font-bold uppercase tracking-[0.1em]">Confiança</span>
                        <span className="font-bold tabular-nums">{result.scenarioConfidence}%</span>
                      </div>
                      <Progress
                        value={result.scenarioConfidence}
                        indicatorClassName={
                          result.scenarioConfidence >= 80 ? "bg-gradient-to-r from-risk-low/60 to-risk-low" :
                          result.scenarioConfidence >= 60 ? "bg-gradient-to-r from-accent-dim to-accent" :
                          "bg-gradient-to-r from-warning/60 to-warning"
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exposure */}
              {result.exposure && (
                <Card accent>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-warning" />
                      <CardTitle>Exposição</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Banca</span>
                        <span className="text-xs font-extrabold text-text-primary tabular-nums">
                          R${result.exposure.totalExposed.toFixed(2)} ({result.exposure.exposedPercent}%)
                        </span>
                      </div>
                      <Progress
                        value={Math.min(result.exposure.exposedPercent, 100)}
                        indicatorClassName={
                          result.exposure.exposedPercent > 80 ? "bg-gradient-to-r from-danger/60 to-danger" :
                          result.exposure.exposedPercent > 50 ? "bg-gradient-to-r from-warning/60 to-warning" :
                          "bg-gradient-to-r from-accent-dim to-accent"
                        }
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" />
                          Mesmo Cenário
                        </span>
                        <span className={`text-[10px] font-bold ${result.exposure.sameScenario ? "text-risk-low" : "text-danger"}`}>
                          {result.exposure.sameScenario ? "Sim" : "Não"}
                        </span>
                      </div>

                      {result.exposure.highRiskPercent > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            Odds 20x+
                          </span>
                          <span className={`text-[10px] font-bold ${result.exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`}>
                            {result.exposure.highRiskPercent}%
                          </span>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Agregado</span>
                        <RiskBadge level={result.exposure.aggregateRisk} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Distribution */}
              {result.exposure?.distributionByType?.length > 0 && (
                <Card accent>
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
                            <span className="text-[10px] text-text-secondary font-medium">{d.label}</span>
                            <span className="text-[10px] font-bold text-text-primary tabular-nums">
                              R${d.amount.toFixed(2)} ({d.percent}%)
                            </span>
                          </div>
                          <Progress value={d.percent} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </FadeIn>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <FadeIn delay={0.15}>
          <Card accent>
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/3 border border-border flex items-center justify-center mx-auto mb-6 ring-1 ring-accent/10">
                <Brain className="w-7 h-7 text-accent/40" />
              </div>
              <h3 className="font-serif text-2xl italic text-text-primary mb-2">
                Selecione um jogo
              </h3>
              <p className="text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
                O motor analisa o cenário, calcula correlações entre mercados, filtra
                conflitos e gera apostas com score de qualidade.
              </p>
              <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-risk-low" />
                  6 Perfis
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Score 0–100
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Anti-correlação
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Loading */}
      {loading && !result && (
        <FadeIn>
          <Card accent>
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-teal/5 border border-border flex items-center justify-center mx-auto mb-6 ring-1 ring-accent/10">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
              </div>
              <h3 className="font-serif text-2xl italic text-text-primary mb-2">Analisando cenário...</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                Calculando correlações entre mercados e otimizando a distribuição de banca
              </p>
              <div className="flex items-center justify-center gap-4 mt-6 text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
                  Cenário
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                  Correlações
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
                  Otimização
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
