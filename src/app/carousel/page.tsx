"use client";

import React, { useRef, useState } from "react";
import { Player } from "@remotion/player";
import {
  Slide1Hook,
  Slide2Problem,
  Slide3Solution,
  Slide4Features,
  Slide5Profiles,
  Slide6CTA,
} from "../../../remotion/compositions/SniperOddCarousel";

const slides = [
  { id: 1, title: "Capa (Hook)", component: Slide1Hook },
  { id: 2, title: "O Problema", component: Slide2Problem },
  { id: 3, title: "Como Funciona", component: Slide3Solution },
  { id: 4, title: "Diferenciais", component: Slide4Features },
  { id: 5, title: "Perfis de Risco", component: Slide5Profiles },
  { id: 6, title: "CTA", component: Slide6CTA },
];

export default function CarouselPreview() {
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050810",
        color: "#eee9df",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            <span style={{ color: "#e4ba60" }}>Sniper</span>Odd — Carrossel
            Instagram
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#b8b0a4",
              margin: "4px 0 0",
            }}
          >
            6 slides | 1080x1350px | Formato 4:5 Portrait
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#b8b0a4",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Voltar ao App
          </a>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 32,
          padding: 32,
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* Slide Navigation */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 180,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#b8b0a4",
              textTransform: "uppercase",
              letterSpacing: 1,
              margin: "0 0 8px",
            }}
          >
            Slides
          </p>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(i)}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border:
                  activeSlide === i
                    ? "1px solid rgba(228,186,96,0.4)"
                    : "1px solid rgba(255,255,255,0.06)",
                background:
                  activeSlide === i
                    ? "rgba(228,186,96,0.1)"
                    : "rgba(255,255,255,0.03)",
                color: activeSlide === i ? "#e4ba60" : "#b8b0a4",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 14,
                fontWeight: activeSlide === i ? 600 : 400,
                transition: "all 0.2s",
              }}
            >
              <span style={{ opacity: 0.5, marginRight: 8 }}>
                {String(slide.id).padStart(2, "0")}
              </span>
              {slide.title}
            </button>
          ))}

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#b8b0a4",
                margin: "0 0 8px",
              }}
            >
              Exportar
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#b8b0a480",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Use o Remotion CLI para exportar:
              <br />
              <code
                style={{
                  background: "rgba(255,255,255,0.06)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                }}
              >
                npm run remotion:render
              </code>
            </p>
          </div>
        </div>

        {/* Slide Preview */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
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

          {/* Slide dots */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                style={{
                  width: activeSlide === i ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: "none",
                  background:
                    activeSlide === i ? "#e4ba60" : "rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>

          {/* Keyboard nav hint */}
          <p
            style={{
              fontSize: 12,
              color: "#b8b0a460",
              margin: 0,
            }}
          >
            Slide {activeSlide + 1} de {slides.length}
          </p>
        </div>
      </div>
    </div>
  );
}
