import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BACKGROUND, COLORS, FONT } from "../theme";

export const SCENE3_DURATION = 12.9; // seconds (narration is 11.97s)

// Timing (seconds), aligned to the narration in public/narration/scene3.wav
const STEP_AT = 0.1; // "So first,"
const SWEEP_START = 1.3; // "Shazam turns the sound into a picture..."
const SWEEP_END = 4.2; // "...called a spectrogram."
const TITLE_AT = 3.3; // "spectrogram"
const TIME_AT = 4.96; // "Time runs left to right,"
const TIME_END = 6.48;
const PITCH_AT = 6.96; // "pitch goes bottom to top,"
const PITCH_END = 8.36;
const LEGEND_AT = 8.84; // "and brightness..."
const LOUD_AT = 9.9; // "...shows how loud each frequency is."

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// Spectrogram data + helpers (shared with Scene 4)
// ---------------------------------------------------------------------------

export const SPEC_COLS = 48; // time steps
export const SPEC_ROWS = 24; // frequency bins, row 0 = lowest pitch

// Layout of the grid on the 1920x1080 canvas
export const SPEC_LAYOUT = {
  left: 320,
  top: 235,
  width: 1280,
  height: 600,
  gap: 2,
} as const;

export const SPEC_CELL_W = SPEC_LAYOUT.width / SPEC_COLS;
export const SPEC_CELL_H = SPEC_LAYOUT.height / SPEC_ROWS;

/** Top-left corner of a cell in canvas pixels (row 0 is at the bottom). */
export const specCellPosition = (col: number, row: number) => ({
  x: SPEC_LAYOUT.left + col * SPEC_CELL_W,
  y: SPEC_LAYOUT.top + (SPEC_ROWS - 1 - row) * SPEC_CELL_H,
});

const bump = (row: number, center: number, width = 0.7) =>
  Math.exp(-((row - center) ** 2) / (2 * width * width));

/**
 * Loudness (0..1) of one time/frequency cell. Deterministic: a little
 * melody with harmonics, a bass line, drum hits and background noise.
 */
export const spectrogramIntensity = (col: number, row: number): number => {
  const note = Math.floor(col / 4);
  const inNote = (col % 4) / 3;
  const rest = random(`spec-rest-${note}`) < 0.15;
  const f0 = 5 + Math.floor(random(`spec-melody-${note}`) * 7); // rows 5..11
  const env = (rest ? 0.25 : 1) * (1 - 0.35 * inNote);

  let v = 0;
  // Melody fundamental + harmonics
  v += 0.95 * env * bump(row, f0);
  v += 0.6 * env * bump(row, f0 * 2);
  v += 0.35 * env * bump(row, f0 * 3);

  // Bass line, changes every 8 columns
  const bassRow = 1 + Math.floor(random(`spec-bass-${Math.floor(col / 8)}`) * 3);
  v += 0.6 * (1 - 0.4 * ((col % 8) / 7)) * bump(row, bassRow, 0.6);

  // Drum hits: broadband energy, stronger at the low end
  if (col % 6 === 0) v += 0.3 * (1 - row / SPEC_ROWS);

  // Background noise
  v += random(`spec-noise-${col}-${row}`) * 0.22;

  return Math.min(1, v);
};

let gridCache: number[][] | null = null;

/** Full intensity grid, indexed as grid[col][row]. */
export const getSpectrogramGrid = (): number[][] => {
  if (!gridCache) {
    gridCache = Array.from({ length: SPEC_COLS }, (_, col) =>
      Array.from({ length: SPEC_ROWS }, (__, row) =>
        spectrogramIntensity(col, row),
      ),
    );
  }
  return gridCache;
};

const COLOR_STOPS = [0, 0.3, 0.6, 0.85, 1];
const COLOR_VALUES = ["#08132E", "#173C88", COLORS.accent, COLORS.accentLight, "#FFFFFF"];

/** Maps loudness (0..1) to the quiet→loud color scale. */
export const intensityColor = (v: number): string =>
  interpolateColors(v, COLOR_STOPS, COLOR_VALUES);

export const SPEC_GRADIENT = `linear-gradient(90deg, ${COLOR_STOPS.map(
  (s, i) => `${COLOR_VALUES[i]} ${s * 100}%`,
).join(", ")})`;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const sweepX = (frame: number, fps: number) =>
  interpolate(
    frame,
    [SWEEP_START * fps, SWEEP_END * fps],
    [SPEC_LAYOUT.left, SPEC_LAYOUT.left + SPEC_LAYOUT.width],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = spring({ frame: frame - STEP_AT * fps, fps, config: { damping: 200 } });
  const word = spring({ frame: frame - TITLE_AT * fps, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 76,
        color: COLORS.text,
        opacity: step,
        translate: `0px ${interpolate(step, [0, 1], [40, 0])}px`,
      }}
    >
      <span style={{ color: COLORS.textDim }}>Step 1: </span>
      <span
        style={{
          display: "inline-block",
          color: COLORS.accentLight,
          opacity: word,
          scale: String(interpolate(word, [0, 1], [0.6, 1])),
        }}
      >
        Spectrogram
      </span>
    </div>
  );
};

const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { left, top, width, height } = SPEC_LAYOUT;
  const midY = top + height / 2;
  const cut = sweepX(frame, fps);
  if (cut >= left + width) return null;

  const points = 320;
  const phase = frame / 6;
  let d = "";
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = left + t * width;
    const envelope = 0.55 + 0.45 * Math.sin(t * Math.PI * 3 + 0.6) ** 2;
    const y =
      Math.sin(t * 90 + phase) * 0.55 +
      Math.sin(t * 37 - phase * 0.7) * 0.3 +
      (random(`wave-${i}`) - 0.5) * 0.5;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${(midY + y * envelope * 150).toFixed(1)} `;
  }

  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <defs>
        <clipPath id="scene3-wave-clip">
          <rect x={cut} y={0} width={1920} height={1080} />
        </clipPath>
      </defs>
      <path
        d={d}
        clipPath="url(#scene3-wave-clip)"
        fill="none"
        stroke={COLORS.accentLight}
        strokeWidth={4}
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 10px ${COLORS.accent})` }}
      />
    </svg>
  );
};

const SweepLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const x = sweepX(frame, fps);
  const opacity = interpolate(
    frame,
    [SWEEP_START * fps, (SWEEP_START + 0.2) * fps, SWEEP_END * fps - 4, SWEEP_END * fps + 4],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x - 3,
        top: SPEC_LAYOUT.top - 20,
        width: 6,
        height: SPEC_LAYOUT.height + 40,
        borderRadius: 3,
        background: COLORS.text,
        boxShadow: `0 0 24px 6px ${COLORS.accentLight}`,
        opacity,
      }}
    />
  );
};

const SpectrogramGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grid = getSpectrogramGrid();
  const { left, top, width, height, gap } = SPEC_LAYOUT;
  const panel = interpolate(
    frame,
    [(SWEEP_START - 0.3) * fps, SWEEP_START * fps],
    [0, 1],
    clamp,
  );
  const cut = sweepX(frame, fps);
  const glow = interpolate(frame, [LOUD_AT * fps, (LOUD_AT + 0.4) * fps], [0, 1], clamp);
  const pulse = 0.75 + 0.25 * Math.sin(((frame / fps - LOUD_AT) * Math.PI * 2) / 1.2);

  const columns: React.ReactNode[] = [];
  const bright: React.ReactNode[] = [];
  for (let col = 0; col < SPEC_COLS; col++) {
    const colX = left + col * SPEC_CELL_W;
    // A column fades in as the sweep line passes over it
    const reveal = interpolate(cut - colX, [0, SPEC_CELL_W * 2], [0, 1], clamp);
    if (reveal <= 0) continue;
    const cells: React.ReactNode[] = [];
    for (let row = 0; row < SPEC_ROWS; row++) {
      const v = grid[col][row];
      const { x, y } = specCellPosition(col, row);
      const rect = (
        <rect
          key={`${col}-${row}`}
          x={x + gap / 2}
          y={y + gap / 2}
          width={SPEC_CELL_W - gap}
          height={SPEC_CELL_H - gap}
          rx={3}
          fill={intensityColor(v)}
        />
      );
      cells.push(rect);
      if (v > 0.75 && glow > 0) bright.push(rect);
    }
    columns.push(
      <g key={col} opacity={reveal}>
        {cells}
      </g>,
    );
  }

  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <rect
        x={left - 12}
        y={top - 12}
        width={width + 24}
        height={height + 24}
        rx={18}
        fill={COLORS.card}
        stroke={COLORS.accent}
        strokeOpacity={0.4}
        strokeWidth={2}
        opacity={panel}
      />
      {columns}
      {bright.length > 0 ? (
        <g
          opacity={glow * pulse}
          style={{ filter: `drop-shadow(0 0 10px ${COLORS.accentLight}) drop-shadow(0 0 18px ${COLORS.accent})` }}
        >
          {bright}
        </g>
      ) : null}
    </svg>
  );
};

// Highlights that trace the axes while the narration describes them
const AxisSweeps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { left, top, width, height } = SPEC_LAYOUT;

  const tX = interpolate(frame, [TIME_AT * fps, TIME_END * fps], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const tOpacity = interpolate(
    frame,
    [TIME_AT * fps, (TIME_AT + 0.2) * fps, TIME_END * fps - 6, TIME_END * fps],
    [0, 1, 1, 0],
    clamp,
  );
  const pY = interpolate(frame, [PITCH_AT * fps, PITCH_END * fps], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const pOpacity = interpolate(
    frame,
    [PITCH_AT * fps, (PITCH_AT + 0.2) * fps, PITCH_END * fps - 6, PITCH_END * fps],
    [0, 1, 1, 0],
    clamp,
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: left + tX * (width - SPEC_CELL_W * 2),
          top,
          width: SPEC_CELL_W * 2,
          height,
          borderRadius: 6,
          border: `3px solid ${COLORS.text}`,
          background: "rgba(255,255,255,0.12)",
          opacity: tOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left,
          top: top + height - SPEC_CELL_H * 2 - pY * (height - SPEC_CELL_H * 2),
          width,
          height: SPEC_CELL_H * 2,
          borderRadius: 6,
          border: `3px solid ${COLORS.text}`,
          background: "rgba(255,255,255,0.12)",
          opacity: pOpacity,
        }}
      />
    </>
  );
};

const TimeLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - TIME_AT * fps, fps, config: { damping: 200 } });
  const draw = interpolate(frame, [TIME_AT * fps, TIME_END * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const { left, top, width, height } = SPEC_LAYOUT;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top: top + height + 30,
          width: width * draw,
          height: 4,
          borderRadius: 2,
          background: COLORS.textDim,
          opacity: enter,
        }}
      />
      <div
        style={{
          position: "absolute",
          left,
          top: top + height + 44,
          width,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 48,
          color: COLORS.text,
          opacity: enter,
          translate: `${interpolate(enter, [0, 1], [-60, 0])}px 0px`,
        }}
      >
        time →
      </div>
    </>
  );
};

const PitchLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - PITCH_AT * fps, fps, config: { damping: 200 } });
  const draw = interpolate(frame, [PITCH_AT * fps, PITCH_END * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const { left, top, height } = SPEC_LAYOUT;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: left - 34,
          top: top + height * (1 - draw),
          width: 4,
          height: height * draw,
          borderRadius: 2,
          background: COLORS.textDim,
          opacity: enter,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 1920 - left + 56,
          top: top + height / 2,
          fontFamily: FONT,
          fontSize: 48,
          color: COLORS.text,
          whiteSpace: "nowrap",
          opacity: enter,
          translate: `0px ${interpolate(enter, [0, 1], [60, 0]) - 30}px`,
        }}
      >
        pitch ↑
      </div>
    </>
  );
};

const Legend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - LEGEND_AT * fps, fps, config: { damping: 200 } });
  const loud = spring({ frame: frame - LOUD_AT * fps, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        position: "absolute",
        right: 1920 - SPEC_LAYOUT.left - SPEC_LAYOUT.width,
        top: SPEC_LAYOUT.top + SPEC_LAYOUT.height + 54,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: FONT,
        fontSize: 32,
        color: COLORS.textDim,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [30, 0])}px`,
      }}
    >
      <span>quiet</span>
      <div
        style={{
          width: 260,
          height: 26,
          borderRadius: 13,
          background: SPEC_GRADIENT,
          border: `2px solid ${COLORS.accent}`,
        }}
      />
      <span
        style={{
          display: "inline-block",
          color: interpolateColors(loud, [0, 1], [COLORS.textDim, COLORS.text]),
          textShadow: `0 0 ${18 * loud}px ${COLORS.accentLight}`,
          scale: String(interpolate(loud, [0, 1], [1, 1.15])),
        }}
      >
        loud
      </span>
    </div>
  );
};

export const Scene3Spectrogram: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene3.wav")} />
      <SpectrogramGrid />
      <Waveform />
      <SweepLine />
      <AxisSweeps />
      <TimeLabel />
      <PitchLabel />
      <Legend />
      <Title />
    </AbsoluteFill>
  );
};
