import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BACKGROUND, COLORS, FONT } from "../theme";
import {
  getSpectrogramGrid,
  intensityColor,
  SCENE3_DURATION,
  SPEC_CELL_H,
  SPEC_CELL_W,
  SPEC_COLS,
  SPEC_GRADIENT,
  SPEC_LAYOUT,
  SPEC_ROWS,
  specCellPosition,
} from "./Scene3Spectrogram";

export const SCENE4_DURATION = 16.5; // seconds (narration is 15.57s)

// Sentence cues (seconds), from silence detection on public/narration/scene4.wav
const T = {
  noise: 2.5, // "...and the café noise is in there too."
  keeps: 4.8, // "So Shazam keeps only the loudest peaks,"
  fadeDim: 5.6, // "...only the loudest..."
  peaks: 6.4, // "...peaks, the brightest points."
  quieter: 9.3, // "Background noise is quieter,"
  survive: 11.6, // "so these peaks survive it."
  together: 13.1, // "Together,"
  stars: 14.2, // "they look like a map of stars."
};

// Scene 3 makes its brightest cells pulse from this moment (seconds into
// Scene 3). We continue the same pulse so the cut is invisible.
const SCENE3_LOUD_AT = 9.9;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// Peaks (shared with Scene 5)
// ---------------------------------------------------------------------------

const PEAK_RADIUS = 2; // neighborhood: ±2 columns, ±2 rows
const PEAK_THRESHOLD = 0.65;

export type Peak = { col: number; row: number };

let peaksCache: Peak[] | null = null;

/**
 * Local maxima of the Scene 3 spectrogram: cells at least PEAK_THRESHOLD loud
 * and the loudest within ±PEAK_RADIUS cells. Sorted by time, then pitch.
 */
export const getPeaks = (): Peak[] => {
  if (peaksCache) return peaksCache;
  const grid = getSpectrogramGrid();
  const peaks: Peak[] = [];
  for (let col = 0; col < SPEC_COLS; col++) {
    for (let row = 0; row < SPEC_ROWS; row++) {
      const v = grid[col][row];
      if (v < PEAK_THRESHOLD) continue;
      let isMax = true;
      for (let dc = -PEAK_RADIUS; dc <= PEAK_RADIUS && isMax; dc++) {
        for (let dr = -PEAK_RADIUS; dr <= PEAK_RADIUS; dr++) {
          const c = col + dc;
          const r = row + dr;
          if ((dc === 0 && dr === 0) || c < 0 || r < 0 || c >= SPEC_COLS || r >= SPEC_ROWS) {
            continue;
          }
          // Loud cells clamp at 1.0, so break ties toward the earlier cell
          const earlier = dc < 0 || (dc === 0 && dr < 0);
          if (grid[c][r] > v || (grid[c][r] === v && earlier)) {
            isMax = false;
            break;
          }
        }
      }
      if (isMax) peaks.push({ col, row });
    }
  }
  peaksCache = peaks;
  return peaks;
};

/** Center of a peak's star in canvas pixels (1920x1080). */
export const peakPosition = (peak: Peak) => {
  const { x, y } = specCellPosition(peak.col, peak.row);
  return { x: x + SPEC_CELL_W / 2, y: y + SPEC_CELL_H / 2 };
};

export const STAR_SIZE = 14; // px, diameter of a star dot at rest

const isPeakSet = () => new Set(getPeaks().map((p) => `${p.col}-${p.row}`));

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [T.keeps * fps, (T.keeps + 0.3) * fps], [0, 1], clamp);
  const enter = spring({
    frame: frame - (T.keeps + 0.25) * fps,
    fps,
    config: { damping: 200 },
  });

  const base: React.CSSProperties = {
    position: "absolute",
    top: 70,
    width: "100%",
    textAlign: "center",
    fontFamily: FONT,
    fontSize: 76,
    color: COLORS.text,
  };

  return (
    <>
      {/* Scene 3's final title, identical position and style */}
      <div
        style={{
          ...base,
          opacity: 1 - out,
          translate: `0px ${-30 * out}px`,
        }}
      >
        <span style={{ color: COLORS.textDim }}>Step 1: </span>
        <span style={{ display: "inline-block", color: COLORS.accentLight }}>
          Spectrogram
        </span>
      </div>
      <div
        style={{
          ...base,
          opacity: enter,
          translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
        }}
      >
        <span style={{ color: COLORS.textDim }}>Step 2: </span>
        <span style={{ color: COLORS.accentLight }}>Keep the peaks</span>
      </div>
    </>
  );
};

// Darkens the scene toward a night sky at "map of stars"
const NightSky: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dark = interpolate(
    frame,
    [T.together * fps, (T.stars + 0.4) * fps],
    [0, 0.85],
    clamp,
  );
  return <AbsoluteFill style={{ backgroundColor: "#01030A", opacity: dark }} />;
};

const SpectrogramToStars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const grid = getSpectrogramGrid();
  const peakSet = isPeakSet();
  const { left, top, width, height, gap } = SPEC_LAYOUT;

  // Same glow pulse as the end of Scene 3, continued in time
  const pulse =
    0.75 + 0.25 * Math.sin(((t + SCENE3_DURATION - SCENE3_LOUD_AT) * Math.PI * 2) / 1.2);
  const shrink = spring({
    frame: frame - T.peaks * fps,
    fps,
    config: { damping: 16 },
  });
  const panel = interpolate(
    frame,
    [T.together * fps, (T.stars + 0.4) * fps],
    [1, 0],
    clamp,
  );
  const twinkleOn = interpolate(frame, [T.stars * fps, (T.stars + 0.6) * fps], [0, 1], clamp);
  const survive = spring({
    frame: frame - T.survive * fps,
    fps,
    config: { damping: 10 },
    durationInFrames: 18,
  });
  const surviveBump = 1 + 0.35 * Math.sin(Math.PI * survive);

  const cells: React.ReactNode[] = [];
  const glowCells: React.ReactNode[] = [];
  const stars: React.ReactNode[] = [];
  for (let col = 0; col < SPEC_COLS; col++) {
    for (let row = 0; row < SPEC_ROWS; row++) {
      const v = grid[col][row];
      const { x, y } = specCellPosition(col, row);
      const key = `${col}-${row}`;

      const isPeak = peakSet.has(key);
      // Other cells fade away, quietest first; peaks cross-fade into stars
      const fadeStart = T.fadeDim + v * 0.9;
      const opacity = isPeak
        ? interpolate(shrink, [0, 0.3], [1, 0], clamp)
        : interpolate(t, [fadeStart, fadeStart + 0.5], [1, 0], clamp);
      if (opacity > 0) {
        const rect = (
          <rect
            key={key}
            x={x + gap / 2}
            y={y + gap / 2}
            width={SPEC_CELL_W - gap}
            height={SPEC_CELL_H - gap}
            rx={3}
            fill={intensityColor(v)}
            opacity={opacity}
          />
        );
        cells.push(rect);
        if (v > 0.75) glowCells.push(rect);
      }

      if (isPeak) {
        // Peak: shrinks from a cell into a glowing white dot
        const cx = x + SPEC_CELL_W / 2;
        const cy = y + SPEC_CELL_H / 2;
        const seed = random(`star-${key}`);
        const twinkle =
          1 + twinkleOn * 0.22 * Math.sin(t * Math.PI * 2 * (0.6 + seed * 0.8) + seed * 10);
        const w = interpolate(shrink, [0, 1], [SPEC_CELL_W - gap, STAR_SIZE]) * surviveBump * twinkle;
        const h = interpolate(shrink, [0, 1], [SPEC_CELL_H - gap, STAR_SIZE]) * surviveBump * twinkle;
        stars.push(
          <rect
            key={key}
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            rx={interpolate(shrink, [0, 1], [3, STAR_SIZE / 2]) * surviveBump * twinkle}
            fill={interpolateColors(shrink, [0, 1], [intensityColor(v), "#FFFFFF"])}
          />,
        );
      }
    }
  }
  const starsOpacity = interpolate(shrink, [0, 0.3], [0, 1], clamp);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
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
      {cells}
      {glowCells.length > 0 ? (
        <g
          opacity={pulse}
          style={{
            filter: `drop-shadow(0 0 10px ${COLORS.accentLight}) drop-shadow(0 0 18px ${COLORS.accent})`,
          }}
        >
          {glowCells}
        </g>
      ) : null}
      {/* Stars glow like Scene 3's bright cells at first, then turn white */}
      <g
        opacity={starsOpacity}
        style={{
          filter: `drop-shadow(0 0 ${8 + 6 * shrink}px ${COLORS.accentLight}) drop-shadow(0 0 ${18 + 8 * shrink}px ${COLORS.accent})`,
        }}
      >
        {stars}
      </g>
    </svg>
  );
};

// Café noise: faint speckles that flicker, then vanish (peaks stay)
const NOISE_COUNT = 140;

const NoiseSpeckles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { left, top, width, height } = SPEC_LAYOUT;
  const tick = Math.floor(frame / 3);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: NOISE_COUNT }, (_, i) => {
        const appear = T.noise + random(`noise-in-${i}`) * 1.2;
        const vanish = T.quieter + 0.3 + random(`noise-out-${i}`) * 1.8;
        const inOpacity = interpolate(t, [appear, appear + 0.3], [0, 1], clamp);
        const outOpacity = interpolate(t, [vanish, vanish + 0.15], [1, 0], clamp);
        const visible = inOpacity * outOpacity;
        if (visible <= 0) return null;
        // Flicker gets stronger while the noise is being removed
        const unrest = interpolate(t, [T.quieter, T.quieter + 0.5], [0.35, 0.9], clamp);
        const flicker = 1 - unrest * random(`noise-flicker-${i}-${tick}`);
        const size = 4 + random(`noise-size-${i}`) * 7;
        return (
          <rect
            key={i}
            x={left + random(`noise-x-${i}`) * (width - size)}
            y={top + random(`noise-y-${i}`) * (height - size)}
            width={size}
            height={size}
            rx={size / 3}
            fill={random(`noise-c-${i}`) < 0.5 ? COLORS.textDim : COLORS.accentLight}
            opacity={0.55 * visible * flicker}
          />
        );
      })}
    </svg>
  );
};

// Scene 3's axes and legend, identical at frame 0, then fading out
const AxesAndLegend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { left, top, width, height } = SPEC_LAYOUT;
  const legend = interpolate(frame, [T.keeps * fps, (T.keeps + 0.5) * fps], [1, 0], clamp);
  const axes = interpolate(frame, [T.together * fps, (T.together + 0.6) * fps], [1, 0], clamp);

  const label: React.CSSProperties = {
    position: "absolute",
    fontFamily: FONT,
    fontSize: 48,
    color: COLORS.text,
    whiteSpace: "nowrap",
  };
  const line: React.CSSProperties = {
    position: "absolute",
    borderRadius: 2,
    background: COLORS.textDim,
  };

  return (
    <>
      <div style={{ opacity: axes }}>
        <div style={{ ...line, left, top: top + height + 30, width, height: 4 }} />
        <div
          style={{ ...label, left, top: top + height + 44, width, textAlign: "center" }}
        >
          time →
        </div>
        <div style={{ ...line, left: left - 34, top, width: 4, height }} />
        <div
          style={{
            ...label,
            right: 1920 - left + 56,
            top: top + height / 2,
            translate: "0px -30px",
          }}
        >
          pitch ↑
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 1920 - left - width,
          top: top + height + 54,
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: FONT,
          fontSize: 32,
          color: COLORS.textDim,
          opacity: legend,
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
            color: COLORS.text,
            textShadow: `0 0 18px ${COLORS.accentLight}`,
            scale: "1.15",
          }}
        >
          loud
        </span>
      </div>
    </>
  );
};

const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.stars * fps, fps, config: { damping: 14 } });
  const { top, height } = SPEC_LAYOUT;

  return (
    <div
      style={{
        position: "absolute",
        top: top + height + 40,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 64,
        color: COLORS.text,
        textShadow: `0 0 24px ${COLORS.accent}`,
        opacity: enter,
        scale: String(interpolate(enter, [0, 1], [0.8, 1])),
      }}
    >
      ✦ Constellation map ✦
    </div>
  );
};

export const Scene4Constellation: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene4.wav")} />
      <NightSky />
      <SpectrogramToStars />
      <NoiseSpeckles />
      <AxesAndLegend />
      <Caption />
      <Title />
    </AbsoluteFill>
  );
};
