import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BACKGROUND, COLORS, FONT } from "../theme";

export const SCENE8_DURATION = 18.3; // seconds (narration is 17.39s)

// Sentence cues (seconds), from silence detection on public/narration/scene8.wav
const T = {
  trick: 0.2, // "And that's the whole trick."
  found: 13.1, // "All in about three seconds,"
  chorus: 15.3, // "often before the chorus even starts."
};

// Recap steps, lit as the narration names them
const STEPS = [
  { label: "Sound", at: 1.7 },
  { label: "Spectrogram", at: 2.7 },
  { label: "Stars", at: 5.4 },
  { label: "Fingerprints", at: 8.0 },
  { label: "Match ✓", at: 11.2 },
];

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Scene 7's title hands over to the recap title
  const out = interpolate(frame, [0.1 * fps, 0.4 * fps], [0, 1], clamp);
  const enter = spring({ frame: frame - 0.35 * fps, fps, config: { damping: 200 } });
  const base: React.CSSProperties = {
    position: "absolute",
    top: 60,
    width: "100%",
    textAlign: "center",
    fontFamily: FONT,
    fontSize: 76,
    color: COLORS.textDim,
  };
  return (
    <>
      <div style={{ ...base, opacity: 1 - out }}>
        Step 5: <span style={{ color: COLORS.accentLight }}>Line up in time</span>
      </div>
      <div
        style={{
          ...base,
          opacity: enter,
          translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
        }}
      >
        The whole <span style={{ color: COLORS.accentLight }}>trick</span>
      </div>
    </>
  );
};

const Step: React.FC<{ label: string; at: number; last: boolean }> = ({
  label,
  at,
  last,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lit = spring({ frame: frame - at * fps, fps, config: { damping: 14 } });
  const color = last ? COLORS.success : COLORS.accentLight;
  return (
    <div
      style={{
        padding: "22px 30px",
        borderRadius: 22,
        background: COLORS.card,
        border: `3px solid ${lit > 0.5 ? color : "#1C2B52"}`,
        boxShadow: `0 0 ${30 * lit}px ${color}`,
        fontFamily: FONT,
        fontSize: 40,
        color: lit > 0.5 ? COLORS.text : COLORS.textDim,
        opacity: interpolate(lit, [0, 1], [0.35, 1]),
        scale: String(interpolate(lit, [0, 1], [0.92, 1])),
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

const RecapStrip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.trick * fps, fps, config: { damping: 200 } });
  // Moves up to make room for the song card
  const lift = spring({ frame: frame - T.found * fps, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: interpolate(lift, [0, 1], [470, 250]),
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        opacity: enter,
      }}
    >
      {STEPS.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Step label={s.label} at={s.at} last={i === STEPS.length - 1} />
          {i < STEPS.length - 1 ? (
            <div style={{ fontFamily: FONT, fontSize: 44, color: COLORS.textDim }}>→</div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

// Same "song found" card as Scene 1, bigger
const SongCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.found * fps, fps, config: { damping: 14 } });
  if (frame < T.found * fps) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 470,
        marginLeft: -370,
        width: 740,
        padding: "30px 34px",
        borderRadius: 32,
        background: COLORS.card,
        border: `3px solid ${COLORS.accent}`,
        boxShadow: `0 0 60px ${COLORS.accent}`,
        display: "flex",
        alignItems: "center",
        gap: 28,
        fontFamily: FONT,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [80, 0])}px`,
        scale: String(interpolate(enter, [0, 1], [0.85, 1])),
      }}
    >
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: 24,
          background: "linear-gradient(135deg, #FF7A59, #B03BFF)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "10px solid rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: COLORS.success, fontSize: 32 }}>✓ Song found</div>
        <div style={{ color: COLORS.text, fontSize: 52, whiteSpace: "nowrap" }}>
          Midnight Drive
        </div>
        <div style={{ color: COLORS.textDim, fontSize: 34 }}>The Lumens</div>
      </div>
      <div style={{ color: COLORS.success, fontSize: 44, alignSelf: "flex-start" }}>
        3.0s
      </div>
    </div>
  );
};

const Chorus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.chorus * fps, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 800,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 54,
        color: COLORS.text,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [30, 0])}px`,
      }}
    >
      …before the <span style={{ color: COLORS.accentLight }}>chorus</span> even
      starts.
    </div>
  );
};

export const Scene8Outro: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene8.wav")} />
      <Title />
      <RecapStrip />
      <SongCard />
      <Chorus />
    </AbsoluteFill>
  );
};
