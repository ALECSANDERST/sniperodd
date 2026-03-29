"use client";

import { GeneratedBet } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  Lock,
  LockOpen,
  Pencil,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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

  return (
    <Card accent className={cn(
      "bet-ribbon transition-all duration-200",
      bet.fixed && "ring-1 ring-accent/20 border-accent/20 glow-accent"
    )}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center text-accent font-extrabold text-sm ring-1 ring-accent/10"
            >
              {index + 1}
            </motion.div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
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
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: i * 0.04 }}
              className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-border/50 hover:border-border-hover transition-colors"
            >
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted">
                  {sel.market}
                </div>
                <div className="text-sm font-semibold text-text-primary truncate mt-0.5">
                  {sel.selection}
                </div>
              </div>
              <div className="text-accent font-extrabold text-sm pl-3 shrink-0 tabular-nums">
                {sel.odd.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Financial summary */}
        <div className="divider-gradient mb-4" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-bg-elevated rounded-xl border border-border/50">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">Odd Total</div>
            <div className="text-lg font-extrabold text-text-primary tabular-nums">
              {bet.totalOdd.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 bg-bg-elevated rounded-xl border border-border/50">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">Stake</div>
            {editing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveStake}
                onKeyDown={(e) => e.key === "Enter" && handleSaveStake()}
                autoFocus
                className="w-full text-center text-lg font-extrabold bg-transparent text-warning outline-none border-b border-warning tabular-nums"
              />
            ) : (
              <div className="text-lg font-extrabold text-text-primary tabular-nums">
                R${bet.stake.toFixed(2)}
              </div>
            )}
          </div>
          <div className="text-center p-3 bg-bg-elevated rounded-xl border border-border/50">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">Retorno</div>
            <div className="text-lg font-extrabold text-accent tabular-nums flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              R${bet.potentialReturn.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-[11px] text-text-secondary bg-bg-secondary/50 rounded-xl p-3.5 mb-4 leading-relaxed border border-border/30">
          {bet.explanation}
        </div>

        {/* Coherence badge */}
        {bet.coherence && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-xl mb-4 border text-[11px]",
            bet.coherence.label === "muito_coerente" && "bg-risk-low/5 border-risk-low/20 text-risk-low",
            bet.coherence.label === "coerente" && "bg-info/5 border-info/20 text-info",
            bet.coherence.label === "fraca" && "bg-warning/5 border-warning/20 text-warning",
            (bet.coherence.label === "incoerente" || bet.coherence.label === "impossivel") && "bg-risk-high/5 border-risk-high/20 text-risk-high",
          )}>
            {bet.coherence.score >= 60 ? (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            ) : bet.coherence.score >= 40 ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                Coerência: {bet.coherence.score}/100
                {bet.coherence.label === "muito_coerente" && " — Muito coerente"}
                {bet.coherence.label === "coerente" && " — Coerente"}
                {bet.coherence.label === "fraca" && " — Coerência fraca"}
                {bet.coherence.label === "incoerente" && " — Incoerente"}
                {bet.coherence.label === "impossivel" && " — Impossível"}
              </span>
              {bet.coherence.conflicts.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {bet.coherence.conflicts.map((c, i) => (
                    <div key={i} className="text-[10px] opacity-80">
                      {c.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality breakdown */}
        <motion.button
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted hover:text-text-secondary cursor-pointer transition-colors duration-200 mb-3"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Score: {bet.quality.total}/100
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 mb-4 p-3.5 bg-bg-elevated rounded-xl border border-border/50">
                {[
                  { label: "Coerência", value: bet.quality.coherence, max: 25 },
                  { label: "Seleções", value: bet.quality.selectionCount, max: 20 },
                  { label: "Risco da Odd", value: bet.quality.oddRisk, max: 20 },
                  { label: "Mercado", value: bet.quality.marketType, max: 15 },
                  { label: "Correlação", value: bet.quality.correlation, max: 20 },
                ].map((s, i) => {
                  const pct = Math.round((s.value / s.max) * 100);
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24, delay: i * 0.04 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-text-muted">{s.label}</span>
                        <span className="text-[10px] font-bold text-text-secondary tabular-nums">
                          {s.value}/{s.max}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-1"
                        indicatorClassName={
                          pct >= 70
                            ? "bg-gradient-to-r from-risk-low/60 to-risk-low"
                            : pct >= 40
                              ? "bg-gradient-to-r from-info/60 to-info"
                              : "bg-gradient-to-r from-warning/60 to-warning"
                        }
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={bet.fixed ? "outline" : "secondary"}
            size="sm"
            onClick={() => onFix(bet.id)}
            className="flex-1 gap-1.5"
          >
            {bet.fixed ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
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
              aria-label="Regenerar aposta"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
