import { Composition, Folder } from "remotion";
import { MyComposition } from "./Composition";
import { SCENES_TOTAL_SECONDS, ShazamExplainer } from "./ShazamExplainer";
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
import { SCENE6_DURATION, Scene6Lookup } from "./scenes/Scene6Lookup";
import { SCENE7_DURATION, Scene7Alignment } from "./scenes/Scene7Alignment";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShazamExplainer"
        component={ShazamExplainer}
        durationInFrames={Math.round(SCENES_TOTAL_SECONDS * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="Scenes">
        <Composition
          id="Scene1Hook"
          component={Scene1Hook}
          durationInFrames={Math.round(SCENE1_DURATION * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene2Problem"
          component={Scene2Problem}
          durationInFrames={Math.round(SCENE2_DURATION * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene3Spectrogram"
          component={Scene3Spectrogram}
          durationInFrames={Math.round(SCENE3_DURATION * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene4Constellation"
          component={Scene4Constellation}
          durationInFrames={Math.round(SCENE4_DURATION * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene6Lookup"
          component={Scene6Lookup}
          durationInFrames={Math.round(SCENE6_DURATION * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene7Alignment"
          component={Scene7Alignment}
          durationInFrames={Math.round(SCENE7_DURATION * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      <Folder name="Setup">
        <MyComposition />
      </Folder>
    </>
  );
};
