"use client";

import { useBettingStore } from "@/hooks/use-betting-store";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/animate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/shared/risk-badge";
import { RISK_PROFILE_CONFIG } from "@/types";
import Link from "next/link";
import {
  Crosshair,
  TrendingUp,
  DollarSign,
  Target,
  ShieldAlert,
  Brain,
  ArrowRight,
  Zap,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RPieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#e4ba60", "#60a5fa", "#2dd4bf", "#f87171", "#f472b6", "#a78bfa"];

export default function Dashboard() {
  const { result, config, history } = useBettingStore();

  const totalStaked = result ? result.bets.reduce((s, b) => s + b.stake, 0) : 0;
  const totalReturn = result ? result.bets.reduce((s, b) => s + b.potentialReturn, 0) : 0;
  const avgQuality =
    result && result.bets.length > 0
      ? Math.round(result.bets.reduce((s, b) => s + b.quality.total, 0) / result.bets.length)
      : 0;
  const roi = totalStaked > 0 ? ((totalReturn - totalStaked) / totalStaked) * 100 : 0;

  const chartData = history.slice(0, 10).reverse().map((h, i) => ({
    name: `#${i + 1}`,
    investido: h.totalInvestment,
    retorno: h.potentialReturn,
  }));

  const distData = result?.exposure?.distributionByType?.map((d) => ({
    name: d.label,
    value: d.percent,
    amount: d.amount,
  })) || [];

  const stats = [
    { label: "Banca", value: `R$${config.totalInvestment}`, icon: DollarSign, color: "text-accent", bg: "from-accent/12 to-accent/4" },
    { label: "Apostas", value: result ? result.bets.length.toString() : "0", icon: Target, color: "text-teal", bg: "from-teal/12 to-teal/4" },
    { label: "Retorno", value: `R$${totalReturn.toFixed(0)}`, icon: TrendingUp, color: "text-accent", bg: "from-accent/12 to-accent/4" },
    { label: "ROI", value: `${roi.toFixed(1)}%`, icon: BarChart3, color: roi > 0 ? "text-risk-low" : "text-danger", bg: roi > 0 ? "from-risk-low/12 to-risk-low/4" : "from-danger/12 to-danger/4" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl italic tracking-tight text-gradient-gold">
              Visão Geral
            </h2>
            <p className="text-sm text-text-secondary mt-1.5">
              Resumo estratégico das suas apostas
            </p>
          </div>
          <Link href="/gerador">
            <Button className="gap-2">
              <Brain className="w-4 h-4" />
              Gerar Apostas
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Card accent className="stat-glow-gold card-hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
                      {stat.label}
                    </span>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center ring-1 ring-white/5`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-extrabold tabular-nums ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FadeIn delay={0.15} className="lg:col-span-2">
          <Card accent>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <CardTitle>Retorno Potencial</CardTitle>
                </div>
                {history.length > 0 && (
                  <Badge variant="muted">{history.length} gerações</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRetorno" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e4ba60" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#e4ba60" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#5c5849", fontSize: 10, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#5c5849", fontSize: 10, fontWeight: 600 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f1118",
                        border: "1px solid #1f2233",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "#eee9df",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                      formatter={(value: any) => [`R$${Number(value).toFixed(2)}`]}
                    />
                    <Area type="monotone" dataKey="investido" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorInvestido)" name="Investido" />
                    <Area type="monotone" dataKey="retorno" stroke="#e4ba60" strokeWidth={2} fillOpacity={1} fill="url(#colorRetorno)" name="Retorno" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center dot-grid rounded-xl">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/8 to-accent/2 border border-border/50 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/5">
                      <BarChart3 className="w-5 h-5 text-text-muted/30" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary">Nenhuma geração ainda</p>
                    <p className="text-xs text-text-muted mt-1">Gere apostas para ver o gráfico de retorno</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4 text-accent" />
                <CardTitle>Alocação</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {distData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={170}>
                    <RPieChart>
                      <Pie data={distData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {distData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0f1118", border: "1px solid #1f2233", borderRadius: "12px", fontSize: "11px", color: "#eee9df" }}
                        formatter={(value: any) => [`${value}%`]}
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3">
                    {distData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-text-secondary">{d.name}</span>
                        </div>
                        <span className="font-bold text-text-primary tabular-nums">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center dot-grid rounded-xl">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/8 to-accent/2 border border-border/50 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/5">
                      <PieChart className="w-5 h-5 text-text-muted/30" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary">Sem alocações</p>
                    <p className="text-xs text-text-muted mt-1">Distribuição aparece após gerar</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Scenario + Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FadeIn delay={0.25}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-accent" />
                <CardTitle>Cenário Ativo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-accent">{result.scenarioLabel}</span>
                    <Badge>{result.scenarioConfidence}%</Badge>
                  </div>
                  <Progress
                    value={result.scenarioConfidence}
                    indicatorClassName={
                      result.scenarioConfidence >= 80 ? "bg-gradient-to-r from-risk-low/60 to-risk-low" :
                      result.scenarioConfidence >= 60 ? "bg-gradient-to-r from-accent-dim to-accent" :
                      "bg-gradient-to-r from-warning/60 to-warning"
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Apostas", value: result.bets.length, color: "text-text-primary" },
                      { label: "Score", value: avgQuality, color: "text-accent" },
                      { label: "Risco", value: null, badge: true },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 rounded-xl bg-bg-elevated border border-border/50">
                        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">{item.label}</div>
                        {item.badge ? (
                          result.exposure && <RiskBadge level={result.exposure.aggregateRisk} />
                        ) : (
                          <div className={`text-base font-extrabold tabular-nums ${item.color}`}>{item.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/8 to-accent/2 border border-border/50 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/5">
                    <Brain className="w-5 h-5 text-text-muted/30" />
                  </div>
                  <p className="text-sm font-medium text-text-secondary">Nenhuma geração ativa</p>
                  <p className="text-xs text-text-muted mt-1">Use o motor inteligente para gerar apostas</p>
                  <Link href="/gerador">
                    <Button variant="secondary" size="sm" className="mt-5 gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" />
                      Ir para o Gerador
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-warning" />
                <CardTitle>Exposição</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {result?.exposure ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Banca Exposta</span>
                    <span className="text-lg font-extrabold text-text-primary tabular-nums">
                      {result.exposure.exposedPercent}%
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-bg-elevated border border-border/50">
                      <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5">Risco</div>
                      <RiskBadge level={result.exposure.aggregateRisk} />
                    </div>
                    <div className="p-3 rounded-xl bg-bg-elevated border border-border/50">
                      <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1.5">Odds 20x+</div>
                      <div className={`text-sm font-extrabold tabular-nums ${result.exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`}>
                        {result.exposure.highRiskPercent}%
                      </div>
                    </div>
                  </div>
                  <Link href="/exposicao">
                    <Button variant="secondary" size="sm" className="w-full gap-1.5">
                      Ver Análise Completa
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/8 to-warning/2 border border-border/50 flex items-center justify-center mx-auto mb-4 ring-1 ring-warning/5">
                    <ShieldAlert className="w-5 h-5 text-text-muted/30" />
                  </div>
                  <p className="text-sm font-medium text-text-secondary">Sem dados de exposição</p>
                  <p className="text-xs text-text-muted mt-1">Gere apostas para analisar o risco</p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* History */}
      {history.length > 0 && (
        <FadeIn delay={0.35}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-accent" />
                  <CardTitle>Recentes</CardTitle>
                </div>
                <Link href="/historico" className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-hover transition-colors">
                  Ver tudo
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-bg-elevated border border-border/50 hover:border-border-hover hover:bg-bg-card-hover cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/12 to-accent/4 flex items-center justify-center ring-1 ring-accent/10">
                        <Target className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{h.game}</div>
                        <div className="text-[10px] text-text-muted">
                          {h.betsCount} apostas &middot; {RISK_PROFILE_CONFIG[h.riskProfile].label}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-accent tabular-nums">
                        R${h.potentialReturn.toFixed(2)}
                      </div>
                      <div className="text-[9px] font-bold text-text-muted tabular-nums">
                        Score {h.avgQuality}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
