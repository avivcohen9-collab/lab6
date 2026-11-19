import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BACKGROUND, COLORS, FONT } from "../theme";

export const SCENE1_DURATION = 9.5; // seconds (narration is 8.6s)

// Timing (seconds), aligned to the narration in public/narration/scene1.wav
const LISTEN_START = 4.5; // "You hold up your phone..."
const FOUND_AT = 7.5; // "...you have the answer." (exactly 3s of listening)

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        color: COLORS.text,
        fontSize: 76,
        lineHeight: 1.15,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
      }}
    >
      Have you ever wondered how Shazam
      <br />
      recognizes a song{" "}
      <span style={{ color: COLORS.accentLight }}>this fast?</span>
    </div>
  );
};

const Rings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = LISTEN_START * fps;
  const end = FOUND_AT * fps;
  if (frame < start || frame > end + 10) return null;

  const period = 1.2 * fps;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const t = ((frame - start + (i * period) / 3) % period) / period;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: `4px solid ${COLORS.accentLight}`,
              scale: String(1 + t * 1.6),
              opacity: (1 - t) * 0.8,
            }}
          />
        );
      })}
    </>
  );
};

const ListenButton: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const listening = frame >= LISTEN_START * fps && frame < FOUND_AT * fps;
  const press = spring({
    frame: frame - LISTEN_START * fps,
    fps,
    config: { damping: 12 },
  });
  const pulse = listening ? 1 + 0.05 * Math.sin((frame / fps) * Math.PI * 4) : 1;

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Rings />
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `linear-gradient(160deg, ${COLORS.accentLight}, ${COLORS.accent})`,
          boxShadow: `0 0 ${40 + 40 * press}px ${COLORS.accent}`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          scale: String(interpolate(press, [0, 1], [1, 1.08]) * pulse),
        }}
      >
        {/* Simple sound-wave icon drawn with bars */}
        {[0.4, 0.75, 1, 0.75, 0.4].map((h, i) => {
          const wobble = listening
            ? 0.6 + 0.4 * Math.abs(Math.sin(frame / 4 + i * 1.3))
            : 1;
          return (
            <div
              key={i}
              style={{
                width: 14,
                height: 90 * h * wobble,
                borderRadius: 7,
                background: COLORS.text,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const Timer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = interpolate(
    frame,
    [LISTEN_START * fps, FOUND_AT * fps],
    [0, 3],
    clamp,
  );
  const visible = interpolate(
    frame,
    [(LISTEN_START - 0.3) * fps, LISTEN_START * fps],
    [0, 1],
    clamp,
  );
  const done = frame >= FOUND_AT * fps;

  return (
    <div
      style={{
        position: "absolute",
        top: 90,
        fontFamily: FONT,
        fontSize: 44,
        color: done ? COLORS.success : COLORS.textDim,
        opacity: visible,
      }}
    >
      {seconds.toFixed(1)}s
    </div>
  );
};

const StatusText: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const listening = frame >= LISTEN_START * fps;
  const opacity = interpolate(
    frame,
    [LISTEN_START * fps, (LISTEN_START + 0.3) * fps, FOUND_AT * fps - 6, FOUND_AT * fps],
    [0, 1, 1, 0],
    clamp,
  );
  const dots = ".".repeat(1 + (Math.floor(frame / 10) % 3));

  return (
    <div
      style={{
        position: "absolute",
        bottom: 150,
        fontFamily: FONT,
        fontSize: 34,
        color: COLORS.text,
        opacity: listening ? opacity : 0,
      }}
    >
      Listening{dots}
    </div>
  );
};

const SongCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - FOUND_AT * fps,
    fps,
    config: { damping: 14 },
  });
  if (frame < FOUND_AT * fps) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        width: 330,
        padding: "22px 24px",
        borderRadius: 24,
        background: COLORS.card,
        border: `2px solid ${COLORS.accent}`,
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontFamily: FONT,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [60, 0])}px`,
        scale: String(interpolate(enter, [0, 1], [0.85, 1])),
      }}
    >
      {/* Album art drawn in code: gradient square with a vinyl circle */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 14,
          background: `linear-gradient(135deg, #FF7A59, #B03BFF)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "6px solid rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <div>
        <div style={{ color: COLORS.success, fontSize: 20 }}>✓ Song found</div>
        <div style={{ color: COLORS.text, fontSize: 28, whiteSpace: "nowrap" }}>
          Midnight Drive
        </div>
        <div style={{ color: COLORS.textDim, fontSize: 22 }}>The Lumens</div>
      </div>
    </div>
  );
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - 0.4 * fps,
    fps,
    config: { damping: 200 },
  });
  // The phone "lifts up" when the narration says "you hold up your phone"
  const lift = spring({
    frame: frame - (LISTEN_START - 0.4) * fps,
    fps,
    config: { damping: 20 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 290,
        marginLeft: -200,
        width: 400,
        height: 740,
        borderRadius: 60,
        background: "#0A1430",
        border: "10px solid #1C2B52",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [200, 0]) - 30 * lift}px`,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 18,
          width: 120,
          height: 28,
          borderRadius: 14,
          background: "#030817",
        }}
      />
      <Timer />
      <ListenButton />
      <StatusText />
      <SongCard />
    </div>
  );
};

// Music notes drifting toward the phone while it listens
const NOTES = [
  { x: 260, y: 520, delay: 0.0, glyph: "♪", size: 90 },
  { x: 420, y: 820, delay: 0.5, glyph: "♫", size: 110 },
  { x: 1620, y: 560, delay: 0.25, glyph: "♫", size: 100 },
  { x: 1480, y: 860, delay: 0.8, glyph: "♪", size: 80 },
  { x: 180, y: 900, delay: 1.1, glyph: "♫", size: 70 },
  { x: 1720, y: 900, delay: 1.4, glyph: "♪", size: 90 },
];

const MusicNotes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const loop = 2.2 * fps;

  return (
    <>
      {NOTES.map((n, i) => {
        // Notes flow from the start of the scene until the song is found
        const local = frame - (0.6 + n.delay) * fps;
        if (local < 0 || frame > FOUND_AT * fps + 15) return null;
        const t = (local % loop) / loop;
        const eased = Easing.inOut(Easing.quad)(t);
        const targetX = width / 2;
        const targetY = 660;
        const x = interpolate(eased, [0, 1], [n.x, targetX]);
        const y = interpolate(eased, [0, 1], [n.y, targetY]);
        const fadeAll = interpolate(
          frame,
          [FOUND_AT * fps, FOUND_AT * fps + 15],
          [1, 0],
          clamp,
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontSize: n.size,
              color: COLORS.accentLight,
              opacity: interpolate(t, [0, 0.15, 0.8, 1], [0, 0.9, 0.9, 0]) * fadeAll,
              translate: "-50% -50%",
              rotate: `${Math.sin(local / 8) * 12}deg`,
            }}
          >
            {n.glyph}
          </div>
        );
      })}
    </>
  );
};

export const Scene1Hook: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene1.wav")} />
      <MusicNotes />
      <Phone />
      <Title />
    </AbsoluteFill>
  );
};
