"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Player } from "@remotion/player";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
} from "lucide-react";
import {
  Slide1Hook,
  Slide2Problem,
  Slide3Solution,
  Slide4Features,
  Slide5Profiles,
  Slide6CTA,
} from "../../../remotion/compositions/SniperOddCarousel";

const slides = [
  { id: 1, title: "Capa (Hook)", component: Slide1Hook, color: "#e4ba60" },
  { id: 2, title: "O Problema", component: Slide2Problem, color: "#f87171" },
  { id: 3, title: "Como Funciona", component: Slide3Solution, color: "#2dd4bf" },
  { id: 4, title: "Diferenciais", component: Slide4Features, color: "#e4ba60" },
  { id: 5, title: "Perfis de Risco", component: Slide5Profiles, color: "#a78bfa" },
  { id: 6, title: "CTA", component: Slide6CTA, color: "#e4ba60" },
];

export default function CarouselPreview() {
  const [activeSlide, setActiveSlide] = useState(0);

  const goNext = useCallback(() => {
    setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050810",
        color: "#f0ebe3",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(12px)",
          background: "rgba(5,8,16,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Layers size={20} color="#e4ba60" />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "#e4ba60" }}>Sniper</span>Odd — Carrossel Instagram
            </h1>
            <p style={{ fontSize: 13, color: "#a8a196", margin: "2px 0 0" }}>
              6 slides &middot; 1080&times;1350px &middot; Formato 4:5 Portrait
            </p>
          </div>
        </div>
        <a
          href="/"
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a8a196",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 0.2s",
          }}
        >
          Voltar ao App
        </a>
      </header>

      <div
        style={{
          display: "flex",
          gap: 32,
          padding: "32px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 200,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#6b6560",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontWeight: 600,
              margin: "0 0 8px 4px",
            }}
          >
            Slides
          </p>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(i)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border:
                  activeSlide === i
                    ? `1px solid ${slide.color}50`
                    : "1px solid transparent",
                background:
                  activeSlide === i
                    ? `${slide.color}12`
                    : "transparent",
                color: activeSlide === i ? slide.color : "#a8a196",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 14,
                fontWeight: activeSlide === i ? 600 : 400,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: activeSlide === i ? slide.color : "rgba(255,255,255,0.1)",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              />
              <span style={{ opacity: 0.4, fontFamily: "monospace", fontSize: 12 }}>
                {String(slide.id).padStart(2, "0")}
              </span>
              {slide.title}
            </button>
          ))}

          {/* Export hint */}
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Download size={14} color="#6b6560" />
              <p style={{ fontSize: 12, color: "#a8a196", margin: 0, fontWeight: 600 }}>
                Exportar PNGs
              </p>
            </div>
            <code
              style={{
                display: "block",
                background: "rgba(255,255,255,0.05)",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 11,
                color: "#e4ba60",
                fontFamily: "monospace",
              }}
            >
              npm run remotion:render
            </code>
          </div>
        </nav>

        {/* Slide Preview */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Player with nav arrows */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={goPrev}
              disabled={activeSlide === 0}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: activeSlide === 0 ? "#6b656030" : "#a8a196",
                cursor: activeSlide === 0 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${slides[activeSlide].color}10`,
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Player
                component={slides[activeSlide].component}
                durationInFrames={1}
                fps={1}
                compositionWidth={1080}
                compositionHeight={1350}
                style={{ width: 432, height: 540 }}
              />
            </div>

            <button
              onClick={goNext}
              disabled={activeSlide === slides.length - 1}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: activeSlide === slides.length - 1 ? "#6b656030" : "#a8a196",
                cursor: activeSlide === slides.length - 1 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dots */}
          <div style={{ display: "flex", gap: 8 }}>
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                style={{
                  width: activeSlide === i ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: "none",
                  background: activeSlide === i ? slide.color : "rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            ))}
          </div>

          {/* Counter + hint */}
          <p style={{ fontSize: 13, color: "#6b6560", margin: 0 }}>
            Slide {activeSlide + 1} de {slides.length}
            <span style={{ margin: "0 8px" }}>&middot;</span>
            <span style={{ fontSize: 11 }}>Use setas do teclado para navegar</span>
          </p>
        </div>
      </div>
    </div>
  );
}
