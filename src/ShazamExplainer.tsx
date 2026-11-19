import { Series, useVideoConfig } from "remotion";
import { SCENE1_DURATION, Scene1Hook } from "./scenes/Scene1Hook";

export const SCENES_TOTAL_SECONDS = SCENE1_DURATION;

export const ShazamExplainer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence durationInFrames={Math.round(SCENE1_DURATION * fps)}>
        <Scene1Hook />
      </Series.Sequence>
    </Series>
  );
};
