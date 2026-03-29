"use client";

import { useBettingStore } from "@/hooks/use-betting-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/shared/risk-badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/animate";
import Link from "next/link";
import {
  ShieldAlert,
  Brain,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  Crosshair,
  ArrowRight,
  Target,
  Zap,
  DollarSign,
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
} from "recharts";

const COLORS = ["#e4ba60", "#60a5fa", "#2dd4bf", "#f87171", "#f472b6", "#a78bfa"];
const RISK_COLORS: Record<string, string> = {
  baixo: "#34d399", medio: "#60a5fa", alto: "#fbbf24", muito_alto: "#f87171", extremo: "#f472b6",
};

export default function ExposicaoPage() {
  const { result } = useBettingStore();
  const exposure = result?.exposure;

  if (!result || !exposure) {
    return (
      <div className="space-y-8">
        <FadeIn>
          <h2 className="font-serif text-3xl italic text-text-primary tracking-tight">
            Exposição & Risco
          </h2>
          <p className="text-sm text-text-muted mt-1">Análise detalhada de risco das suas apostas</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card accent>
            <CardContent className="py-20 text-center">
              <ShieldAlert className="w-12 h-12 text-text-muted/15 mx-auto mb-4" />
              <h3 className="text-base font-bold text-text-primary mb-2">Nenhuma aposta gerada</h3>
              <p className="text-sm text-text-muted mb-6">Gere apostas primeiro para ver a análise completa.</p>
              <Link href="/gerador">
                <Button className="gap-1.5">
                  <Crosshair className="w-4 h-4" />
                  Ir para o Gerador
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    );
  }

  const distData = exposure.distributionByType.map((d, i) => ({
    name: d.label, value: d.percent, amount: d.amount, fill: COLORS[i % COLORS.length],
  }));

  const avgDimensions = result.bets.length > 0
    ? {
        coherence: Math.round(result.bets.reduce((s, b) => s + b.quality.coherence, 0) / result.bets.length),
        selections: Math.round(result.bets.reduce((s, b) => s + b.quality.selectionCount, 0) / result.bets.length),
        oddRisk: Math.round(result.bets.reduce((s, b) => s + b.quality.oddRisk, 0) / result.bets.length),
        marketType: Math.round(result.bets.reduce((s, b) => s + b.quality.marketType, 0) / result.bets.length),
        correlation: Math.round(result.bets.reduce((s, b) => s + b.quality.correlation, 0) / result.bets.length),
      }
    : null;

  const radarData = avgDimensions ? [
    { subject: "Coerência", value: (avgDimensions.coherence / 25) * 100 },
    { subject: "Seleções", value: (avgDimensions.selections / 20) * 100 },
    { subject: "Risco Odd", value: (avgDimensions.oddRisk / 20) * 100 },
    { subject: "Mercado", value: (avgDimensions.marketType / 15) * 100 },
    { subject: "Correlação", value: (avgDimensions.correlation / 20) * 100 },
  ] : [];

  const marketConcentration = result.bets.reduce((acc, b) => {
    b.selections.forEach((s) => { acc[s.market] = (acc[s.market] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  const totalSelections = result.bets.reduce((s, b) => s + b.selections.length, 0);
  const marketData = Object.entries(marketConcentration)
    .map(([market, count]) => ({ market, count, percent: Math.round((count / totalSelections) * 100) }))
    .sort((a, b) => b.count - a.count);

  const metrics = [
    { label: "Banca Exposta", value: `${exposure.exposedPercent}%`, icon: DollarSign, color: "text-warning", bg: "from-warning/12 to-warning/4" },
    { label: "Risco", value: null, badge: true, icon: ShieldAlert, color: "text-danger", bg: "from-danger/12 to-danger/4" },
    { label: "Cenário", value: `${result.scenarioConfidence}%`, icon: Brain, color: "text-accent", bg: "from-accent/12 to-accent/4" },
    { label: "High Risk", value: `${exposure.highRiskPercent}%`, icon: Zap, color: exposure.highRiskPercent > 20 ? "text-danger" : "text-warning", bg: exposure.highRiskPercent > 20 ? "from-danger/12 to-danger/4" : "from-warning/12 to-warning/4" },
  ];

  return (
    <div className="space-y-8">
      <FadeIn>
        <h2 className="font-serif text-3xl italic text-text-primary tracking-tight">
          Exposição & Risco
        </h2>
        <p className="text-sm text-text-muted mt-1">Análise detalhada do risco agregado</p>
      </FadeIn>

      {/* Metrics */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <StaggerItem key={m.label}>
              <Card accent>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">{m.label}</span>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${m.bg} flex items-center justify-center ring-1 ring-white/5`}>
                      <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    </div>
                  </div>
                  {m.badge ? (
                    <RiskBadge level={exposure.aggregateRisk} />
                  ) : (
                    <div className={`text-2xl font-extrabold tabular-nums ${m.color}`}>{m.value}</div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FadeIn delay={0.15}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-accent" />
                <CardTitle>Distribuição por Camada</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {distData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#5c5849", fontSize: 9, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#5c5849", fontSize: 9, fontWeight: 700 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: "#0f1118", border: "1px solid #1f2233", borderRadius: "12px", fontSize: "11px", color: "#eee9df" }}
                      formatter={(value: any) => [`${value}%`, "Alocação"]}
                    />
                    <Bar dataKey="value" name="Percentual" radius={[4, 4, 0, 0]}>
                      {distData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-text-muted">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-accent" />
                <CardTitle>Perfil de Qualidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#1f2233" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9a9484", fontSize: 9, fontWeight: 700 }} />
                    <Radar name="Qualidade" dataKey="value" stroke="#e4ba60" fill="#e4ba60" fillOpacity={0.1} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-text-muted">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Detailed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FadeIn delay={0.25}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4 text-accent" />
                <CardTitle>Concentração por Mercado</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketData.map((m) => (
                  <div key={m.market}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-text-secondary font-medium">{m.market}</span>
                      <span className="text-[10px] font-bold text-text-primary tabular-nums">{m.count}x ({m.percent}%)</span>
                    </div>
                    <Progress value={m.percent} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card accent>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <CardTitle>Alertas de Risco</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    ok: exposure.exposedPercent <= 50,
                    warn: exposure.exposedPercent <= 80,
                    title: `Exposição: ${exposure.exposedPercent}%`,
                    desc: exposure.exposedPercent > 80 ? "Exposição muito alta." : exposure.exposedPercent > 50 ? "Exposição moderada." : "Dentro de limites saudáveis.",
                  },
                  {
                    ok: exposure.sameScenario,
                    warn: true,
                    title: "Coerência de Cenário",
                    desc: exposure.sameScenario ? "Apostas seguem o mesmo cenário." : "Apostas divididas entre cenários.",
                  },
                  ...(exposure.highRiskPercent > 0 ? [{
                    ok: exposure.highRiskPercent <= 10,
                    warn: exposure.highRiskPercent <= 20,
                    title: `${exposure.highRiskPercent}% em Odds 20x+`,
                    desc: exposure.highRiskPercent > 20 ? "Proporção elevada." : "Proporção aceitável.",
                  }] : []),
                  {
                    ok: exposure.scenarioDependency <= 60,
                    warn: exposure.scenarioDependency <= 80,
                    title: `Dependência: ${exposure.scenarioDependency}%`,
                    desc: exposure.scenarioDependency > 80 ? "Alta dependência em cenário único." : "Boa diversificação.",
                  },
                ].map((alert, i) => {
                  const status = alert.ok ? "ok" : alert.warn ? "warn" : "danger";
                  const colors = {
                    ok: { bg: "bg-risk-low/5 border-risk-low/15", icon: "bg-risk-low/10 text-risk-low" },
                    warn: { bg: "bg-warning/5 border-warning/15", icon: "bg-warning/10 text-warning" },
                    danger: { bg: "bg-danger/5 border-danger/15", icon: "bg-danger/10 text-danger" },
                  }[status];

                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${colors.bg}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colors.icon}`}>
                        {alert.ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">{alert.title}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{alert.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
