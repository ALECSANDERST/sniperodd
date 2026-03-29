import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SniperOdd — Gerador de Bilhetes Inteligentes",
  description:
    "Gere apostas estratégicas em futebol com inteligência profissional. Análise de cenários, distribuição de banca e gestão de risco.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
