"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header sidebarCollapsed={collapsed} />

      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <div className="p-5 lg:p-6 max-w-[1400px] mx-auto">
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
          },
        }}
      />
    </div>
  );
}
