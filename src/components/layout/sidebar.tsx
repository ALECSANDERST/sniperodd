"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Crosshair,
  ShieldAlert,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Gerador",
    href: "/gerador",
    icon: Crosshair,
    accent: true,
  },
  {
    label: "Exposição",
    href: "/exposicao",
    icon: ShieldAlert,
  },
  {
    label: "Histórico",
    href: "/historico",
    icon: History,
  },
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
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Crosshair className="w-4.5 h-4.5 text-accent" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-text-primary tracking-tight whitespace-nowrap">
                Sniper<span className="text-accent">Odd</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded font-semibold">
                PRO
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Menu
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
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-card",
                collapsed && "justify-center px-0"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.accent && !isActive && (
                <Zap className="w-3 h-3 text-accent ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-bg-card transition-all text-xs"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
