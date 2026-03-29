"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/shared/risk-badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/animate";
import BetConfigurator from "@/components/generator/bet-configurator";
import BetCard from "@/components/generator/bet-card";
import {
  Link2,
  Search,
  Loader2,
  Brain,
  Crosshair,
  Zap,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  PieChart,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  Clipboard,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  RiskProfile,
  StakeMode,
  SportEvent,
  GameOdds,
  GenerationResult,
  GeneratedBet,
  GameInput,
  ParsedLink,
  LinkMatchResult,
  RISK_PROFILE_CONFIG,
} from "@/types";
import { generateBets } from "@/lib/betting-engine";

type AnalysisStep = "input" | "matching" | "config" | "loading" | "results";
type OddsSource = "live" | "live+api" | "api" | "estimated" | "mock" | "none";

interface AnalysisConfig {
  totalInvestment: number;
  betCount: number;
  minOdd: number;
  maxOdd: number;
  riskProfile: RiskProfile;
  stakeMode: StakeMode;
}

const SOURCE_LABELS: Record<string, string> = {
  betano: "Betano",
  sportingbet: "Sportingbet",
  bet365: "Bet365",
  betfair: "Betfair",
  "1xbet": "1xBet",
  pixbet: "PixBet",
  stake: "Stake",
};

export default function AnalisePage() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<AnalysisStep>("input");
  const [parsed, setParsed] = useState<ParsedLink | null>(null);
  const [suggestions, setSuggestions] = useState<LinkMatchResult[]>([]);
  const [matchedEvent, setMatchedEvent] = useState<SportEvent | null>(null);
  const [odds, setOdds] = useState<GameOdds | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oddsSource, setOddsSource] = useState<OddsSource>("none");
  const [config, setConfig] = useState<AnalysisConfig>({
    totalInvestment: 500,
    betCount: 3,
    minOdd: 2.0,
    maxOdd: 4.0,
    riskProfile: "moderado",
    stakeMode: "automatico",
  });

  const updateConfig = useCallback((partial: Partial<AnalysisConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const setRiskProfile = useCallback((profile: RiskProfile) => {
    const cfg = RISK_PROFILE_CONFIG[profile];
    setConfig((prev) => ({
      ...prev,
      riskProfile: profile,
      minOdd: cfg.oddMin,
      maxOdd: cfg.oddMax,
    }));
  }, []);

  const analyzeLink = useCallback(async () => {
    if (!url.trim()) return;
    setStep("matching");
    setError(null);
    setParsed(null);
    setSuggestions([]);
    setMatchedEvent(null);
    setOdds(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erro ao analisar o link");
      }

      const data = await res.json();
      setParsed(data.parsed);
      setSuggestions(data.suggestions || []);

      if (data.match && data.odds) {
        setMatchedEvent(data.match.event);
        setOdds(data.odds);
        setOddsSource(data.oddsSource || "mock");
        setStep("config");

        const sourceLabel = data.oddsSource === "live" || data.oddsSource === "live+api"
          ? "odds ao vivo"
          : data.oddsSource === "api"
            ? "odds atualizadas"
            : "odds estimadas";
        toast.success("Jogo encontrado!", {
          description: `${data.match.event.homeTeam} vs ${data.match.event.awayTeam} — ${sourceLabel}`,
        });
      } else if (data.suggestions?.length > 0) {
        setStep("matching");
      } else {
        setError("Nenhum jogo encontrado para este link. Verifique a URL e tente novamente.");
        setStep("input");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setStep("input");
    }
  }, [url]);

  const selectMatch = useCallback(async (match: LinkMatchResult) => {
    setMatchedEvent(match.event);
    setStep("config");

    // Fetch odds if not already available
    if (!odds) {
      try {
        const res = await fetch(
          `/api/odds?eventId=${match.event.id}&sportKey=${match.event.sportKey || ""}`
        );
        const oddsData = await res.json();
        setOdds(oddsData);
      } catch {
        toast.error("Erro ao buscar odds. Usando dados disponíveis.");
      }
    }
  }, [odds]);

  const generateAnalysis = useCallback(async () => {
    if (!matchedEvent || !odds) return;
    setStep("loading");

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 800));

    try {
      const profileCfg = RISK_PROFILE_CONFIG[config.riskProfile];
      const input: GameInput = {
        eventId: matchedEvent.id,
        homeTeam: matchedEvent.homeTeam,
        awayTeam: matchedEvent.awayTeam,
        totalInvestment: config.totalInvestment,
        betCount: config.betCount,
        minOdd: profileCfg.oddMin,
        maxOdd: profileCfg.oddMax,
        riskProfile: config.riskProfile,
        stakeMode: config.stakeMode,
      };

      const generated = generateBets(input, odds);
      setResult(generated);
      setStep("results");
      toast.success("Análise concluída!", {
        description: `${generated.bets.length} apostas geradas com sucesso.`,
      });
    } catch {
      setError("Erro ao gerar apostas. Tente novamente.");
      setStep("config");
    }
  }, [matchedEvent, odds, config]);

  const reset = useCallback(() => {
    setUrl("");
    setStep("input");
    setParsed(null);
    setSuggestions([]);
    setMatchedEvent(null);
    setOdds(null);
    setResult(null);
    setError(null);
  }, []);

  const toggleFix = useCallback((betId: string) => {
    if (!result) return;
    setResult({
      ...result,
      bets: result.bets.map((b) =>
        b.id === betId ? { ...b, fixed: !b.fixed } : b
      ),
    });
  }, [result]);

  const editStake = useCallback((betId: string, newStake: number) => {
    if (!result) return;
    setResult({
      ...result,
      bets: result.bets.map((b) =>
        b.id === betId
          ? { ...b, stake: newStake, potentialReturn: +(newStake * b.totalOdd).toFixed(2) }
          : b
      ),
    });
  }, [result]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Clipboard API not available
    }
  }, []);

  const totalReturn = result ? result.bets.reduce((s, b) => s + b.potentialReturn, 0) : 0;
  const totalStaked = result ? result.bets.reduce((s, b) => s + b.stake, 0) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl italic tracking-tight text-gradient-gold">
              Análise por Link
            </h2>
            <p className="text-sm text-text-secondary mt-1.5">
              Cole o link de qualquer casa de apostas e receba sugestões inteligentes
            </p>
          </div>
          {step !== "input" && (
            <Button variant="secondary" onClick={reset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Nova Análise
            </Button>
          )}
        </div>
      </FadeIn>

      {/* Step 1: Link Input */}
      <FadeIn delay={0.05}>
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Link2 className="w-4 h-4 text-accent" />
              <CardTitle>Link do Jogo</CardTitle>
              {parsed && (
                <Badge>{SOURCE_LABELS[parsed.source] || parsed.source}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent">
                  <Link2 className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  placeholder="Cole o link do jogo aqui... (Betano, Bet365, Sportingbet, etc.)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyzeLink()}
                  disabled={step === "matching" || step === "loading"}
                  className="w-full pl-12 pr-24 py-3.5 bg-bg-elevated border border-border rounded-xl text-text-primary text-sm font-medium focus:outline-none focus:border-accent/30 focus:ring-2 focus:ring-accent/10 focus:shadow-[0_0_16px_-4px_rgba(228,186,96,0.15)] transition-all duration-300 placeholder:text-text-muted/50"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePaste}
                    className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card cursor-pointer transition-colors"
                    title="Colar"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={analyzeLink}
                  disabled={!url.trim() || step === "matching" || step === "loading"}
                  className="gap-1.5"
                >
                  {step === "matching" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {step === "matching" ? "Analisando..." : "Analisar Jogo"}
                </Button>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/5 border border-danger/15"
                >
                  <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <p className="text-xs text-danger font-medium">{error}</p>
                </motion.div>
              )}

              {/* Supported houses */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] text-text-muted font-medium">Suportados:</span>
                {["Betano", "Bet365", "Sportingbet", "Betfair", "1xBet", "PixBet", "Stake"].map((h) => (
                  <span
                    key={h}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Step 2: Match suggestions (when auto-match fails) */}
      <AnimatePresence>
        {step === "matching" && suggestions.length > 0 && (
          <FadeIn>
            <Card accent>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <Crosshair className="w-4 h-4 text-accent" />
                  <CardTitle>Jogos Encontrados</CardTitle>
                  <Badge>{suggestions.length} resultado{suggestions.length > 1 ? "s" : ""}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-muted mb-4">
                  {parsed?.homeTeam && parsed?.awayTeam
                    ? `Buscando: ${parsed.homeTeam} vs ${parsed.awayTeam}`
                    : "Selecione o jogo correto abaixo:"}
                </p>
                <StaggerContainer className="space-y-2">
                  {suggestions.map((match, i) => (
                    <StaggerItem key={match.event.id}>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => selectMatch(match)}
                        className="w-full p-4 rounded-xl border border-border bg-bg-card hover:bg-bg-card-hover hover:border-accent/20 cursor-pointer transition-all duration-200 text-left flex items-center gap-4"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-bold text-text-primary">
                            {match.event.homeTeam} vs {match.event.awayTeam}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-text-muted">{match.event.sport}</span>
                            <span className="text-[10px] text-text-muted">
                              {new Date(match.event.commenceTime).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={match.confidence >= 85 ? "success" : match.confidence >= 70 ? "info" : "warning"}>
                            {match.confidence}%
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-text-muted" />
                        </div>
                      </motion.button>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </AnimatePresence>

      {/* Step 3: Config (same as Gerador - full control) */}
      <AnimatePresence>
        {(step === "config" || step === "results" || step === "loading") && matchedEvent && (
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Matched game info */}
              <div className="lg:col-span-2">
                <Card accent>
                  <CardHeader>
                    <div className="flex items-center gap-2.5">
                      <Crosshair className="w-4 h-4 text-accent" />
                      <CardTitle>Jogo Selecionado</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-bg-elevated border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-extrabold text-text-primary">
                            {matchedEvent.homeTeam}
                          </div>
                          <span className="text-xs font-bold text-accent px-2 py-1 bg-accent-muted rounded-lg">VS</span>
                          <div className="text-lg font-extrabold text-text-primary text-right">
                            {matchedEvent.awayTeam}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted">
                          <span>{matchedEvent.sport}</span>
                          <span>
                            {new Date(matchedEvent.commenceTime).toLocaleDateString("pt-BR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {parsed && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                            <ExternalLink className="w-3 h-3" />
                            <span>via {SOURCE_LABELS[parsed.source] || parsed.source}</span>
                          </div>
                          <Badge variant={
                            oddsSource === "live" || oddsSource === "live+api" ? "success"
                              : oddsSource === "api" ? "info"
                                : "warning"
                          }>
                            {oddsSource === "live" || oddsSource === "live+api" ? "Odds ao vivo"
                              : oddsSource === "api" ? "Odds atualizadas"
                                : "Odds estimadas"}
                          </Badge>
                        </div>
                      )}

                      {odds && (
                        <div>
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2">
                            Mercados disponíveis
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {odds.markets.map((m) => (
                              <span
                                key={m.key}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-bg-card border border-border text-text-secondary font-medium"
                              >
                                {m.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {step === "config" && (
                        <Button
                          onClick={reset}
                          variant="secondary"
                          size="sm"
                          className="w-full gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Trocar jogo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Config panel - full configurator */}
              <div className="lg:col-span-3">
                <Card accent>
                  <CardHeader>
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-accent" />
                      <CardTitle>Configuração</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BetConfigurator
                      config={config}
                      onUpdate={updateConfig}
                      onSetRiskProfile={setRiskProfile}
                    />

                    {step === "config" && (
                      <div className="mt-6">
                        <Button
                          onClick={generateAnalysis}
                          disabled={!odds}
                          className="w-full gap-1.5"
                        >
                          <Brain className="w-4 h-4" />
                          Gerar Apostas
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </FadeIn>
        )}
      </AnimatePresence>

      {/* Loading */}
      <AnimatePresence>
        {step === "loading" && (
          <FadeIn>
            <Card accent>
              <CardContent className="py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-teal/5 border border-border flex items-center justify-center mx-auto mb-6 ring-1 ring-accent/10">
                  <Loader2 className="w-7 h-7 text-accent animate-spin" />
                </div>
                <h3 className="font-serif text-2xl italic text-text-primary mb-2">
                  Analisando cenário...
                </h3>
                <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                  Calculando correlações entre mercados e validando coerência das apostas
                </p>
                <div className="flex items-center justify-center gap-4 mt-6 text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
                    Cenário
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                    Coerência
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
      </AnimatePresence>

      {/* Step 4: Results */}
      {step === "results" && result && (
        <div className="space-y-5">
          {/* Scenario + stats banner */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="flex-1 border-accent/15 bg-accent-muted">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow shrink-0" />
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-extrabold text-accent">
                      {result.scenarioLabel}
                    </span>
                    <Badge>{result.scenarioConfidence}% confiança</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted block">
                        Investido
                      </span>
                      <span className="font-extrabold text-text-primary text-sm tabular-nums">
                        R${totalStaked.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted block">
                        Retorno
                      </span>
                      <span className="font-extrabold text-accent text-sm tabular-nums">
                        R${totalReturn.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted block">
                        Lucro
                      </span>
                      <span className="font-extrabold text-accent text-sm tabular-nums">
                        R${(totalReturn - config.totalInvestment).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* Regenerate */}
          <FadeIn delay={0.05}>
            <div className="flex gap-2">
              <Button onClick={generateAnalysis} className="gap-1.5">
                <Brain className="w-4 h-4" />
                Regenerar
              </Button>
              <Button variant="secondary" onClick={reset} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Nova Análise
              </Button>
            </div>
          </FadeIn>

          {/* Bets + Sidebar */}
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
                      onRegenerate={generateAnalysis}
                      manualMode={config.stakeMode === "manual"}
                    />
                  </StaggerItem>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="w-10 h-10 text-warning/30 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-text-secondary">
                      Nenhuma aposta passou no filtro
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Score mínimo: 70. Tente outro perfil de risco.
                    </p>
                  </CardContent>
                </Card>
              )}
            </StaggerContainer>

            {/* Sidebar */}
            <FadeIn delay={0.2} className="space-y-4">
              {/* Scenario card */}
              <Card accent>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent" />
                    <CardTitle>Cenário</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-extrabold text-accent">
                      {result.scenarioLabel}
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
                        <span className="font-bold uppercase tracking-[0.1em]">Confiança</span>
                        <span className="font-bold tabular-nums">{result.scenarioConfidence}%</span>
                      </div>
                      <Progress
                        value={result.scenarioConfidence}
                        indicatorClassName={
                          result.scenarioConfidence >= 80
                            ? "bg-gradient-to-r from-risk-low/60 to-risk-low"
                            : result.scenarioConfidence >= 60
                              ? "bg-gradient-to-r from-accent-dim to-accent"
                              : "bg-gradient-to-r from-warning/60 to-warning"
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
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                          Banca
                        </span>
                        <span className="text-xs font-extrabold text-text-primary tabular-nums">
                          R${result.exposure.totalExposed.toFixed(2)} ({result.exposure.exposedPercent}%)
                        </span>
                      </div>
                      <Progress
                        value={Math.min(result.exposure.exposedPercent, 100)}
                        indicatorClassName={
                          result.exposure.exposedPercent > 80
                            ? "bg-gradient-to-r from-danger/60 to-danger"
                            : result.exposure.exposedPercent > 50
                              ? "bg-gradient-to-r from-warning/60 to-warning"
                              : "bg-gradient-to-r from-accent-dim to-accent"
                        }
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" />
                          Mesmo Cenário
                        </span>
                        <span
                          className={`text-[10px] font-bold ${result.exposure.sameScenario ? "text-risk-low" : "text-danger"}`}
                        >
                          {result.exposure.sameScenario ? "Sim" : "Não"}
                        </span>
                      </div>

                      {result.exposure.highRiskPercent > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            Odds 20x+
                          </span>
                          <span
                            className={`text-[10px] font-bold ${result.exposure.highRiskPercent > 20 ? "text-danger" : "text-warning"}`}
                          >
                            {result.exposure.highRiskPercent}%
                          </span>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                          Agregado
                        </span>
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
                            <span className="text-[10px] text-text-secondary font-medium">
                              {d.label}
                            </span>
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
      {step === "input" && !error && (
        <FadeIn delay={0.1}>
          <Card accent>
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/3 border border-border flex items-center justify-center mx-auto mb-6 ring-1 ring-accent/10">
                <Link2 className="w-7 h-7 text-accent/40" />
              </div>
              <h3 className="font-serif text-2xl italic text-text-primary mb-2">
                Cole um link para começar
              </h3>
              <p className="text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
                Copie o link de um jogo de qualquer casa de apostas. O motor analisa
                automaticamente e gera apostas coerentes com o perfil que você escolher.
              </p>
              <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-risk-low" />
                  Coerência
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  6 Perfis
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  7+ Casas
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
