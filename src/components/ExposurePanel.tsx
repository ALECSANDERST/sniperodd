"use client";

import { ExposureAnalysis } from "@/types";
import { ShieldAlert, TrendingUp, Eye, CheckCircle, PieChart, AlertTriangle, Brain } from "lucide-react";

interface Props {
  exposure: ExposureAnalysis;
  scenarioConfidence: number;
}

export default function ExposurePanel({ exposure, scenarioConfidence }: Props) {
  const riskColors: Record<string, { bg: string; text: string; bar: string }> = {
    baixo: { bg: "from-green-500/20 to-green-500/5", text: "text-green-400", bar: "bg-green-500" },
    medio: { bg: "from-blue-500/20 to-blue-500/5", text: "text-blue-400", bar: "bg-blue-500" },
    alto: { bg: "from-orange-500/20 to-orange-500/5", text: "text-orange-400", bar: "bg-orange-500" },
    muito_alto: { bg: "from-red-500/20 to-red-500/5", text: "text-red-400", bar: "bg-red-500" },
    extremo: { bg: "from-pink-500/20 to-pink-500/5", text: "text-pink-400", bar: "bg-pink-500" },
  };

  const riskLabels: Record<string, string> = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
    muito_alto: "Muito Alto",
    extremo: "Extremo",
  };

  const risk = riskColors[exposure.aggregateRisk] || riskColors.medio;

  return (
    <div className="space-y-4">
      {/* Cenário */}
      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-accent" />
          <h3 className="font-bold text-sm text-text-primary">Cenário Detectado</h3>
        </div>
        <div className="text-sm font-semibold text-accent mb-2">{exposure.scenarioLabel}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Confiança</span>
          <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scenarioConfidence >= 80 ? "bg-green-500" : scenarioConfidence >= 60 ? "bg-blue-500" : "bg-orange-500"
              }`}
              style={{ width: `${scenarioConfidence}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-text-primary">{scenarioConfidence}%</span>
        </div>
      </div>

      {/* Exposição */}
      <div className={`rounded-2xl border border-border bg-gradient-to-br ${risk.bg} p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className={`w-4 h-4 ${risk.text}`} />
          <h3 className="font-bold text-sm text-text-primary">Exposição</h3>
        </div>

        <div className="space-y-3">
          {/* Banca exposta */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-secondary flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Banca Exposta
              </span>
              <span className={`text-xs font-bold ${risk.text}`}>
                R${exposure.totalExposed.toFixed(2)} ({exposure.exposedPercent}%)
              </span>
            </div>
            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${risk.bar}`}
                style={{ width: `${Math.min(exposure.exposedPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Cenário coerente */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Mesmo Cenário
            </span>
            <span className={`text-xs font-semibold ${exposure.sameScenario ? "text-green-400" : "text-red-400"}`}>
              {exposure.sameScenario ? "Sim" : "Não"}
            </span>
          </div>

          {/* High risk */}
          {exposure.highRiskPercent > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Banca em odds 20x+
              </span>
              <span className={`text-xs font-bold ${exposure.highRiskPercent > 20 ? "text-red-400" : "text-orange-400"}`}>
                {exposure.highRiskPercent}%
              </span>
            </div>
          )}

          {/* Risco agregado */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs font-semibold text-text-secondary">Risco Agregado</span>
            <span className={`text-xs font-bold uppercase ${risk.text}`}>
              {riskLabels[exposure.aggregateRisk] || exposure.aggregateRisk}
            </span>
          </div>
        </div>
      </div>

      {/* Distribuição */}
      {exposure.distributionByType.length > 0 && (
        <div className="rounded-2xl border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm text-text-primary">Distribuição</h3>
          </div>
          <div className="space-y-2">
            {exposure.distributionByType.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">{d.label}</span>
                  <span className="text-xs font-semibold text-text-primary">
                    R${d.amount.toFixed(2)} ({d.percent}%)
                  </span>
                </div>
                <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
