"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary relative">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header sidebarCollapsed={collapsed} />

      <main
        className={cn(
          "relative z-10 pt-16 min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(228,186,96,0.05)",
            borderRadius: "16px",
          },
        }}
      />
    </div>
  );
}
