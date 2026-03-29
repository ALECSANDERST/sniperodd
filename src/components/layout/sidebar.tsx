"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Crosshair,
  ShieldAlert,
  History,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Gerador", href: "/gerador", icon: Crosshair, highlight: true },
  { label: "Exposição", href: "/exposicao", icon: ShieldAlert },
  { label: "Histórico", href: "/historico", icon: History },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-bg-sidebar border-r border-border flex flex-col transition-all duration-300 ease-out hidden lg:flex",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-teal/[0.01] pointer-events-none" />

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0 ring-1 ring-accent/10"
          >
            <Crosshair className="w-4 h-4 text-accent" />
          </motion.div>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary tracking-tight whitespace-nowrap">
                Sniper<span className="text-accent font-serif italic">Odd</span>
              </span>
              <span className="text-[8px] px-1.5 py-0.5 bg-accent-muted text-accent rounded font-bold uppercase tracking-widest border border-border-accent">
                Pro
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto relative">
        {!collapsed && (
          <div className="px-3 mb-4">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Navegação
            </span>
          </div>
        )}
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-accent-muted text-accent shadow-[0_0_20px_-6px_rgba(228,186,96,0.1)]"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-card",
                  collapsed && "justify-center px-0"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-[17px] h-[17px] shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.highlight && !isActive && (
                  <Zap className="w-3 h-3 text-accent/50 ml-auto" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border relative">
        {!collapsed && (
          <div className="px-3 mb-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted">
              Motor v2.0
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-bg-card transition-all text-xs"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="font-medium">Recolher</span>
            </>
          )}
        </motion.button>
      </div>
    </aside>
  );
}
