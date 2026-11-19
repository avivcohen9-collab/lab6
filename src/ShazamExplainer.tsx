import { Series, useVideoConfig } from "remotion";
import { SCENE1_DURATION, Scene1Hook } from "./scenes/Scene1Hook";
import { SCENE2_DURATION, Scene2Problem } from "./scenes/Scene2Problem";

export const SCENES_TOTAL_SECONDS = SCENE1_DURATION + SCENE2_DURATION;

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
    </Series>
  );
};
