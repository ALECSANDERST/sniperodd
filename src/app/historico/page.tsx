"use client";

import { useBettingStore, HistoryEntry } from "@/hooks/use-betting-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/shared/risk-badge";
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { RISK_PROFILE_CONFIG } from "@/types";
import Link from "next/link";
import { useState } from "react";
import {
  History,
  Crosshair,
  ArrowRight,
  Target,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoricoPage() {
  const { history } = useBettingStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterProfile, setFilterProfile] = useState<string | null>(null);

  const filtered = filterProfile
    ? history.filter((h) => h.riskProfile === filterProfile)
    : history;

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            Histórico
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Registro de todas as apostas geradas
          </p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <History className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-base font-bold text-text-primary mb-2">
              Nenhuma geração registrada
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Seu histórico aparecerá aqui após gerar apostas.
            </p>
            <Link href="/gerador">
              <Button className="gap-1.5">
                <Crosshair className="w-4 h-4" />
                Gerar Apostas
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profiles = [...new Set(history.map((h) => h.riskProfile))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            Histórico
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {history.length} geração{history.length !== 1 ? "ões" : ""} registrada{history.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          Filtrar:
        </div>
        <button
          onClick={() => setFilterProfile(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            !filterProfile
              ? "bg-accent/10 text-accent border border-accent/20"
              : "bg-bg-card text-text-muted border border-border hover:text-text-secondary"
          )}
        >
          Todos
        </button>
        {profiles.map((p) => (
          <button
            key={p}
            onClick={() => setFilterProfile(filterProfile === p ? null : p)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filterProfile === p
                ? "bg-accent/10 text-accent border border-accent/20"
                : "bg-bg-card text-text-muted border border-border hover:text-text-secondary"
            )}
          >
            {RISK_PROFILE_CONFIG[p].label}
          </button>
        ))}
      </div>

      {/* History entries */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const profileConfig = RISK_PROFILE_CONFIG[entry.riskProfile];

          return (
            <Card key={entry.id}>
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                {/* Main row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">
                        {entry.game}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.timestamp).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="muted">{profileConfig.label}</Badge>
                        <Badge variant="muted">{entry.betsCount} apostas</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-text-muted">Investido</div>
                      <div className="text-sm font-bold text-text-primary tabular-nums">
                        R${entry.totalInvestment.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Retorno</div>
                      <div className="text-sm font-bold text-accent tabular-nums">
                        R${entry.potentialReturn.toFixed(2)}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <ConfidenceScore score={entry.avgQuality} size="sm" showLabel={false} />
                    </div>
                    <div className="text-text-muted">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs font-semibold text-text-secondary">
                        Cenário: {entry.scenario}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {entry.bets.map((bet, i) => (
                        <div
                          key={bet.id}
                          className="p-3 rounded-xl bg-bg-elevated border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-text-secondary">
                              #{i + 1} {bet.layer}
                            </span>
                            <RiskBadge level={bet.riskLevel} />
                          </div>
                          <div className="space-y-1 mb-2">
                            {bet.selections.map((sel, j) => (
                              <div key={j} className="flex justify-between text-[11px]">
                                <span className="text-text-muted truncate mr-2">{sel.selection}</span>
                                <span className="text-accent font-medium tabular-nums shrink-0">
                                  {sel.odd.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs pt-2 border-t border-border">
                            <span className="text-text-muted">
                              Odd: <span className="text-text-primary font-semibold">{bet.totalOdd.toFixed(2)}</span>
                            </span>
                            <span className="text-text-muted">
                              Stake: <span className="text-text-primary font-semibold">R${bet.stake.toFixed(2)}</span>
                            </span>
                            <span className="text-accent font-semibold">
                              R${bet.potentialReturn.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
