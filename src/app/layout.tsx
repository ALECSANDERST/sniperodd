import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/app-layout";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "SniperOdd PRO — Plataforma de Apostas Inteligentes",
  description:
    "Plataforma premium de análise e montagem de apostas para futebol. Análise de cenários, distribuição de banca e gestão de risco.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <TooltipProvider delayDuration={200}>
          <AppLayout>{children}</AppLayout>
        </TooltipProvider>
      </body>
    </html>
  );
}
