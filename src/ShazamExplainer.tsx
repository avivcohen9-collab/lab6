import { Series, useVideoConfig } from "remotion";
import { SCENE1_DURATION, Scene1Hook } from "./scenes/Scene1Hook";
import { SCENE2_DURATION, Scene2Problem } from "./scenes/Scene2Problem";
import {
  SCENE3_DURATION,
  Scene3Spectrogram,
} from "./scenes/Scene3Spectrogram";

import {
  SCENE4_DURATION,
  Scene4Constellation,
} from "./scenes/Scene4Constellation";
import { SCENE5_DURATION, Scene5Fingerprints } from "./scenes/Scene5Fingerprints";
import { SCENE6_DURATION, Scene6Lookup } from "./scenes/Scene6Lookup";
import { SCENE7_DURATION, Scene7Alignment } from "./scenes/Scene7Alignment";
import { SCENE8_DURATION, Scene8Outro } from "./scenes/Scene8Outro";

export const SCENES_TOTAL_SECONDS =
  SCENE8_DURATION +
  SCENE1_DURATION +
  SCENE2_DURATION +
  SCENE3_DURATION +
  SCENE4_DURATION +
  SCENE5_DURATION +
  SCENE6_DURATION +
  SCENE7_DURATION;

export const ShazamExplainer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence durationInFrames={Math.round(SCENE1_DURATION * fps)}>
        <Scene1Hook />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(SCENE2_DURATION * fps)}>
        <Scene2Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(SCENE3_DURATION * fps)}>
        <Scene3Spectrogram />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(SCENE4_DURATION * fps)}>
        <Scene4Constellation />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(SCENE5_DURATION * fps)}>
        <Scene5Fingerprints />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(SCENE6_DURATION * fps)}>
        <Scene6Lookup />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(SCENE7_DURATION * fps)}>
        <Scene7Alignment />
      </Series.Sequence>
    </Series>
  );
};
