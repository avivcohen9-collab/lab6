import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BACKGROUND, COLORS, FONT } from "../theme";

export const SCENE2_DURATION = 27; // seconds (narration is 25.5s; hold the question)

// Sentence cues (seconds), from silence detection on public/narration/scene2.wav
const T = {
  library: 1.25, // "Shazam has a library of millions of songs."
  recording: 4.5, // "Its job is to find the one your short recording came from."
  compare: 8.5, // "The obvious idea is to compare the raw sound wave..."
  tooSlow: 13.4, // "But that would be far too slow."
  partB: 15.7, // "And in a noisy café,"
  chatter: 17.4, // "chatter and clinking cups"
  shape: 18.9, // "change the shape of the sound wave,"
  overlay: 21.4, // "so it would never match..."
  noMatch: 22.7, // "...the original recording."
  clear: 23.6, // pause before the question
  question: 24.2, // "So how does it work?"
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------- Waveform helpers ----------

const POINTS = 220;

const cleanWave = (x: number, phase: number) =>
  0.55 * Math.sin(x * 9 + phase) +
  0.3 * Math.sin(x * 23 + phase * 1.7) +
  0.15 * Math.sin(x * 51 + phase * 0.6);

const wavePath = (
  width: number,
  height: number,
  phase: number,
  noise: number,
  seed: string,
) => {
  let d = "";
  for (let i = 0; i < POINTS; i++) {
    const x = i / (POINTS - 1);
    // Envelope so the wave tapers at both ends
    const env = Math.sin(Math.PI * x);
    const jitter = (random(`${seed}-${i}`) * 2 - 1) * noise;
    const y = (cleanWave(x, phase) * env + jitter) * (height / 2) * 0.9;
    d += `${i === 0 ? "M" : "L"}${(x * width).toFixed(1)},${(height / 2 - y).toFixed(1)} `;
  }
  return d;
};

const Waveform: React.FC<{
  width: number;
  height: number;
  noise: number;
  color: string;
  seed: string;
}> = ({ width, height, noise, color, seed }) => {
  const frame = useCurrentFrame();
  const phase = frame / 12;
  // Noise jitter re-rolls every 2 frames so it looks alive
  const noiseSeed = `${seed}-${Math.floor(frame / 2)}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <path
        d={wavePath(width, height, phase, noise, noiseSeed)}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ---------- Part A: comparing against millions of songs ----------

const GRID_COLS = 14;
const GRID_ROWS = 8;

const SongGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = interpolate(
    frame,
    [(T.partB - 0.4) * fps, T.partB * fps],
    [1, 0],
    clamp,
  );
  // The scanner checks one tile every 2 frames: painfully slow
  const scanned =
    frame < T.compare * fps
      ? -1
      : Math.floor((frame - T.compare * fps) / 2);

  return (
    <div
      style={{
        position: "absolute",
        right: 120,
        top: 250,
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLS}, 56px)`,
        gap: 10,
        opacity: fadeOut,
      }}
    >
      {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
        const appear = interpolate(
          frame,
          [T.library * fps + i * 0.25, T.library * fps + i * 0.25 + 6],
          [0, 1],
          clamp,
        );
        const isScanning = i === scanned;
        const isDone = scanned >= 0 && i < scanned;
        const bars = [0, 1, 2, 3, 4].map((b) =>
          Math.round(10 + random(`tile-${i}-${b}`) * 26),
        );
        return (
          <div
            key={i}
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: isScanning ? COLORS.accent : COLORS.card,
              border: `2px solid ${isScanning ? COLORS.accentLight : "#1C2B52"}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              opacity: appear * (isDone ? 0.35 : 1),
            }}
          >
            {bars.map((h, b) => (
              <div
                key={b}
                style={{
                  width: 5,
                  height: h,
                  borderRadius: 3,
                  background: isScanning ? COLORS.text : COLORS.textDim,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const PartALabels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const libraryIn = spring({
    frame: frame - T.library * fps,
    fps,
    config: { damping: 200 },
  });
  // The clip flies in from the center of the screen (where the phone was)
  const clipIn = spring({
    frame: frame - T.recording * fps,
    fps,
    config: { damping: 200 },
    durationInFrames: 0.9 * fps,
  });
  const question = spring({
    frame: frame - (T.recording + 0.7) * fps,
    fps,
    config: { damping: 10 },
  });
  const compareIn = interpolate(
    frame,
    [T.compare * fps, (T.compare + 0.4) * fps],
    [0, 1],
    clamp,
  );
  const fadeOut = interpolate(
    frame,
    [(T.partB - 0.4) * fps, T.partB * fps],
    [1, 0],
    clamp,
  );
  const slow = spring({
    frame: frame - T.tooSlow * fps,
    fps,
    config: { damping: 10 },
  });
  const checked = Math.max(0, Math.floor((frame - T.compare * fps) / 2));

  return (
    <div style={{ opacity: fadeOut, fontFamily: FONT }}>
      {/* Left: your clip */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 400,
          width: 560,
          opacity: clipIn,
          translate: `${interpolate(clipIn, [0, 1], [560, 0])}px 0px`,
          scale: String(interpolate(clipIn, [0, 1], [0.4, 1])),
        }}
      >
        <div style={{ color: COLORS.textDim, fontSize: 36, marginBottom: 20 }}>
          Your short recording
        </div>
        <Waveform
          width={560}
          height={180}
          noise={0}
          color={COLORS.accentLight}
          seed="clipA"
        />
      </div>
      {/* "Which one?" question mark, replaced by an arrow once comparing starts */}
      <div
        style={{
          position: "absolute",
          left: 715,
          top: 440,
          fontSize: 120,
          color: COLORS.accentLight,
          opacity: question * (1 - compareIn),
          scale: String(question),
        }}
      >
        ?
      </div>
      <div
        style={{
          position: "absolute",
          left: 720,
          top: 470,
          fontSize: 80,
          color: COLORS.textDim,
          opacity: compareIn,
        }}
      >
        →
      </div>
      {/* Grid caption */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 170,
          width: 920,
          textAlign: "center",
          color: COLORS.text,
          fontSize: 44,
          opacity: libraryIn,
        }}
      >
        Shazam&apos;s library: millions of songs
      </div>
      {/* Counter */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 880,
          width: 920,
          textAlign: "center",
          color: COLORS.textDim,
          fontSize: 34,
          opacity: compareIn,
        }}
      >
        compared {checked.toLocaleString("en-US")} of 50,000,000
      </div>
      {/* Too slow stamp */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 700,
          width: 560,
          textAlign: "center",
          color: COLORS.danger,
          fontSize: 72,
          opacity: frame >= T.tooSlow * fps ? 1 : 0,
          scale: String(interpolate(slow, [0, 1], [1.6, 1])),
          rotate: "-6deg",
        }}
      >
        FAR TOO SLOW
      </div>
    </div>
  );
};

// ---------- Part B: noise changes the wave ----------

const WAVE_W = 1100;
const WAVE_H = 200;

const OriginalWave: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.partB * fps,
    fps,
    config: { damping: 200 },
  });
  if (frame < T.partB * fps) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: (1920 - WAVE_W) / 2,
        top: 170,
        opacity: enter,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          color: COLORS.textDim,
          fontSize: 36,
          marginBottom: 10,
        }}
      >
        Original recording
      </div>
      <Waveform
        width={WAVE_W}
        height={WAVE_H}
        noise={0}
        color={COLORS.accentLight}
        seed="orig"
      />
    </div>
  );
};

const CafeWave: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - (T.partB + 0.3) * fps,
    fps,
    config: { damping: 200 },
  });
  // Noise grows as the café sounds pile in
  const noise = interpolate(
    frame,
    [T.chatter * fps, (T.shape + 1) * fps],
    [0, 0.45],
    clamp,
  );
  // Slide up on top of the original to compare
  const overlay = spring({
    frame: frame - T.overlay * fps,
    fps,
    config: { damping: 200 },
  });
  const color = frame >= T.noMatch * fps ? COLORS.danger : "#FFB547";
  if (frame < T.partB * fps) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: (1920 - WAVE_W) / 2,
        top: 560,
        opacity: enter,
        translate: `0px ${interpolate(overlay, [0, 1], [0, -390])}px`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          color: COLORS.textDim,
          fontSize: 36,
          marginBottom: 10,
          opacity: 1 - overlay,
        }}
      >
        Your recording, in a noisy café
      </div>
      <Waveform
        width={WAVE_W}
        height={WAVE_H}
        noise={noise}
        color={color}
        seed="cafe"
      />
    </div>
  );
};

// Café noise sources, drawn in code
const SpeechBubble: React.FC<{
  x: number;
  y: number;
  delay: number;
  text: string;
  flip?: boolean;
}> = ({ x, y, delay, text, flip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - (T.chatter + delay) * fps,
    fps,
    config: { damping: 12 },
  });
  const fade = interpolate(
    frame,
    [T.overlay * fps, (T.overlay + 0.4) * fps],
    [1, 0],
    clamp,
  );
  const wobble = Math.sin(frame / 5 + delay * 10) * 4;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "14px 26px",
        borderRadius: 30,
        background: COLORS.text,
        color: COLORS.bgBottom,
        fontFamily: FONT,
        fontSize: 32,
        opacity: pop * fade,
        scale: String(pop),
        rotate: `${wobble}deg`,
        borderBottomLeftRadius: flip ? 30 : 4,
        borderBottomRightRadius: flip ? 4 : 30,
      }}
    >
      {text}
    </div>
  );
};

const Cup: React.FC<{ x: number; y: number; delay: number }> = ({
  x,
  y,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = (T.chatter + delay) * fps;
  const pop = spring({ frame: frame - start, fps, config: { damping: 12 } });
  const fade = interpolate(
    frame,
    [T.overlay * fps, (T.overlay + 0.4) * fps],
    [1, 0],
    clamp,
  );
  const shake = frame > start ? Math.sin(frame * 1.8) * 6 : 0;
  const clink = interpolate(frame, [start + 4, start + 10, start + 30], [0, 1, 0.7], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: pop * fade,
        scale: String(pop),
        rotate: `${shake}deg`,
      }}
    >
      {/* Cup body + handle + saucer */}
      <div style={{ position: "relative", width: 110, height: 100 }}>
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            width: 70,
            height: 70,
            background: COLORS.text,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 22,
            width: 30,
            height: 34,
            borderRadius: "50%",
            border: `9px solid ${COLORS.text}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 82,
            width: 100,
            height: 12,
            borderRadius: 6,
            background: COLORS.text,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 95,
          top: -40,
          fontFamily: FONT,
          fontSize: 38,
          color: "#FFB547",
          opacity: clink,
          rotate: "12deg",
        }}
      >
        clink!
      </div>
    </div>
  );
};

const NoMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - T.noMatch * fps,
    fps,
    config: { damping: 10 },
  });
  if (frame < T.noMatch * fps) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 30,
        fontFamily: FONT,
        color: COLORS.danger,
        opacity: pop,
        scale: String(interpolate(pop, [0, 1], [0.6, 1])),
      }}
    >
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: `8px solid ${COLORS.danger}`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 80,
          lineHeight: 1,
        }}
      >
        ✗
      </div>
      <div style={{ fontSize: 80 }}>No match</div>
    </div>
  );
};

// Fades Part B out to make room for the closing question
const ClearForQuestion: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [T.clear * fps, (T.clear + 0.5) * fps],
    [1, 0],
    clamp,
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const HowQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.question * fps,
    fps,
    config: { damping: 14 },
  });
  if (frame < T.question * fps) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        fontSize: 120,
        color: COLORS.text,
        opacity: enter,
        scale: String(interpolate(enter, [0, 1], [0.8, 1])),
      }}
    >
      <div>
        So <span style={{ color: COLORS.accentLight }}>how</span> does it
        work?
      </div>
    </AbsoluteFill>
  );
};

export const Scene2Problem: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene2.wav")} />
      {/* Part A */}
      <SongGrid />
      <PartALabels />
      {/* Part B */}
      <ClearForQuestion>
        <OriginalWave />
        <CafeWave />
        <SpeechBubble x={170} y={830} delay={0} text="...and then she said..." />
        <SpeechBubble x={1380} y={860} delay={0.5} text="haha!" flip />
        <SpeechBubble x={1300} y={470} delay={1.1} text="one latte please" flip />
        <Cup x={260} y={460} delay={0.9} />
        <NoMatch />
      </ClearForQuestion>
      {/* Ending: bridge into Scene 3 */}
      <HowQuestion />
    </AbsoluteFill>
  );
};
