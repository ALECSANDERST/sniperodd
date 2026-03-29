"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crosshair,
  Menu,
  X,
  LayoutDashboard,
  ShieldAlert,
  History,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBettingStore } from "@/hooks/use-betting-store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mobileNav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Gerador", href: "/gerador", icon: Crosshair },
  { label: "Exposição", href: "/exposicao", icon: ShieldAlert },
  { label: "Histórico", href: "/historico", icon: History },
];

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export default function Header({ sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const { result } = useBettingStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalReturn = result
    ? result.bets.reduce((s, b) => s + b.potentialReturn, 0)
    : 0;
  const avgQuality =
    result && result.bets.length > 0
      ? Math.round(
          result.bets.reduce((s, b) => s + b.quality.total, 0) /
            result.bets.length
        )
      : 0;

  const pageTitle: Record<string, string> = {
    "/": "Dashboard",
    "/gerador": "Gerador de Apostas",
    "/exposicao": "Exposição & Risco",
    "/historico": "Histórico",
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-16 border-b border-border glass flex items-center justify-between px-5 transition-all duration-300",
          sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[260px]",
          "left-0"
        )}
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Crosshair className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-text-primary">
              Sniper<span className="text-accent">Odd</span>
            </span>
          </div>

          {/* Page title with serif accent */}
          <div className="hidden lg:block">
            <h1 className="text-sm font-semibold text-text-primary">
              {pageTitle[pathname] || "SniperOdd"}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {result && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Score</div>
                <div
                  className={cn(
                    "text-xs font-extrabold tabular-nums",
                    avgQuality >= 85
                      ? "text-risk-low"
                      : avgQuality >= 75
                        ? "text-accent"
                        : "text-warning"
                  )}
                >
                  {avgQuality}
                </div>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Retorno</div>
                <div className="text-xs font-extrabold text-accent tabular-nums">
                  R${totalReturn.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <Link href="/gerador">
            <Button size="sm" className="gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gerar Apostas</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-bg-sidebar border-r border-border flex flex-col">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent pointer-events-none" />

            <div className="p-5 flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center ring-1 ring-accent/10">
                  <Crosshair className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-sm font-bold">
                  Sniper<span className="text-accent">Odd</span>
                </span>
                <span className="text-[8px] px-1.5 py-0.5 bg-accent-muted text-accent rounded font-bold uppercase tracking-widest border border-border-accent">
                  Pro
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 space-y-1 relative">
              {mobileNav.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-accent-muted text-accent"
                        : "text-text-muted hover:text-text-primary hover:bg-bg-card"
                    )}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-5 border-t border-border relative">
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted text-center">
                SniperOdd PRO &copy; {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
