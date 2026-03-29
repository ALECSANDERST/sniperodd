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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#07080d" />
      </head>
      <body className="antialiased">
        <TooltipProvider delayDuration={200}>
          <AppLayout>{children}</AppLayout>
        </TooltipProvider>
      </body>
    </html>
  );
}
