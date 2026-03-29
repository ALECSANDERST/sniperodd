"use client";

import { useState, useEffect } from "react";
import { SportEvent } from "@/types";
import { Search, Calendar, Loader2, MapPin, Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Group by sport
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
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar time, campeonato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Carregando jogos...</span>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-5 pr-3">
            {Object.entries(grouped).map(([sport, sportGames]) => (
              <div key={sport}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {sport}
                  </span>
                  <span className="text-[10px] text-text-muted">({sportGames.length})</span>
                </div>
                <div className="space-y-1.5">
                  {sportGames.map((game) => {
                    const isSelected = selected?.id === game.id;
                    return (
                      <button
                        key={game.id}
                        onClick={() => onSelect(game)}
                        className={cn(
                          "w-full p-3.5 rounded-xl border text-left transition-all duration-200",
                          isSelected
                            ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
                            : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border-hover"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 text-sm min-w-0">
                              <span className="font-semibold text-text-primary truncate">
                                {game.homeTeam}
                              </span>
                              <span className="text-text-muted text-xs shrink-0">vs</span>
                              <span className="font-semibold text-text-primary truncate">
                                {game.awayTeam}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 ml-2">
                              <Check className="w-3 h-3 text-bg-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          <span className="text-[11px] text-text-muted">
                            {formatDate(game.commenceTime)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-text-muted">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum jogo encontrado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
