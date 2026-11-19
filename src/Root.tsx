import { Composition, Folder } from "remotion";
import { MyComposition } from "./Composition";
import { SCENES_TOTAL_SECONDS, ShazamExplainer } from "./ShazamExplainer";
import { SCENE1_DURATION, Scene1Hook } from "./scenes/Scene1Hook";
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
      </Folder>
      <Folder name="Setup">
        <MyComposition />
      </Folder>
    </>
  );
};
