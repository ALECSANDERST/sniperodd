import React from "react";
import { AbsoluteFill } from "remotion";

// =============================================
// DESIGN SYSTEM - SniperOdd Brand
// =============================================

const COLORS = {
  bg: "#0a0e1a",
  bgCard: "#111827",
  gold: "#e4ba60",
  goldDim: "#c9a24e",
  teal: "#2dd4bf",
  tealDim: "#14b8a6",
  white: "#eee9df",
  whiteDim: "#b8b0a4",
  red: "#f87171",
  green: "#34d399",
  blue: "#60a5fa",
  purple: "#a78bfa",
};

const PADDING = 80;

// =============================================
// COMPONENTES COMPARTILHADOS
// =============================================

const GrainyOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.04 }) => {
  const noiseFilter = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <filter id="noise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="1"/>
    </svg>
  `;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(noiseFilter)}")`,
      backgroundRepeat: "repeat", opacity, mixBlendMode: "overlay" as const,
      pointerEvents: "none" as const,
    }} />
  );
};

const CrosshairIcon: React.FC<{ size?: number; color?: string }> = ({ size = 120, color = COLORS.gold }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="45" stroke={color} strokeWidth="2.5" opacity="0.3" />
    <circle cx="60" cy="60" r="30" stroke={color} strokeWidth="2" opacity="0.5" />
    <circle cx="60" cy="60" r="8" fill={color} opacity="0.9" />
    <line x1="60" y1="5" x2="60" y2="25" stroke={color} strokeWidth="2" />
    <line x1="60" y1="95" x2="60" y2="115" stroke={color} strokeWidth="2" />
    <line x1="5" y1="60" x2="25" y2="60" stroke={color} strokeWidth="2" />
    <line x1="95" y1="60" x2="115" y2="60" stroke={color} strokeWidth="2" />
  </svg>
);

const ArrowIcon: React.FC<{ color?: string; size?: number }> = ({ color = "#ffffff", size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = COLORS.gold }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 24px", borderRadius: 40,
    border: `2px solid ${color}`, color,
    fontSize: 24, fontWeight: 600, letterSpacing: 2,
    textTransform: "uppercase" as const,
  }}>
    {text}
  </div>
);

const GlassCard: React.FC<{ children: React.ReactNode; highlight?: boolean }> = ({ children, highlight }) => (
  <div style={{
    background: highlight
      ? "linear-gradient(135deg, rgba(228,186,96,0.15), rgba(45,212,191,0.1))"
      : "rgba(255,255,255,0.04)",
    border: `1px solid ${highlight ? "rgba(228,186,96,0.3)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 20, padding: "28px 32px",
  }}>
    {children}
  </div>
);

const SwipeIndicator: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
    <span style={{ fontSize: 22, color: COLORS.whiteDim, fontFamily: "monospace" }}>
      Arraste para ver mais
    </span>
    <ArrowIcon color={COLORS.gold} size={24} />
  </div>
);

// =============================================
// SLIDE 1 — HOOK (Capa)
// =============================================

export const Slide1Hook: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: COLORS.bg,
    background: `radial-gradient(ellipse at 50% 30%, rgba(228,186,96,0.08) 0%, ${COLORS.bg} 70%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }}>
    <GrainyOverlay opacity={0.05} />
    <div style={{
      position: "absolute", top: PADDING, left: PADDING, right: PADDING, bottom: PADDING,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <Badge text="Inteligencia Artificial" />

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 30,
      }}>
        <CrosshairIcon size={160} />

        <h1 style={{
          fontSize: 62, fontWeight: 800, color: COLORS.white,
          textAlign: "center", lineHeight: 1.1, margin: 0,
          letterSpacing: -1,
        }}>
          <span style={{ color: COLORS.gold }}>Sniper</span>Odd
        </h1>

        <p style={{
          fontSize: 36, fontWeight: 500, color: COLORS.whiteDim,
          textAlign: "center", lineHeight: 1.4, margin: 0, maxWidth: 750,
        }}>
          O motor inteligente que gera apostas{"\n"}
          <span style={{ color: COLORS.teal, fontWeight: 700 }}>matematicamente coerentes</span>
        </p>

        <div style={{
          display: "flex", gap: 16, marginTop: 20,
        }}>
          {["IA", "Odds Reais", "Anti-Erro"].map((tag) => (
            <span key={tag} style={{
              padding: "8px 20px", borderRadius: 30,
              background: "rgba(228,186,96,0.12)", border: "1px solid rgba(228,186,96,0.25)",
              color: COLORS.gold, fontSize: 22, fontWeight: 600,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <SwipeIndicator />
    </div>
  </AbsoluteFill>
);

// =============================================
// SLIDE 2 — PROBLEMA
// =============================================

export const Slide2Problem: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: COLORS.bg,
    background: `radial-gradient(ellipse at 50% 70%, rgba(248,113,113,0.06) 0%, ${COLORS.bg} 70%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }}>
    <GrainyOverlay opacity={0.04} />
    <div style={{
      position: "absolute", top: PADDING, left: PADDING, right: PADDING, bottom: PADDING,
      display: "flex", flexDirection: "column",
    }}>
      <Badge text="O Problema" color={COLORS.red} />

      <h2 style={{
        fontSize: 44, fontWeight: 700, color: COLORS.white,
        textAlign: "center", margin: "40px 0 20px", lineHeight: 1.2,
      }}>
        Apostar no feeling{"\n"}
        <span style={{ color: COLORS.red }}>custa caro</span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 30 }}>
        {[
          { icon: "X", text: "Combinacoes contraditorias que nunca podem ganhar", color: COLORS.red },
          { icon: "X", text: "Sem nocao de risco real — aposta cega", color: COLORS.red },
          { icon: "X", text: "Odds escolhidas no achismo, sem base matematica", color: COLORS.red },
          { icon: "X", text: "Bankroll mal distribuido entre as apostas", color: COLORS.red },
        ].map((item, i) => (
          <GlassCard key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: "rgba(248,113,113,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: item.color,
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 28, fontWeight: 500, color: COLORS.white, lineHeight: 1.3 }}>
                {item.text}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      <p style={{
        fontSize: 26, color: COLORS.whiteDim, textAlign: "center",
        marginTop: 30, fontFamily: "monospace", lineHeight: 1.5,
      }}>
        90% dos apostadores perdem dinheiro{"\n"}por falta de metodo.
      </p>

      <SwipeIndicator />
    </div>
  </AbsoluteFill>
);

// =============================================
// SLIDE 3 — SOLUCAO (Como Funciona)
// =============================================

export const Slide3Solution: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: COLORS.bg,
    background: `radial-gradient(ellipse at 50% 40%, rgba(45,212,191,0.08) 0%, ${COLORS.bg} 70%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }}>
    <GrainyOverlay opacity={0.04} />
    <div style={{
      position: "absolute", top: PADDING, left: PADDING, right: PADDING, bottom: PADDING,
      display: "flex", flexDirection: "column",
    }}>
      <Badge text="Como Funciona" color={COLORS.teal} />

      <h2 style={{
        fontSize: 42, fontWeight: 700, color: COLORS.white,
        textAlign: "center", margin: "30px 0 20px", lineHeight: 1.2,
      }}>
        3 passos para apostas{"\n"}
        <span style={{ color: COLORS.teal }}>inteligentes</span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 20 }}>
        {[
          { step: "01", title: "Escolha o Jogo", desc: "Selecione entre 1.200+ jogos com odds reais de 38 ligas mundiais", color: COLORS.gold },
          { step: "02", title: "Configure seu Perfil", desc: "De Conservador a Extremo — o motor adapta a estrategia ao seu apetite por risco", color: COLORS.teal },
          { step: "03", title: "Gere suas Apostas", desc: "O motor analisa o cenario, combina mercados e entrega apostas validadas", color: COLORS.blue },
        ].map((item, i) => (
          <GlassCard key={i} highlight={i === 2}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
              <div style={{
                fontSize: 36, fontWeight: 900, color: item.color,
                fontFamily: "monospace", flexShrink: 0, minWidth: 60,
              }}>
                {item.step}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: COLORS.white }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 24, fontWeight: 400, color: COLORS.whiteDim, lineHeight: 1.4 }}>
                  {item.desc}
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <SwipeIndicator />
    </div>
  </AbsoluteFill>
);

// =============================================
// SLIDE 4 — DIFERENCIAIS (Features)
// =============================================

export const Slide4Features: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: COLORS.bg,
    background: `radial-gradient(ellipse at 30% 50%, rgba(228,186,96,0.06) 0%, ${COLORS.bg} 60%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }}>
    <GrainyOverlay opacity={0.04} />
    <div style={{
      position: "absolute", top: PADDING, left: PADDING, right: PADDING, bottom: PADDING,
      display: "flex", flexDirection: "column",
    }}>
      <Badge text="Diferenciais" color={COLORS.gold} />

      <h2 style={{
        fontSize: 40, fontWeight: 700, color: COLORS.white,
        textAlign: "center", margin: "30px 0 24px", lineHeight: 1.2,
      }}>
        Por que o SniperOdd{"\n"}
        <span style={{ color: COLORS.gold }}>e diferente?</span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {[
          { emoji: "\u{1F9E0}", title: "Engine de Coerencia", desc: "Bloqueia combinacoes contraditorias antes de gerar", color: COLORS.teal },
          { emoji: "\u{1F3AF}", title: "Quality Score", desc: "Cada aposta recebe nota de 0-100 baseada em coerencia, risco e mercado", color: COLORS.gold },
          { emoji: "\u{1F4CA}", title: "Analise de Exposicao", desc: "Visualize quanto da sua banca esta exposta e em que cenarios", color: COLORS.blue },
          { emoji: "\u{1F6E1}", title: "Anti-Erro Matematico", desc: "Validacao por constraints — impossibilidades sao eliminadas", color: COLORS.green },
          { emoji: "\u26A1", title: "Odds em Tempo Real", desc: "Dados de bookmakers reais via API, atualizados a cada 10 minutos", color: COLORS.purple },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 18,
            padding: "16px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            borderLeft: `3px solid ${item.color}`,
          }}>
            <span style={{ fontSize: 36, flexShrink: 0 }}>{item.emoji}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: COLORS.white }}>
                {item.title}
              </span>
              <span style={{ fontSize: 21, color: COLORS.whiteDim, lineHeight: 1.3 }}>
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      <SwipeIndicator />
    </div>
  </AbsoluteFill>
);

// =============================================
// SLIDE 5 — PERFIS DE RISCO
// =============================================

export const Slide5Profiles: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: COLORS.bg,
    background: `radial-gradient(ellipse at 70% 40%, rgba(167,139,250,0.06) 0%, ${COLORS.bg} 70%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }}>
    <GrainyOverlay opacity={0.04} />
    <div style={{
      position: "absolute", top: PADDING, left: PADDING, right: PADDING, bottom: PADDING,
      display: "flex", flexDirection: "column",
    }}>
      <Badge text="Perfis de Risco" color={COLORS.purple} />

      <h2 style={{
        fontSize: 40, fontWeight: 700, color: COLORS.white,
        textAlign: "center", margin: "30px 0 24px", lineHeight: 1.2,
      }}>
        Do conservador ao{"\n"}
        <span style={{ color: COLORS.purple }}>extremo</span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { name: "Conservador", odds: "1.5x - 2.5x", bar: 15, color: COLORS.green },
          { name: "Moderado", odds: "2x - 4x", bar: 30, color: COLORS.teal },
          { name: "Agressivo", odds: "4x - 10x", bar: 50, color: COLORS.gold },
          { name: "Muito Agressivo", odds: "10x - 20x", bar: 65, color: "#f59e0b" },
          { name: "Ultra Agressivo", odds: "20x - 40x", bar: 80, color: COLORS.red },
          { name: "Extremo", odds: "80x - 200x", bar: 100, color: COLORS.purple },
        ].map((p, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", gap: 6,
            padding: "14px 20px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.white }}>
                {p.name}
              </span>
              <span style={{
                fontSize: 20, fontWeight: 600, color: p.color, fontFamily: "monospace",
              }}>
                {p.odds}
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${p.bar}%`, borderRadius: 4,
                background: `linear-gradient(90deg, ${p.color}80, ${p.color})`,
              }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{
        fontSize: 22, color: COLORS.whiteDim, textAlign: "center",
        marginTop: 20, fontFamily: "monospace",
      }}>
        O motor ajusta mercados, selecoes e stakes{"\n"}automaticamente para cada perfil.
      </p>

      <SwipeIndicator />
    </div>
  </AbsoluteFill>
);

// =============================================
// SLIDE 6 — CTA
// =============================================

export const Slide6CTA: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: COLORS.bg,
    background: `radial-gradient(ellipse at 50% 50%, rgba(228,186,96,0.1) 0%, ${COLORS.bg} 60%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }}>
    <GrainyOverlay opacity={0.05} />
    <div style={{
      position: "absolute", top: PADDING, left: PADDING, right: PADDING, bottom: PADDING,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <Badge text="Comece Agora" />

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 30,
      }}>
        <CrosshairIcon size={140} color={COLORS.gold} />

        <h2 style={{
          fontSize: 52, fontWeight: 800, color: COLORS.white,
          textAlign: "center", lineHeight: 1.15, margin: 0,
        }}>
          Pare de apostar{"\n"}no escuro.
        </h2>

        <p style={{
          fontSize: 30, fontWeight: 500, color: COLORS.whiteDim,
          textAlign: "center", lineHeight: 1.4, margin: 0,
        }}>
          Deixe a <span style={{ color: COLORS.teal, fontWeight: 700 }}>matematica</span>{" "}
          trabalhar por voce.
        </p>

        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDim})`,
          padding: "24px 52px", borderRadius: 60, marginTop: 10,
        }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: COLORS.bg }}>
            Acesse o SniperOdd
          </span>
          <ArrowIcon color={COLORS.bg} size={30} />
        </div>

        <div style={{ display: "flex", gap: 30, marginTop: 20 }}>
          {[
            { value: "6", label: "Perfis" },
            { value: "38+", label: "Ligas" },
            { value: "100%", label: "Gratuito" },
          ].map((stat) => (
            <div key={stat.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.gold }}>{stat.value}</span>
              <span style={{ fontSize: 18, color: COLORS.whiteDim }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{
        fontSize: 22, color: COLORS.whiteDim, textAlign: "center", fontFamily: "monospace",
      }}>
        sniperodd.vercel.app
      </p>
    </div>
  </AbsoluteFill>
);
