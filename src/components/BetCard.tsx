"use client";

import { GeneratedBet } from "@/types";
import { TrendingUp, Lock, Pencil, AlertTriangle, CheckCircle, Info, Star, Zap } from "lucide-react";
import { useState } from "react";

interface Props {
  bet: GeneratedBet;
  index: number;
  onFix: (id: string) => void;
  onEditStake: (id: string, newStake: number) => void;
  manualMode: boolean;
}

export default function BetCard({ bet, index, onFix, onEditStake, manualMode }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(bet.stake.toString());

  const riskColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    baixo: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", label: "Baixo" },
    medio: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Médio" },
    alto: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", label: "Alto" },
    muito_alto: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Muito Alto" },
    extremo: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30", label: "Extremo" },
  };

  const qualityColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    excelente: { bg: "bg-green-500/10", text: "text-green-400", icon: <Star className="w-3 h-3 fill-green-400" /> },
    boa: { bg: "bg-blue-500/10", text: "text-blue-400", icon: <CheckCircle className="w-3 h-3" /> },
    descartada: { bg: "bg-red-500/10", text: "text-red-400", icon: <AlertTriangle className="w-3 h-3" /> },
  };

  const risk = riskColors[bet.riskLevel] || riskColors.medio;
  const quality = qualityColors[bet.quality.label] || qualityColors.boa;

  const handleSaveStake = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      onEditStake(bet.id, val);
    }
    setEditing(false);
  };

  // Score visual (barra circular)
  const scorePercent = bet.quality.total;
  const scoreColor =
    scorePercent >= 85 ? "text-green-400" : scorePercent >= 75 ? "text-blue-400" : "text-orange-400";

  return (
    <div
      className={`card-glow rounded-2xl border p-5 transition-all ${
        bet.fixed
          ? "border-accent/50 bg-accent/5"
          : "border-border bg-bg-card hover:bg-bg-card-hover"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {bet.layer}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Score de qualidade */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${quality.bg} ${quality.text}`}>
            {quality.icon}
            {bet.quality.total}/100
          </div>
          {/* Risco */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${risk.bg} ${risk.text} ${risk.border} border`}>
            {bet.riskLevel === "extremo" || bet.riskLevel === "muito_alto" ? (
              <Zap className="w-3 h-3" />
            ) : bet.riskLevel === "alto" ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Info className="w-3 h-3" />
            )}
            {risk.label}
          </div>
        </div>
      </div>

      {/* Seleções */}
      <div className="space-y-1.5 mb-3">
        {bet.selections.map((sel, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 bg-bg-secondary rounded-xl"
          >
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">{sel.market}</div>
              <div className="text-sm font-semibold text-text-primary">{sel.selection}</div>
            </div>
            <div className="text-accent font-bold text-sm">{sel.odd.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Score breakdown mini */}
      <div className="grid grid-cols-5 gap-1 mb-3">
        {[
          { label: "Coerência", value: bet.quality.coherence, max: 25 },
          { label: "Seleções", value: bet.quality.selectionCount, max: 20 },
          { label: "Odd", value: bet.quality.oddRisk, max: 20 },
          { label: "Mercado", value: bet.quality.marketType, max: 15 },
          { label: "Correlação", value: bet.quality.correlation, max: 20 },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="h-1 bg-bg-secondary rounded-full overflow-hidden mb-0.5">
              <div
                className={`h-full rounded-full ${
                  s.value / s.max > 0.7 ? "bg-green-500" : s.value / s.max > 0.4 ? "bg-blue-500" : "bg-orange-500"
                }`}
                style={{ width: `${(s.value / s.max) * 100}%` }}
              />
            </div>
            <div className="text-[9px] text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-bg-secondary rounded-xl">
          <div className="text-[10px] text-text-muted">Odd Total</div>
          <div className={`text-base font-bold ${scoreColor}`}>{bet.totalOdd.toFixed(2)}</div>
        </div>
        <div className="text-center p-2 bg-bg-secondary rounded-xl">
          <div className="text-[10px] text-text-muted">Stake</div>
          {editing ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveStake}
              onKeyDown={(e) => e.key === "Enter" && handleSaveStake()}
              autoFocus
              className="w-full text-center text-base font-bold bg-transparent text-warning outline-none border-b border-warning"
            />
          ) : (
            <div className="text-base font-bold text-text-primary">R${bet.stake.toFixed(2)}</div>
          )}
        </div>
        <div className="text-center p-2 bg-bg-secondary rounded-xl">
          <div className="text-[10px] text-text-muted">Retorno</div>
          <div className="text-base font-bold text-green-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            R${bet.potentialReturn.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Explicação */}
      <div className="text-[11px] text-text-muted bg-bg-secondary/50 rounded-lg p-2.5 mb-3 leading-relaxed">
        {bet.explanation}
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={() => onFix(bet.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
            bet.fixed
              ? "bg-accent/20 text-accent border border-accent/30"
              : "bg-bg-secondary text-text-secondary hover:bg-bg-card-hover border border-transparent"
          }`}
        >
          <Lock className="w-3 h-3" />
          {bet.fixed ? "Fixada" : "Fixar"}
        </button>
        {manualMode && (
          <button
            onClick={() => {
              setEditValue(bet.stake.toString());
              setEditing(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-bg-secondary text-text-secondary hover:bg-bg-card-hover transition-all"
          >
            <Pencil className="w-3 h-3" />
            Editar Stake
          </button>
        )}
      </div>
    </div>
  );
}
