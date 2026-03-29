"use client";

import { useBettingStore } from "@/hooks/use-betting-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/shared/risk-badge";
import Link from "next/link";
import {
  ShieldAlert,
  Brain,
  AlertTriangle,
  CheckCircle,
  PieChart,
  TrendingUp,
  BarChart3,
  Crosshair,
  ArrowRight,
  Target,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart as RPieChart,
  Pie,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  baixo: "#10b981",
  medio: "#3b82f6",
  alto: "#f59e0b",
  muito_alto: "#ef4444",
  extremo: "#ec4899",
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

export default function ExposicaoPage() {
  const { result, config } = useBettingStore();
  const exposure = result?.exposure;

  if (!result || !exposure) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-warning" />
            Exposição & Risco
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Análise detalhada de risco das suas apostas
          </p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-base font-bold text-text-primary mb-2">
              Nenhuma aposta gerada
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Gere apostas primeiro para ver a análise de risco completa.
            </p>
            <Link href="/gerador">
              <Button className="gap-1.5">
                <Crosshair className="w-4 h-4" />
                Ir para o Gerador
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build chart data
  const distData = exposure.distributionByType.map((d, i) => ({
    name: d.label,
    value: d.percent,
    amount: d.amount,
    fill: COLORS[i % COLORS.length],
  }));

  const betsByRisk = result.bets.reduce(
    (acc, b) => {
      acc[b.riskLevel] = (acc[b.riskLevel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const riskDistData = Object.entries(betsByRisk).map(([level, count]) => ({
    name: level === "baixo" ? "Baixo" : level === "medio" ? "Médio" : level === "alto" ? "Alto" : level === "muito_alto" ? "Muito Alto" : "Extremo",
    value: count,
    fill: RISK_COLORS[level] || "#3b82f6",
  }));

  // Radar data for bet quality dimensions
  const avgDimensions = result.bets.length > 0
    ? {
        coherence: Math.round(result.bets.reduce((s, b) => s + b.quality.coherence, 0) / result.bets.length),
        selections: Math.round(result.bets.reduce((s, b) => s + b.quality.selectionCount, 0) / result.bets.length),
        oddRisk: Math.round(result.bets.reduce((s, b) => s + b.quality.oddRisk, 0) / result.bets.length),
        marketType: Math.round(result.bets.reduce((s, b) => s + b.quality.marketType, 0) / result.bets.length),
        correlation: Math.round(result.bets.reduce((s, b) => s + b.quality.correlation, 0) / result.bets.length),
      }
    : null;

  const radarData = avgDimensions
    ? [
        { subject: "Coerência", value: (avgDimensions.coherence / 25) * 100, fullMark: 100 },
        { subject: "Seleções", value: (avgDimensions.selections / 20) * 100, fullMark: 100 },
        { subject: "Risco Odd", value: (avgDimensions.oddRisk / 20) * 100, fullMark: 100 },
        { subject: "Mercado", value: (avgDimensions.marketType / 15) * 100, fullMark: 100 },
        { subject: "Correlação", value: (avgDimensions.correlation / 20) * 100, fullMark: 100 },
      ]
    : [];

  // Market concentration
  const marketConcentration = result.bets.reduce(
    (acc, b) => {
      b.selections.forEach((s) => {
        acc[s.market] = (acc[s.market] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const totalSelections = result.bets.reduce((s, b) => s + b.selections.length, 0);
  const marketData = Object.entries(marketConcentration)
    .map(([market, count]) => ({
      market,
      count,
      percent: Math.round((count / totalSelections) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-warning" />
          Exposição & Risco
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          Análise detalhada do risco agregado
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Banca Exposta
              </span>
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-warning" />
              </div>
            </div>
            <div className="text-xl font-bold text-text-primary tabular-nums">
              {exposure.exposedPercent}%
            </div>
            <Progress
              value={Math.min(exposure.exposedPercent, 100)}
              className="mt-2 h-1.5"
              indicatorClassName={
                exposure.exposedPercent > 80 ? "bg-danger" : exposure.exposedPercent > 50 ? "bg-warning" : "bg-accent"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Risco Agregado
              </span>
              <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-danger" />
              </div>
            </div>
            <div className="mt-1">
              <RiskBadge level={exposure.aggregateRisk} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Cenário
              </span>
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent" />
              </div>
            </div>
            <div className="text-sm font-bold text-accent">
              {result.scenarioConfidence}%
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">confiança</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                High Risk
              </span>
              <div className="w-8 h-8 rounded-lg bg-risk-extreme/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-risk-extreme" />
              </div>
            </div>
            <div className={`text-xl font-bold tabular-nums ${exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`}>
              {exposure.highRiskPercent}%
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">odds 20x+</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Distribution chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <CardTitle>Distribuição por Camada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {distData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#556583", fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#556583", fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111622",
                        border: "1px solid #1e2640",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#f0f4f8",
                      }}
                      formatter={(value: any) => [`${value}%`, "Alocação"]}
                    />
                    <Bar dataKey="value" name="Percentual">
                      {distData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
                Sem dados de distribuição
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quality radar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              <CardTitle>Perfil de Qualidade</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1e2640" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#8b9dc3", fontSize: 10 }}
                  />
                  <Radar
                    name="Qualidade"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Market concentration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent" />
              <CardTitle>Concentração por Mercado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketData.map((m) => (
                <div key={m.market}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">{m.market}</span>
                    <span className="text-xs font-medium text-text-primary tabular-nums">
                      {m.count}x ({m.percent}%)
                    </span>
                  </div>
                  <Progress value={m.percent} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <CardTitle>Alertas de Risco</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Exposure alert */}
              <div className={`flex items-start gap-3 p-3 rounded-xl ${
                exposure.exposedPercent > 80 ? "bg-danger/5 border border-danger/20" :
                exposure.exposedPercent > 50 ? "bg-warning/5 border border-warning/20" :
                "bg-risk-low/5 border border-risk-low/20"
              }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  exposure.exposedPercent > 80 ? "bg-danger/10" :
                  exposure.exposedPercent > 50 ? "bg-warning/10" :
                  "bg-risk-low/10"
                }`}>
                  {exposure.exposedPercent > 80 ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                  ) : exposure.exposedPercent > 50 ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-risk-low" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Exposição da Banca: {exposure.exposedPercent}%
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {exposure.exposedPercent > 80
                      ? "Exposição muito alta. Considere reduzir o investimento."
                      : exposure.exposedPercent > 50
                        ? "Exposição moderada. Monitore com atenção."
                        : "Exposição dentro de limites saudáveis."}
                  </div>
                </div>
              </div>

              {/* Scenario coherence */}
              <div className={`flex items-start gap-3 p-3 rounded-xl ${
                exposure.sameScenario ? "bg-risk-low/5 border border-risk-low/20" : "bg-warning/5 border border-warning/20"
              }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  exposure.sameScenario ? "bg-risk-low/10" : "bg-warning/10"
                }`}>
                  {exposure.sameScenario ? (
                    <CheckCircle className="w-3.5 h-3.5 text-risk-low" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Coerência de Cenário
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {exposure.sameScenario
                      ? "Todas as apostas seguem o mesmo cenário detectado."
                      : "Apostas divididas entre cenários diferentes."}
                  </div>
                </div>
              </div>

              {/* High risk */}
              {exposure.highRiskPercent > 0 && (
                <div className={`flex items-start gap-3 p-3 rounded-xl ${
                  exposure.highRiskPercent > 20 ? "bg-danger/5 border border-danger/20" : "bg-warning/5 border border-warning/20"
                }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    exposure.highRiskPercent > 20 ? "bg-danger/10" : "bg-warning/10"
                  }`}>
                    <Zap className={`w-3.5 h-3.5 ${exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">
                      {exposure.highRiskPercent}% em Odds Altas (20x+)
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {exposure.highRiskPercent > 20
                        ? "Proporção elevada em odds de alto risco. Tenha cautela."
                        : "Proporção aceitável de apostas de alto risco."}
                    </div>
                  </div>
                </div>
              )}

              {/* Dependency */}
              <div className={`flex items-start gap-3 p-3 rounded-xl ${
                exposure.scenarioDependency > 80 ? "bg-warning/5 border border-warning/20" : "bg-risk-low/5 border border-risk-low/20"
              }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  exposure.scenarioDependency > 80 ? "bg-warning/10" : "bg-risk-low/10"
                }`}>
                  <Brain className={`w-3.5 h-3.5 ${exposure.scenarioDependency > 80 ? "text-warning" : "text-risk-low"}`} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Dependência de Cenário: {exposure.scenarioDependency}%
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {exposure.scenarioDependency > 80
                      ? "Alta dependência em um cenário único."
                      : "Boa diversificação entre cenários."}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
