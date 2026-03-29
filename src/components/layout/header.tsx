"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card cursor-pointer transition-colors duration-200"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Crosshair className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-text-primary">
              Sniper<span className="text-accent">Odd</span>
            </span>
          </div>

          {/* Page title */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              <motion.h1
                key={pathname}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="text-sm font-semibold text-text-primary"
              >
                {pageTitle[pathname] || "SniperOdd"}
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="hidden sm:flex items-center gap-4"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          <Link href="/gerador">
            <Button size="sm" className="gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gerar Apostas</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute left-0 top-0 h-full w-72 bg-bg-sidebar border-r border-border flex flex-col"
            >
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
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar menu"
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card cursor-pointer transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <nav className="flex-1 px-3 space-y-1 relative">
                {mobileNav.map((item, i) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24, delay: i * 0.05 }}
                    >
                      <Link
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
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-5 border-t border-border relative">
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted text-center">
                  SniperOdd PRO &copy; {new Date().getFullYear()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
