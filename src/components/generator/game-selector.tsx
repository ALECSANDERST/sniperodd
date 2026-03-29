"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SportEvent } from "@/types";
import { Search, Calendar, Loader2, MapPin, Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FadeIn } from "@/components/shared/animate";

interface Props {
  onSelect: (event: SportEvent) => void;
  selected: SportEvent | null;
}

export default function GameSelector({ onSelect, selected }: Props) {
  const [games, setGames] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/odds")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = games.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.homeTeam.toLowerCase().includes(q) ||
      g.awayTeam.toLowerCase().includes(q) ||
      g.sport?.toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce(
    (acc, g) => {
      const key = g.sport || "Outros";
      if (!acc[key]) acc[key] = [];
      acc[key].push(g);
      return acc;
    },
    {} as Record<string, SportEvent[]>
  );

  return (
    <div className="space-y-4">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-focus-within:text-accent" />
        <input
          type="text"
          placeholder="Buscar time, campeonato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/30 focus:ring-2 focus:ring-accent/10 focus:shadow-[0_0_16px_-4px_rgba(228,186,96,0.15)] transition-all duration-300"
        />
      </div>

      {loading ? (
        <FadeIn>
          <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/12 to-accent/4 flex items-center justify-center ring-1 ring-accent/10">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
            </div>
            <span className="text-sm">Carregando jogos...</span>
          </div>
        </FadeIn>
      ) : (
        <ScrollArea className="h-[400px] scroll-fade-y">
          <div className="space-y-5 pr-3">
            {Object.entries(grouped).map(([sport, sportGames], groupIdx) => (
              <motion.div
                key={sport}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24, delay: groupIdx * 0.06 }}
              >
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <MapPin className="w-3 h-3 text-accent/60" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                    {sport}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-text-muted tabular-nums">{sportGames.length}</span>
                </div>
                <div className="space-y-1.5">
                  {sportGames.map((game, gameIdx) => {
                    const isSelected = selected?.id === game.id;
                    return (
                      <motion.button
                        key={game.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24, delay: groupIdx * 0.06 + gameIdx * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(game)}
                        className={cn(
                          "w-full p-3.5 rounded-xl border text-left transition-all duration-200",
                          isSelected
                            ? "border-accent/30 bg-accent-muted ring-1 ring-accent/10 shadow-[0_0_20px_-6px_rgba(228,186,96,0.15)]"
                            : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border-hover"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm min-w-0">
                            <span className={cn("font-semibold truncate", isSelected ? "text-accent" : "text-text-primary")}>
                              {game.homeTeam}
                            </span>
                            <span className="text-text-muted text-[10px] font-bold uppercase shrink-0">vs</span>
                            <span className={cn("font-semibold truncate", isSelected ? "text-accent" : "text-text-primary")}>
                              {game.awayTeam}
                            </span>
                          </div>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 ml-2"
                              >
                                <Check className="w-3 h-3 text-text-inverse" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          <span className="text-[10px] text-text-muted tabular-nums">
                            {formatDate(game.commenceTime)}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <FadeIn>
                <div className="text-center py-12">
                  <div className="empty-state-icon inline-block mb-4">
                    <Search className="w-10 h-10 text-text-muted/20" />
                  </div>
                  <p className="text-sm font-medium text-text-secondary">Nenhum jogo encontrado</p>
                  <p className="text-xs text-text-muted mt-1">Tente buscar por outro time ou campeonato</p>
                </div>
              </FadeIn>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
