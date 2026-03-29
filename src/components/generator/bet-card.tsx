"use client";

import { GeneratedBet } from "@/types";
import {
  TrendingUp,
  Lock,
  LockOpen,
  Pencil,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/shared/risk-badge";
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { Progress } from "@/components/ui/progress";

interface Props {
  bet: GeneratedBet;
  index: number;
  onFix: (id: string) => void;
  onEditStake: (id: string, newStake: number) => void;
  onRegenerate?: () => void;
  manualMode: boolean;
}

export default function BetCard({
  bet,
  index,
  onFix,
  onEditStake,
  onRegenerate,
  manualMode,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(bet.stake.toString());
  const [expanded, setExpanded] = useState(false);

  const handleSaveStake = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      onEditStake(bet.id, val);
    }
    setEditing(false);
  };

  const qualityLabel =
    bet.quality.total >= 85
      ? "Excelente"
      : bet.quality.total >= 70
        ? "Boa"
        : "Regular";

  return (
    <Card
      className={cn(
        "transition-all duration-200 overflow-hidden",
        bet.fixed && "border-accent/30 bg-accent/[0.03]"
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
              #{index + 1}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {bet.layer}
              </div>
              <div className="text-[10px] text-text-muted">{bet.selections.length} seleções</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConfidenceScore score={bet.quality.total} size="sm" showLabel={false} />
            <RiskBadge level={bet.riskLevel} />
          </div>
        </div>

        {/* Selections */}
        <div className="space-y-1.5 mb-4">
          {bet.selections.map((sel, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl"
            >
              <div className="min-w-0">
                <div className="text-[10px] text-text-muted uppercase tracking-wider">
                  {sel.market}
                </div>
                <div className="text-sm font-semibold text-text-primary truncate">
                  {sel.selection}
                </div>
              </div>
              <div className="text-accent font-bold text-sm pl-3 shrink-0 tabular-nums">
                {sel.odd.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-bg-elevated rounded-xl">
            <div className="text-[10px] text-text-muted mb-0.5">Odd Total</div>
            <div className="text-lg font-bold text-text-primary tabular-nums">
              {bet.totalOdd.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 bg-bg-elevated rounded-xl">
            <div className="text-[10px] text-text-muted mb-0.5">Stake</div>
            {editing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveStake}
                onKeyDown={(e) => e.key === "Enter" && handleSaveStake()}
                autoFocus
                className="w-full text-center text-lg font-bold bg-transparent text-warning outline-none border-b border-warning"
              />
            ) : (
              <div className="text-lg font-bold text-text-primary tabular-nums">
                R${bet.stake.toFixed(2)}
              </div>
            )}
          </div>
          <div className="text-center p-3 bg-bg-elevated rounded-xl">
            <div className="text-[10px] text-text-muted mb-0.5">Retorno</div>
            <div className="text-lg font-bold text-accent tabular-nums flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              R${bet.potentialReturn.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-[11px] text-text-muted bg-bg-secondary/50 rounded-lg p-3 mb-4 leading-relaxed">
          {bet.explanation}
        </div>

        {/* Quality breakdown (expandable) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Score de Qualidade: {bet.quality.total}/100 ({qualityLabel})
        </button>

        {expanded && (
          <div className="space-y-2 mb-4 p-3 bg-bg-elevated rounded-xl">
            {[
              { label: "Coerência", value: bet.quality.coherence, max: 25 },
              { label: "Seleções", value: bet.quality.selectionCount, max: 20 },
              { label: "Risco da Odd", value: bet.quality.oddRisk, max: 20 },
              { label: "Mercado", value: bet.quality.marketType, max: 15 },
              { label: "Correlação", value: bet.quality.correlation, max: 20 },
            ].map((s) => {
              const pct = Math.round((s.value / s.max) * 100);
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-muted">{s.label}</span>
                    <span className="text-[10px] font-medium text-text-secondary">
                      {s.value}/{s.max}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className="h-1.5"
                    indicatorClassName={
                      pct >= 70 ? "bg-risk-low" : pct >= 40 ? "bg-info" : "bg-warning"
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={bet.fixed ? "default" : "secondary"}
            size="sm"
            onClick={() => onFix(bet.id)}
            className="flex-1 gap-1.5"
          >
            {bet.fixed ? (
              <Lock className="w-3 h-3" />
            ) : (
              <LockOpen className="w-3 h-3" />
            )}
            {bet.fixed ? "Fixada" : "Fixar"}
          </Button>
          {manualMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditValue(bet.stake.toString());
                setEditing(true);
              }}
              className="flex-1 gap-1.5"
            >
              <Pencil className="w-3 h-3" />
              Editar Stake
            </Button>
          )}
          {onRegenerate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRegenerate}
              className="shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
