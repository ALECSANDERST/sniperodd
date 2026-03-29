import React from "react";
import { AbsoluteFill } from "remotion";
import {
  Crosshair,
  X,
  Footprints,
  SlidersHorizontal,
  Zap,
  Brain,
  Target,
  BarChart3,
  ShieldCheck,
  Activity,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// =============================================
// DESIGN SYSTEM - SniperOdd Brand (Refined)
// =============================================

const COLORS = {
  bg: "#080c18",
  bgCard: "#0f1525",
  bgCardHover: "#141c30",
  gold: "#e4ba60",
  goldDim: "#c9a24e",
  goldGlow: "rgba(228,186,96,0.25)",
  teal: "#2dd4bf",
  tealDim: "#14b8a6",
  tealGlow: "rgba(45,212,191,0.2)",
  white: "#f0ebe3",
  whiteDim: "#a8a196",
  whiteMuted: "#6b6560",
  red: "#f87171",
  redDim: "#ef4444",
  green: "#34d399",
  blue: "#60a5fa",
  purple: "#a78bfa",
  amber: "#f59e0b",
};

const PADDING = 72;
const CARD_RADIUS = 24;
const BADGE_RADIUS = 50;

// =============================================
// COMPONENTES COMPARTILHADOS (Refined)
// =============================================

const GrainyOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.035 }) => {
  const noiseFilter = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <filter id="noise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="1"/>
    </svg>
  `;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(noiseFilter)}")`,
        backgroundRepeat: "repeat",
        opacity,
        mixBlendMode: "overlay" as const,
        pointerEvents: "none" as const,
      }}
    />
  );
};

const Badge: React.FC<{ text: string; color?: string; icon?: React.ReactNode }> = ({
  text,
  color = COLORS.gold,
  icon,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      padding: "12px 28px",
      borderRadius: BADGE_RADIUS,
      border: `1.5px solid ${color}40`,
      background: `${color}10`,
      color,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: 2.5,
      textTransform: "uppercase" as const,
    }}
  >
    {icon}
    {text}
  </div>
);

const GlassCard: React.FC<{
  children: React.ReactNode;
  highlight?: boolean;
  accentColor?: string;
}> = ({ children, highlight, accentColor }) => (
  <div
    style={{
      background: highlight
        ? `linear-gradient(135deg, ${COLORS.gold}18, ${COLORS.teal}10)`
        : "rgba(255,255,255,0.035)",
      border: `1px solid ${highlight ? `${COLORS.gold}35` : "rgba(255,255,255,0.07)"}`,
      borderRadius: CARD_RADIUS,
      padding: "28px 32px",
      borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
      backdropFilter: "blur(12px)",
    }}
  >
    {children}
  </div>
);

const SwipeIndicator: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: "auto",
      paddingTop: 20,
    }}
  >
    <span
      style={{
        fontSize: 20,
        color: COLORS.whiteMuted,
        fontWeight: 500,
        letterSpacing: 0.5,
      }}
    >
      Arraste para continuar
    </span>
    <ChevronRight size={20} color={COLORS.gold} strokeWidth={2.5} />
  </div>
);

const SlideContainer: React.FC<{
  children: React.ReactNode;
  gradient: string;
}> = ({ children, gradient }) => (
  <AbsoluteFill
    style={{
      backgroundColor: COLORS.bg,
      background: `${gradient}, ${COLORS.bg}`,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}
  >
    <GrainyOverlay />
    <div
      style={{
        position: "absolute",
        top: PADDING,
        left: PADDING,
        right: PADDING,
        bottom: PADDING,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const SectionTitle: React.FC<{
  children: React.ReactNode;
  size?: number;
  align?: "center" | "left";
  marginTop?: number;
  marginBottom?: number;
}> = ({ children, size = 48, align = "center", marginTop = 36, marginBottom = 8 }) => (
  <h2
    style={{
      fontSize: size,
      fontWeight: 800,
      color: COLORS.white,
      textAlign: align,
      margin: `${marginTop}px 0 ${marginBottom}px`,
      lineHeight: 1.15,
      letterSpacing: -0.5,
    }}
  >
    {children}
  </h2>
);

const IconCircle: React.FC<{
  color: string;
  children: React.ReactNode;
  size?: number;
}> = ({ color, children, size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `${color}18`,
      border: `1.5px solid ${color}30`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

// =============================================
// SLIDE 1 — HOOK (Capa)
// =============================================

export const Slide1Hook: React.FC = () => (
  <SlideContainer gradient="radial-gradient(ellipse at 50% 30%, rgba(228,186,96,0.1) 0%, transparent 70%)">
    <Badge text="Inteligencia Artificial" icon={<Sparkles size={18} />} />

    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      {/* Crosshair icon with glow */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.goldGlow} 0%, transparent 70%)`,
          }}
        />
        <Crosshair size={140} color={COLORS.gold} strokeWidth={1.2} />
      </div>

      <h1
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: -2,
        }}
      >
        <span style={{ color: COLORS.gold }}>Sniper</span>Odd
      </h1>

      <p
        style={{
          fontSize: 38,
          fontWeight: 500,
          color: COLORS.whiteDim,
          textAlign: "center",
          lineHeight: 1.45,
          margin: 0,
          maxWidth: 780,
        }}
      >
        O motor inteligente que gera apostas{"\n"}
        <span style={{ color: COLORS.teal, fontWeight: 700 }}>
          matematicamente coerentes
        </span>
      </p>

      <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
        {["IA", "Odds Reais", "Anti-Erro"].map((tag) => (
          <span
            key={tag}
            style={{
              padding: "10px 24px",
              borderRadius: 30,
              background: `${COLORS.gold}14`,
              border: `1px solid ${COLORS.gold}28`,
              color: COLORS.gold,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>

    <SwipeIndicator />
  </SlideContainer>
);

// =============================================
// SLIDE 2 — PROBLEMA
// =============================================

export const Slide2Problem: React.FC = () => (
  <SlideContainer gradient="radial-gradient(ellipse at 50% 70%, rgba(248,113,113,0.08) 0%, transparent 70%)">
    <Badge text="O Problema" color={COLORS.red} icon={<X size={18} />} />

    <SectionTitle marginTop={44} marginBottom={12}>
      Apostar no feeling{"\n"}
      <span style={{ color: COLORS.red }}>custa caro</span>
    </SectionTitle>

    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 28 }}>
      {[
        "Combinações contraditórias que nunca podem ganhar",
        "Sem noção de risco real — aposta cega",
        "Odds escolhidas no achismo, sem base matemática",
        "Bankroll mal distribuído entre as apostas",
      ].map((text, i) => (
        <GlassCard key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <IconCircle color={COLORS.red} size={46}>
              <X size={22} color={COLORS.red} strokeWidth={3} />
            </IconCircle>
            <span
              style={{
                fontSize: 29,
                fontWeight: 500,
                color: COLORS.white,
                lineHeight: 1.35,
              }}
            >
              {text}
            </span>
          </div>
        </GlassCard>
      ))}
    </div>

    <p
      style={{
        fontSize: 26,
        color: COLORS.whiteDim,
        textAlign: "center",
        marginTop: 32,
        lineHeight: 1.5,
        fontWeight: 500,
      }}
    >
      <span style={{ color: COLORS.red, fontWeight: 700 }}>90%</span> dos apostadores
      perdem dinheiro{"\n"}por falta de método.
    </p>

    <SwipeIndicator />
  </SlideContainer>
);

// =============================================
// SLIDE 3 — SOLUCAO (Como Funciona)
// =============================================

const stepIcons = [Footprints, SlidersHorizontal, Zap];

export const Slide3Solution: React.FC = () => (
  <SlideContainer gradient="radial-gradient(ellipse at 50% 40%, rgba(45,212,191,0.1) 0%, transparent 70%)">
    <Badge text="Como Funciona" color={COLORS.teal} icon={<Zap size={18} />} />

    <SectionTitle marginTop={36} marginBottom={12}>
      3 passos para apostas{"\n"}
      <span style={{ color: COLORS.teal }}>inteligentes</span>
    </SectionTitle>

    <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 24 }}>
      {[
        {
          step: "01",
          title: "Escolha o Jogo",
          desc: "Selecione entre 1.200+ jogos com odds reais de 38 ligas mundiais",
          color: COLORS.gold,
        },
        {
          step: "02",
          title: "Configure seu Perfil",
          desc: "De Conservador a Extremo — o motor adapta a estratégia ao seu apetite por risco",
          color: COLORS.teal,
        },
        {
          step: "03",
          title: "Gere suas Apostas",
          desc: "O motor analisa o cenário, combina mercados e entrega apostas validadas",
          color: COLORS.blue,
        },
      ].map((item, i) => {
        const Icon = stepIcons[i];
        return (
          <GlassCard key={i} highlight={i === 2}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 22 }}>
              <IconCircle color={item.color} size={54}>
                <Icon size={26} color={item.color} strokeWidth={2} />
              </IconCircle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: item.color,
                      fontFamily: "monospace",
                      opacity: 0.6,
                    }}
                  >
                    PASSO {item.step}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: COLORS.white,
                    lineHeight: 1.2,
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 25,
                    fontWeight: 400,
                    color: COLORS.whiteDim,
                    lineHeight: 1.45,
                  }}
                >
                  {item.desc}
                </span>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>

    <SwipeIndicator />
  </SlideContainer>
);

// =============================================
// SLIDE 4 — DIFERENCIAIS (Features)
// =============================================

const featureIcons = [Brain, Target, BarChart3, ShieldCheck, Activity];

export const Slide4Features: React.FC = () => (
  <SlideContainer gradient="radial-gradient(ellipse at 30% 50%, rgba(228,186,96,0.08) 0%, transparent 60%)">
    <Badge text="Diferenciais" color={COLORS.gold} icon={<Target size={18} />} />

    <SectionTitle marginTop={32} marginBottom={20}>
      Por que o SniperOdd{"\n"}
      <span style={{ color: COLORS.gold }}>é diferente?</span>
    </SectionTitle>

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[
        {
          title: "Engine de Coerência",
          desc: "Bloqueia combinações contraditórias antes de gerar",
          color: COLORS.teal,
        },
        {
          title: "Quality Score",
          desc: "Cada aposta recebe nota de 0-100 baseada em coerência, risco e mercado",
          color: COLORS.gold,
        },
        {
          title: "Análise de Exposição",
          desc: "Visualize quanto da sua banca está exposta e em que cenários",
          color: COLORS.blue,
        },
        {
          title: "Anti-Erro Matemático",
          desc: "Validação por constraints — impossibilidades são eliminadas",
          color: COLORS.green,
        },
        {
          title: "Odds em Tempo Real",
          desc: "Dados de bookmakers reais via API, atualizados a cada 10 minutos",
          color: COLORS.purple,
        },
      ].map((item, i) => {
        const Icon = featureIcons[i];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "20px 24px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.03)",
              borderLeft: `3px solid ${item.color}`,
            }}
          >
            <IconCircle color={item.color} size={50}>
              <Icon size={24} color={item.color} strokeWidth={2} />
            </IconCircle>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: COLORS.white,
                }}
              >
                {item.title}
              </span>
              <span
                style={{
                  fontSize: 22,
                  color: COLORS.whiteDim,
                  lineHeight: 1.35,
                }}
              >
                {item.desc}
              </span>
            </div>
          </div>
        );
      })}
    </div>

    <SwipeIndicator />
  </SlideContainer>
);

// =============================================
// SLIDE 5 — PERFIS DE RISCO
// =============================================

export const Slide5Profiles: React.FC = () => (
  <SlideContainer gradient="radial-gradient(ellipse at 70% 40%, rgba(167,139,250,0.08) 0%, transparent 70%)">
    <Badge text="Perfis de Risco" color={COLORS.purple} icon={<SlidersHorizontal size={18} />} />

    <SectionTitle marginTop={32} marginBottom={20}>
      Do conservador ao{"\n"}
      <span style={{ color: COLORS.purple }}>extremo</span>
    </SectionTitle>

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[
        { name: "Conservador", odds: "1.5x – 2.5x", bar: 15, color: COLORS.green },
        { name: "Moderado", odds: "2x – 4x", bar: 30, color: COLORS.teal },
        { name: "Agressivo", odds: "4x – 10x", bar: 50, color: COLORS.gold },
        { name: "Muito Agressivo", odds: "10x – 20x", bar: 65, color: COLORS.amber },
        { name: "Ultra Agressivo", odds: "20x – 40x", bar: 80, color: COLORS.red },
        { name: "Extremo", odds: "80x – 200x", bar: 100, color: COLORS.purple },
      ].map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "16px 22px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${p.color}12`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: COLORS.white }}>
              {p.name}
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: p.color,
                fontFamily: "monospace",
                letterSpacing: 0.5,
              }}
            >
              {p.odds}
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${p.bar}%`,
                borderRadius: 5,
                background: `linear-gradient(90deg, ${p.color}60, ${p.color})`,
                boxShadow: `0 0 12px ${p.color}40`,
              }}
            />
          </div>
        </div>
      ))}
    </div>

    <p
      style={{
        fontSize: 23,
        color: COLORS.whiteDim,
        textAlign: "center",
        marginTop: 22,
        lineHeight: 1.5,
        fontWeight: 500,
      }}
    >
      O motor ajusta mercados, seleções e stakes{"\n"}automaticamente para cada perfil.
    </p>

    <SwipeIndicator />
  </SlideContainer>
);

// =============================================
// SLIDE 6 — CTA
// =============================================

export const Slide6CTA: React.FC = () => (
  <SlideContainer gradient="radial-gradient(ellipse at 50% 50%, rgba(228,186,96,0.12) 0%, transparent 60%)">
    <Badge text="Comece Agora" icon={<Sparkles size={18} />} />

    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      {/* Crosshair with double glow */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.goldGlow} 0%, transparent 70%)`,
          }}
        />
        <Crosshair size={120} color={COLORS.gold} strokeWidth={1.2} />
      </div>

      <h2
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.12,
          margin: 0,
          letterSpacing: -1,
        }}
      >
        Pare de apostar{"\n"}no escuro.
      </h2>

      <p
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: COLORS.whiteDim,
          textAlign: "center",
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        Deixe a{" "}
        <span style={{ color: COLORS.teal, fontWeight: 700 }}>matemática</span>{" "}
        trabalhar por você.
      </p>

      {/* CTA Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDim})`,
          padding: "26px 56px",
          borderRadius: 60,
          marginTop: 8,
          boxShadow: `0 8px 32px ${COLORS.goldGlow}, 0 2px 8px rgba(0,0,0,0.3)`,
        }}
      >
        <span style={{ fontSize: 36, fontWeight: 700, color: COLORS.bg }}>
          Acesse o SniperOdd
        </span>
        <ArrowRight size={30} color={COLORS.bg} strokeWidth={2.5} />
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 40, marginTop: 24 }}>
        {[
          { value: "6", label: "Perfis" },
          { value: "38+", label: "Ligas" },
          { value: "100%", label: "Gratuito" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: COLORS.gold,
                letterSpacing: -1,
              }}
            >
              {stat.value}
            </span>
            <span style={{ fontSize: 20, color: COLORS.whiteDim, fontWeight: 500 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>

    <p
      style={{
        fontSize: 22,
        color: COLORS.whiteMuted,
        textAlign: "center",
        fontFamily: "monospace",
        letterSpacing: 1,
      }}
    >
      sniperodd.vercel.app
    </p>
  </SlideContainer>
);
