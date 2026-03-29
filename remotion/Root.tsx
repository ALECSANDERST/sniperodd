import React from "react";
import { Still } from "remotion";
import {
  Slide1Hook,
  Slide2Problem,
  Slide3Solution,
  Slide4Features,
  Slide5Profiles,
  Slide6CTA,
} from "./compositions/SniperOddCarousel";

const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1350;

const slides = [
  { id: "SniperOdd-Slide1", component: Slide1Hook },
  { id: "SniperOdd-Slide2", component: Slide2Problem },
  { id: "SniperOdd-Slide3", component: Slide3Solution },
  { id: "SniperOdd-Slide4", component: Slide4Features },
  { id: "SniperOdd-Slide5", component: Slide5Profiles },
  { id: "SniperOdd-Slide6", component: Slide6CTA },
];

export const RemotionRoot: React.FC = () => (
  <>
    {/* Carrossel Instagram — 1080x1350 (4:5 Portrait) */}
    {slides.map(({ id, component }) => (
      <Still
        key={id}
        id={id}
        component={component}
        width={INSTAGRAM_WIDTH}
        height={INSTAGRAM_HEIGHT}
      />
    ))}
  </>
);
