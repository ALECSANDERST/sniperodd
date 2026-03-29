import React from "react";
import { Composition } from "remotion";
import {
  Slide1Hook,
  Slide2Problem,
  Slide3Solution,
  Slide4Features,
  Slide5Profiles,
  Slide6CTA,
} from "./compositions/SniperOddCarousel";

export const RemotionRoot: React.FC = () => (
  <>
    {/* Carrossel Instagram — 1080x1350 (4:5 Portrait) */}
    <Composition id="SniperOdd-Slide1" component={Slide1Hook}
      durationInFrames={1} fps={1} width={1080} height={1350} />
    <Composition id="SniperOdd-Slide2" component={Slide2Problem}
      durationInFrames={1} fps={1} width={1080} height={1350} />
    <Composition id="SniperOdd-Slide3" component={Slide3Solution}
      durationInFrames={1} fps={1} width={1080} height={1350} />
    <Composition id="SniperOdd-Slide4" component={Slide4Features}
      durationInFrames={1} fps={1} width={1080} height={1350} />
    <Composition id="SniperOdd-Slide5" component={Slide5Profiles}
      durationInFrames={1} fps={1} width={1080} height={1350} />
    <Composition id="SniperOdd-Slide6" component={Slide6CTA}
      durationInFrames={1} fps={1} width={1080} height={1350} />
  </>
);
