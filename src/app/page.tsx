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

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

export default function Dashboard() {
  const { result, config, history } = useBettingStore();

  const totalStaked = result
    ? result.bets.reduce((s, b) => s + b.stake, 0)
    : 0;
  const totalReturn = result
    ? result.bets.reduce((s, b) => s + b.potentialReturn, 0)
    : 0;
  const avgQuality =
    result && result.bets.length > 0
      ? Math.round(
          result.bets.reduce((s, b) => s + b.quality.total, 0) /
            result.bets.length
        )
      : 0;

  const roi = totalStaked > 0 ? ((totalReturn - totalStaked) / totalStaked) * 100 : 0;

  // Chart data from history
  const chartData = history.slice(0, 10).reverse().map((h, i) => ({
    name: `#${i + 1}`,
    investido: h.totalInvestment,
    retorno: h.potentialReturn,
  }));

  // Distribution data
  const distData = result?.exposure?.distributionByType?.map((d) => ({
    name: d.label,
    value: d.percent,
    amount: d.amount,
  })) || [];

  const stats = [
    {
      label: "Banca Atual",
      value: `R$${config.totalInvestment.toFixed(0)}`,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Apostas Geradas",
      value: result ? result.bets.length.toString() : "0",
      icon: Target,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Retorno Potencial",
      value: `R$${totalReturn.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "ROI Estimado",
      value: `${roi.toFixed(1)}%`,
      icon: BarChart3,
      color: roi > 0 ? "text-accent" : "text-danger",
      bgColor: roi > 0 ? "bg-accent/10" : "bg-danger/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Visão Geral
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
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

      {/* Stats grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Return chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRetorno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#556583", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#556583", fontSize: 11 }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111622",
                      border: "1px solid #1e2640",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#f0f4f8",
                    }}
                    formatter={(value: any) => [`R$${Number(value).toFixed(2)}`]}
                  />
                  <Area
                    type="monotone"
                    dataKey="investido"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInvestido)"
                    name="Investido"
                  />
                  <Area
                    type="monotone"
                    dataKey="retorno"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRetorno)"
                    name="Retorno"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Gere apostas para ver o gráfico</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent" />
              <CardTitle>Alocação da Banca</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {distData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={160}>
                  <RPieChart>
                    <Pie
                      data={distData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111622",
                        border: "1px solid #1e2640",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#f0f4f8",
                      }}
                      formatter={(value: any) => [`${value}%`]}
                    />
                  </RPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {distData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-text-secondary">{d.name}</span>
                      </div>
                      <span className="font-medium text-text-primary">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Sem dados ainda</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scenario + Risk + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current scenario */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              <CardTitle>Cenário Ativo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-accent">
                    {result.scenarioLabel}
                  </span>
                  <Badge>{result.scenarioConfidence}% confiança</Badge>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>Confiança do cenário</span>
                    <span>{result.scenarioConfidence}%</span>
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-bg-elevated">
                    <div className="text-[10px] text-text-muted mb-1">Apostas</div>
                    <div className="text-base font-bold text-text-primary">{result.bets.length}</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-elevated">
                    <div className="text-[10px] text-text-muted mb-1">Score</div>
                    <div className="text-base font-bold text-info">{avgQuality}</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-elevated">
                    <div className="text-[10px] text-text-muted mb-1">Risco</div>
                    <div className="text-base">
                      {result.exposure && <RiskBadge level={result.exposure.aggregateRisk} />}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Brain className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">Nenhuma geração ativa</p>
                <Link href="/gerador">
                  <Button variant="secondary" size="sm" className="mt-3 gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" />
                    Ir para o Gerador
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exposure summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" />
              <CardTitle>Exposição Rápida</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {result?.exposure ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Banca Exposta</span>
                  <span className="text-lg font-bold text-text-primary">
                    R${result.exposure.totalExposed.toFixed(2)}{" "}
                    <span className="text-xs text-text-muted">({result.exposure.exposedPercent}%)</span>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-bg-elevated">
                    <div className="text-[10px] text-text-muted mb-1">Risco Agregado</div>
                    <RiskBadge level={result.exposure.aggregateRisk} />
                  </div>
                  <div className="p-3 rounded-lg bg-bg-elevated">
                    <div className="text-[10px] text-text-muted mb-1">High Risk (20x+)</div>
                    <div className={`text-sm font-bold ${result.exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`}>
                      {result.exposure.highRiskPercent}%
                    </div>
                  </div>
                </div>
                <Link href="/exposicao">
                  <Button variant="secondary" size="sm" className="w-full gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Ver Análise Completa
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center">
                <ShieldAlert className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">Gere apostas para ver a exposição</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <CardTitle>Gerações Recentes</CardTitle>
              </div>
              <Link href="/historico" className="text-xs text-accent hover:text-accent-hover transition-colors font-medium">
                Ver tudo
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated hover:bg-bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{h.game}</div>
                      <div className="text-[11px] text-text-muted">
                        {h.betsCount} apostas &middot; {RISK_PROFILE_CONFIG[h.riskProfile].label}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-accent">
                      R${h.potentialReturn.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Score: {h.avgQuality}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
