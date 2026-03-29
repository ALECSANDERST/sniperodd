"use client";

import { useState, useEffect } from "react";
import { SportEvent } from "@/types";
import { Search, Calendar, Loader2 } from "lucide-react";

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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Selecione o Jogo
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar time ou campeonato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando jogos...
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filtered.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelect(game)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                selected?.id === game.id
                  ? "border-accent bg-accent-glow"
                  : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-text-primary">
                    {game.homeTeam}
                  </span>
                  <span className="text-text-muted mx-2">vs</span>
                  <span className="font-semibold text-text-primary">
                    {game.awayTeam}
                  </span>
                </div>
                {selected?.id === game.id && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium">
                    Selecionado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(game.commenceTime)}
                </span>
                {game.sport && (
                  <span className="text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                    {game.sport}
                  </span>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-6 text-text-muted">
              Nenhum jogo encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
