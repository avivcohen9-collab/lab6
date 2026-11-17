import {
  AbsoluteFill,
  Composition,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FPS = 30;
const DURATION_SECONDS = 5;

export const MyComposition = () => {
  return (
    <Composition
      id="TitleScene"
      component={TitleScene}
      durationInFrames={FPS * DURATION_SECONDS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const translateY = interpolate(enter, [0, 1], [40, 0]);
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const underline = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 40%, #1d3b8f 0%, #0a0f24 70%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          opacity: enter * fadeOut,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: 120,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -2,
          }}
        >
          How does Shazam work?
        </h1>
        <div
          style={{
            height: 10,
            width: 600 * underline,
            margin: "32px auto 0",
            borderRadius: 5,
            background: "#08f",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
