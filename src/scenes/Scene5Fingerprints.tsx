import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BACKGROUND, COLORS, FONT } from "../theme";
import {
  SPEC_CELL_H,
  SPEC_COLS,
  SPEC_ROWS,
  specCellPosition,
} from "./Scene3Spectrogram";
import {
  getPeaks,
  type Peak,
  peakPosition,
  SCENE4_DURATION,
  STAR_SIZE,
} from "./Scene4Constellation";

export const SCENE5_DURATION = 26.2; // seconds (narration is 25.26s)

// Sentence cues (seconds), from silence detection on public/narration/scene5.wav
const T = {
  title: 2.7, // "So Shazam picks one star..."
  anchor: 4.2, // "...as an anchor,"
  pairs: 5.1, // "and pairs it with a few nearby stars just ahead of it."
  zoom: 8.5, // "Each pair becomes a tiny fingerprint:"
  pitches: 11.03, // "the two pitches,"
  gap: 12.1, // "and the time gap between them."
  chip: 13.0,
  because: 14.17, // "Because it uses the gap,"
  exact: 15.48, // "not the exact time,"
  same: 17.06, // "the fingerprint is the same no matter when you started recording."
  zoomOut: 20.3,
  every: 21.0, // "Shazam does this for every star,"
  stack: 22.3, // "and gets a whole stack of fingerprints."
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const ease = Easing.inOut(Easing.cubic);

// ---------------------------------------------------------------------------
// Pairs and hashes
// ---------------------------------------------------------------------------

// Target zone: stars 2..9 columns ahead of the anchor, within ±5 rows
const ZONE = { dcMin: 2, dcMax: 9, dRow: 5 } as const;

const inZone = (a: Peak, p: Peak) =>
  p.col - a.col >= ZONE.dcMin &&
  p.col - a.col <= ZONE.dcMax &&
  Math.abs(p.row - a.row) <= ZONE.dRow;

const targetsOf = (a: Peak, peaks: Peak[]): Peak[] =>
  peaks
    .filter((p) => inZone(a, p))
    .sort(
      (p, q) =>
        p.col - q.col || Math.abs(p.row - a.row) - Math.abs(q.row - a.row),
    )
    .slice(0, 4);

// A partner that zooms nicely: a few columns ahead, slightly different pitch
const goodPartner = (a: Peak) => (q: Peak) =>
  q.col - a.col >= 3 &&
  q.col - a.col <= 6 &&
  Math.abs(q.row - a.row) >= 1 &&
  Math.abs(q.row - a.row) <= 2;

const hexHash = (seed: string) =>
  Math.floor(random(seed) * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

export const MAIN_HASH = "3A7F";

type Burst = { anchor: Peak; targets: Peak[]; hash: string };
type Geometry = {
  anchor: Peak;
  targets: Peak[];
  partner: Peak;
  bursts: Burst[];
};

let geoCache: Geometry | null = null;

const getGeometry = (): Geometry => {
  if (geoCache) return geoCache;
  const peaks = getPeaks();

  // Main anchor: left-middle of the map with 3-4 stars in its target zone
  let anchor = peaks[0];
  let bestScore = -Infinity;
  for (const p of peaks) {
    if (p.col < 5 || p.col > 20) continue;
    const zoneCount = peaks.filter((q) => inZone(p, q)).length;
    const ts = targetsOf(p, peaks);
    const score =
      (zoneCount >= 3 && zoneCount <= 4 ? 20 : Math.min(zoneCount, 4) * 4) +
      (ts.some(goodPartner(p)) ? 8 : 0) -
      Math.abs(p.col - 12) * 0.3 -
      Math.abs(p.row - 10) * 0.2;
    if (score > bestScore) {
      bestScore = score;
      anchor = p;
    }
  }
  const targets = targetsOf(anchor, peaks);
  const partner =
    targets.find(goodPartner(anchor)) ??
    targets[targets.length - 1] ??
    peaks[Math.min(peaks.indexOf(anchor) + 1, peaks.length - 1)];

  // Other anchors fire later, spread out in time
  const BINS = 8;
  const binW = (SPEC_COLS - ZONE.dcMin) / BINS;
  const bursts: Burst[] = [];
  for (let b = 0; b < BINS; b++) {
    let pick: Peak | null = null;
    let pickCount = 0;
    for (const p of peaks) {
      if (p === anchor || p.col < b * binW || p.col >= (b + 1) * binW) continue;
      const n = targetsOf(p, peaks).length;
      if (n > pickCount) {
        pick = p;
        pickCount = n;
      }
    }
    if (pick && bursts.length < 7) {
      let hash = hexHash(`hash-${pick.col}-${pick.row}`);
      if (hash === MAIN_HASH) hash = "B21C";
      bursts.push({ anchor: pick, targets: targetsOf(pick, peaks), hash });
    }
  }

  geoCache = { anchor, targets, partner, bursts };
  return geoCache;
};

const keyOf = (p: Peak) => `${p.col}-${p.row}`;

// ---------------------------------------------------------------------------
// Camera: zoom into the main pair
// ---------------------------------------------------------------------------

const PAIR_SPAN = 360; // px between anchor and partner when zoomed in
const PAIR_LEFT = 300; // anchor x when zoomed in
const PAIR_Y = 420;
const AXIS_Y = 650;
const CHIP_Y = 820;
const SHIFT = 860; // ghost copy offset ("recorded later")
const BADGE_DY = -66;

const zoomInfo = () => {
  const { anchor, partner } = getGeometry();
  const A = peakPosition(anchor);
  const P = peakPosition(partner);
  const dx = Math.max(P.x - A.x, 1);
  const scale = Math.min(4.2, Math.max(1.5, PAIR_SPAN / dx));
  const span = dx * scale;
  return {
    scale,
    span,
    mid: { x: (A.x + P.x) / 2, y: (A.y + P.y) / 2 },
    focus: { x: PAIR_LEFT + span / 2, y: PAIR_Y },
  };
};

const zoomAmount = (frame: number, fps: number) => {
  const zin = interpolate(frame, [T.zoom * fps, (T.zoom + 1.1) * fps], [0, 1], {
    ...clamp,
    easing: ease,
  });
  return zin * (1 - zoomOutAmount(frame, fps));
};

const zoomOutAmount = (frame: number, fps: number) =>
  interpolate(frame, [T.zoomOut * fps, (T.zoomOut + 0.8) * fps], [0, 1], {
    ...clamp,
    easing: ease,
  });

const toScreen = (p: { x: number; y: number }, z: number) => {
  const { scale, mid, focus } = zoomInfo();
  return {
    x: p.x + z * ((p.x - mid.x) * scale + focus.x - p.x),
    y: p.y + z * ((p.y - mid.y) * scale + focus.y - p.y),
  };
};

/** Fades out the zoomed-in overlays (labels, ghost, chips). */
const overlayOut = (frame: number, fps: number) =>
  interpolate(frame, [T.zoomOut * fps, (T.zoomOut + 0.4) * fps], [1, 0], clamp);

const ghostSlide = (frame: number, fps: number) =>
  interpolate(
    frame,
    [(T.because + 0.1) * fps, (T.because + 1.1) * fps],
    [0, 1],
    { ...clamp, easing: ease },
  );

const pairStarSize = (z: number) => STAR_SIZE * (1 + 0.9 * z);

const burstStart = (i: number) => T.every + 0.1 + i * 0.42;

// ---------------------------------------------------------------------------
// Hash chips (shared with Scene 6)
// ---------------------------------------------------------------------------

export const HASH_CHIP = { width: 200, height: 64 } as const;
const STACK = { left: 1665, top: 236, step: 82 } as const;

export type HashChipInfo = { label: string; x: number; y: number };

/** Hash chips stacked at the right edge on Scene 5's last frame (top-left corners). */
export const getHashStack = (): HashChipInfo[] => {
  const labels = [MAIN_HASH, ...getGeometry().bursts.map((b) => b.hash)];
  return labels.map((label, k) => ({
    label,
    x: STACK.left,
    y: STACK.top + k * STACK.step,
  }));
};

export const HashChip: React.FC<{
  label: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ label, glow = 0, style }) => (
  <div
    style={{
      position: "absolute",
      width: HASH_CHIP.width,
      height: HASH_CHIP.height,
      borderRadius: 16,
      background: COLORS.card,
      border: `3px solid ${COLORS.accentLight}`,
      boxShadow: `0 0 ${14 + 20 * glow}px ${glow > 0 ? COLORS.success : COLORS.accent}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontFamily: FONT,
      fontSize: 40,
      letterSpacing: 3,
      color: COLORS.text,
      boxSizing: "border-box",
      ...style,
    }}
  >
    <span style={{ color: COLORS.textDim, fontSize: 30 }}>#</span>
    {label}
  </div>
);

const Pill: React.FC<{
  x: number;
  y: number;
  text: string;
  opacity: number;
  scale?: number;
  color?: string;
  border?: string;
  fontSize?: number;
}> = ({ x, y, text, opacity, scale = 1, color = COLORS.text, border = COLORS.accentLight, fontSize = 34 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      scale: String(scale),
      padding: "6px 18px",
      borderRadius: 14,
      background: COLORS.card,
      border: `3px solid ${border}`,
      fontFamily: FONT,
      fontSize,
      color,
      whiteSpace: "nowrap",
      opacity,
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

// Same night sky Scene 4 ends on
const NightSky: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#01030A", opacity: 0.85 }} />
);

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [T.title * fps, (T.title + 0.3) * fps], [0, 1], clamp);
  const enter = spring({
    frame: frame - (T.title + 0.25) * fps,
    fps,
    config: { damping: 200 },
  });
  const word = spring({
    frame: frame - (T.title + 0.45) * fps,
    fps,
    config: { damping: 14 },
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
      {/* Scene 4's final title, identical position and style */}
      <div style={{ ...base, opacity: 1 - out, translate: `0px ${-30 * out}px` }}>
        <span style={{ color: COLORS.textDim }}>Step 2: </span>
        <span style={{ color: COLORS.accentLight }}>Keep the peaks</span>
      </div>
      <div
        style={{
          ...base,
          opacity: enter,
          translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
        }}
      >
        <span style={{ color: COLORS.textDim }}>Step 3: </span>
        <span
          style={{
            display: "inline-block",
            color: COLORS.accentLight,
            opacity: word,
            scale: String(interpolate(word, [0, 1], [0.6, 1])),
          }}
        >
          Fingerprints
        </span>
      </div>
    </>
  );
};

// Scene 4's caption, identical at frame 0, then fading out
const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [(T.title - 0.6) * fps, T.title * fps], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 235 + 600 + 40,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 64,
        color: COLORS.text,
        textShadow: `0 0 24px ${COLORS.accent}`,
        opacity: 1 - out,
        translate: `0px ${20 * out}px`,
      }}
    >
      ✦ Constellation map ✦
    </div>
  );
};

const TargetZone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { anchor } = getGeometry();
  const enter = spring({ frame: frame - T.pairs * fps, fps, config: { damping: 200 } });
  const out = interpolate(frame, [T.zoom * fps, (T.zoom + 0.5) * fps], [1, 0], clamp);
  const opacity = enter * out;
  if (opacity <= 0) return null;

  const c0 = anchor.col + ZONE.dcMin;
  const c1 = Math.min(anchor.col + ZONE.dcMax + 1, SPEC_COLS);
  const rTop = Math.min(anchor.row + ZONE.dRow, SPEC_ROWS - 1);
  const rBot = Math.max(anchor.row - ZONE.dRow, 0);
  const x0 = specCellPosition(c0, 0).x;
  const x1 = specCellPosition(c1, 0).x;
  const y0 = specCellPosition(0, rTop).y;
  const y1 = specCellPosition(0, rBot).y + SPEC_CELL_H;
  const grow = interpolate(enter, [0, 1], [0.3, 1]);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect
        x={x0}
        y={y0}
        width={(x1 - x0) * grow}
        height={y1 - y0}
        rx={12}
        fill={COLORS.accent}
        fillOpacity={0.14}
        stroke={COLORS.accentLight}
        strokeWidth={3}
        strokeDasharray="12 8"
        opacity={opacity}
      />
      <text
        x={x0 + 4}
        y={y1 + 40}
        fontFamily={FONT}
        fontSize={30}
        fill={COLORS.accentLight}
        opacity={opacity}
      >
        target zone →
      </text>
    </svg>
  );
};

const Links: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { anchor, targets, partner, bursts } = getGeometry();
  const z = zoomAmount(frame, fps);
  const zOut = zoomOutAmount(frame, fps);
  const A = toScreen(peakPosition(anchor), z);

  const lines: React.ReactNode[] = [];
  targets.forEach((p, j) => {
    const start = T.pairs + 0.5 + j * 0.4;
    const draw = interpolate(t, [start, start + 0.4], [0, 1], { ...clamp, easing: ease });
    if (draw <= 0) return;
    const isPartner = p === partner;
    const fade = isPartner ? 1 - 0.75 * zOut : (1 - z) * (1 - 0.75 * zOut);
    const P = toScreen(peakPosition(p), z);
    lines.push(
      <line
        key={`m-${j}`}
        x1={A.x}
        y1={A.y}
        x2={A.x + (P.x - A.x) * draw}
        y2={A.y + (P.y - A.y) * draw}
        stroke={COLORS.accentLight}
        strokeWidth={3 + 2 * z}
        strokeLinecap="round"
        opacity={0.9 * fade}
      />,
    );
  });

  bursts.forEach((b, i) => {
    const s = burstStart(i);
    const B = peakPosition(b.anchor);
    b.targets.forEach((p, j) => {
      const draw = interpolate(t, [s + j * 0.05, s + 0.25 + j * 0.05], [0, 1], clamp);
      if (draw <= 0) return;
      const fade = interpolate(t, [s + 0.6, s + 1.2], [1, 0.3], clamp);
      const P = peakPosition(p);
      lines.push(
        <line
          key={`b-${i}-${j}`}
          x1={B.x}
          y1={B.y}
          x2={B.x + (P.x - B.x) * draw}
          y2={B.y + (P.y - B.y) * draw}
          stroke={COLORS.accentLight}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.85 * fade}
        />,
      );
    });
  });

  return (
    <svg
      width={1920}
      height={1080}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        filter: `drop-shadow(0 0 8px ${COLORS.accent})`,
      }}
    >
      {lines}
    </svg>
  );
};

const StarField: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const t4 = SCENE4_DURATION + t; // continue Scene 4's twinkle
  const { anchor, targets, partner, bursts } = getGeometry();
  const z = zoomAmount(frame, fps);
  const zOut = zoomOutAmount(frame, fps);
  const ghost = ghostSlide(frame, fps) * overlayOut(frame, fps);

  const anchorOn = spring({ frame: frame - T.anchor * fps, fps, config: { damping: 12 } });
  const anchorHi = anchorOn * (1 - zOut);
  const targetKeys = new Map(targets.map((p, j) => [keyOf(p), j]));
  const burstByKey = new Map(bursts.map((b, i) => [keyOf(b.anchor), i]));
  const burstTargets = new Map<string, number>();
  bursts.forEach((b, i) =>
    b.targets.forEach((p) => {
      const k = keyOf(p);
      if (!burstTargets.has(k)) burstTargets.set(k, i);
    }),
  );

  const stars: React.ReactNode[] = [];
  let halo: React.ReactNode = null;
  for (const p of getPeaks()) {
    const key = keyOf(p);
    const seed = random(`star-${key}`);
    const twinkle = 1 + 0.22 * Math.sin(t4 * Math.PI * 2 * (0.6 + seed * 0.8) + seed * 10);
    const isAnchor = p === anchor;
    const isPair = isAnchor || p === partner;
    const { x, y } = toScreen(peakPosition(p), z);

    let size = (isPair ? pairStarSize(z) : STAR_SIZE * (1 + 0.6 * z)) * twinkle;
    // Others dim slightly once the anchor is picked
    let opacity = 1 - 0.45 * anchorOn;

    if (isAnchor) {
      opacity = 1;
      size *= 1 + 1.0 * anchorHi;
    }
    const j = targetKeys.get(key);
    if (j !== undefined) {
      const lit = interpolate(t, [T.pairs + 0.8 + j * 0.4, T.pairs + 1.0 + j * 0.4], [0, 1], clamp);
      opacity = Math.max(opacity, (1 - 0.45 * anchorOn) + 0.45 * lit * (1 - zOut));
      size *= 1 + 0.25 * lit * (1 - zOut);
    }
    // Zoomed in: only the pair stays
    if (!isPair) opacity *= (1 - 0.85 * z) * (1 - ghost);

    // Later anchors flash as they fire
    const bi = burstByKey.get(key);
    if (bi !== undefined) {
      const s = burstStart(bi);
      const pulse = interpolate(t, [s - 0.05, s + 0.12, s + 0.8], [0, 1, 0.3], clamp);
      opacity = Math.max(opacity, pulse);
      size *= 1 + 0.8 * pulse;
    }
    const bt = burstTargets.get(key);
    if (bt !== undefined) {
      const s = burstStart(bt);
      const lit = interpolate(t, [s + 0.15, s + 0.3, s + 1.0], [0, 1, 0.3], clamp);
      opacity = Math.max(opacity, lit);
    }

    if (x < -40 || x > 1960 || y < -40 || y > 1120) continue;
    stars.push(
      <rect
        key={key}
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        rx={size / 2}
        fill="#FFFFFF"
        opacity={opacity}
      />,
    );

    if (isAnchor && anchorHi * (1 - z) > 0) {
      const ring = 0.5 + 0.5 * Math.sin((t - T.anchor) * Math.PI * 2 * 0.8);
      halo = (
        <circle
          cx={x}
          cy={y}
          r={size * (0.9 + 0.25 * ring)}
          fill="none"
          stroke={COLORS.accentLight}
          strokeWidth={3}
          opacity={anchorHi * (1 - z) * (0.5 + 0.4 * ring)}
        />
      );
    }
  }

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <g
        style={{
          filter: `drop-shadow(0 0 14px ${COLORS.accentLight}) drop-shadow(0 0 26px ${COLORS.accent})`,
        }}
      >
        {stars}
      </g>
      {halo}
    </svg>
  );
};

const TimeAxis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [(T.zoom + 0.9) * fps, (T.zoom + 1.6) * fps], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const opacity = draw * overlayOut(frame, fps);
  if (opacity <= 0) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: AXIS_Y - 2,
          width: 1640 * draw,
          height: 4,
          borderRadius: 2,
          background: COLORS.textDim,
          opacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 1920 - 1780,
          top: AXIS_Y + 14,
          fontFamily: FONT,
          fontSize: 40,
          color: COLORS.textDim,
          opacity,
        }}
      >
        time →
      </div>
    </>
  );
};

/** Badges, drop lines and the Δt bracket for the zoomed pair (or its ghost copy). */
const PairLabels: React.FC<{ ghost: boolean }> = ({ ghost }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { anchor, partner } = getGeometry();
  const z = zoomAmount(frame, fps);
  const slide = ghostSlide(frame, fps);
  const dx = ghost ? SHIFT * slide : 0;
  const out = overlayOut(frame, fps);
  const visible = (ghost ? interpolate(slide, [0, 0.15], [0, 1], clamp) : 1) * out;
  if (visible <= 0 || z <= 0) return null;

  const A0 = toScreen(peakPosition(anchor), z);
  const P0 = toScreen(peakPosition(partner), z);
  const A = { x: A0.x + dx, y: A0.y };
  const P = { x: P0.x + dx, y: P0.y };

  const f1 = spring({ frame: frame - T.pitches * fps, fps, config: { damping: 12 } });
  const f2 = spring({ frame: frame - (T.pitches + 0.4) * fps, fps, config: { damping: 12 } });
  const drop = interpolate(t, [T.gap, T.gap + 0.4], [0, 1], clamp);
  const bracket = interpolate(t, [T.gap + 0.2, T.gap + 0.7], [0, 1], { ...clamp, easing: ease });
  const dtOn = spring({ frame: frame - (T.gap + 0.6) * fps, fps, config: { damping: 12 } });
  // "not the exact time": time stamps appear, get struck out, Δt glows
  const stamp = interpolate(t, [T.exact, T.exact + 0.3], [0, 1], clamp);
  const strike = interpolate(t, [T.exact + 0.6, T.exact + 0.9], [0, 1], clamp);
  const dtGlow = interpolate(t, [T.exact + 0.8, T.exact + 1.1], [0, 1], clamp);
  const midX = (A.x + P.x) / 2;
  const by = AXIS_Y + 24;
  const size = pairStarSize(z);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: visible }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {ghost ? (
          <g
            style={{
              filter: `drop-shadow(0 0 14px ${COLORS.accentLight}) drop-shadow(0 0 26px ${COLORS.accent})`,
            }}
          >
            <line
              x1={A.x}
              y1={A.y}
              x2={P.x}
              y2={P.y}
              stroke={COLORS.accentLight}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.9}
            />
            {[A, P].map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={size / 2} fill="#FFFFFF" />
            ))}
          </g>
        ) : null}
        {[A, P].map((s, i) => (
          <line
            key={i}
            x1={s.x}
            y1={s.y + size}
            x2={s.x}
            y2={s.y + size + (AXIS_Y - s.y - size) * drop}
            stroke={COLORS.textDim}
            strokeWidth={2}
            strokeDasharray="8 8"
            opacity={0.8}
          />
        ))}
        {bracket > 0 ? (
          <path
            d={`M${A.x},${by - 12} L${A.x},${by} L${A.x + (P.x - A.x) * bracket},${by} ${
              bracket >= 1 ? `L${P.x},${by - 12}` : ""
            }`}
            fill="none"
            stroke={dtGlow > 0 ? COLORS.success : COLORS.text}
            strokeWidth={4}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 ${10 * dtGlow}px ${COLORS.success})` }}
          />
        ) : null}
      </svg>
      <Pill x={A.x} y={A.y + BADGE_DY} text="f1" opacity={f1} scale={interpolate(f1, [0, 1], [0.5, 1])} />
      <Pill x={P.x} y={P.y + BADGE_DY} text="f2" opacity={f2} scale={interpolate(f2, [0, 1], [0.5, 1])} />
      <Pill
        x={midX}
        y={AXIS_Y + 64}
        text="Δt"
        opacity={dtOn}
        scale={interpolate(dtOn, [0, 1], [0.5, 1]) * (1 + 0.12 * dtGlow)}
        border={dtGlow > 0 ? COLORS.success : COLORS.accentLight}
      />
      <div
        style={{
          position: "absolute",
          right: 1920 - (A.x - 16),
          top: AXIS_Y - 50,
          fontFamily: FONT,
          fontSize: 30,
          color: COLORS.textDim,
          whiteSpace: "nowrap",
          opacity: stamp * (1 - 0.5 * strike),
        }}
      >
        {ghost ? "starts at 0:41" : "starts at 0:03"}
        <div
          style={{
            position: "absolute",
            left: -4,
            top: "50%",
            height: 4,
            width: `${strike * 104}%`,
            borderRadius: 2,
            background: COLORS.danger,
          }}
        />
      </div>
    </div>
  );
};

// Wide chip: [ f1 | f2 | Δt ] → hash. Origin = chip's left edge.
const SLOT_W = 96;
const SLOT_CX = [54, 150, 246];
const CHIP_W = 580;
const HASH_CX = 480;

const chipLeft = (index: number, frame: number, fps: number) => {
  const { span } = zoomInfo();
  const z = zoomAmount(frame, fps);
  const A = toScreen(peakPosition(getGeometry().anchor), z);
  return A.x + span / 2 - CHIP_W / 2 + (index === 1 ? SHIFT : 0);
};

const FingerprintChip: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = index === 0 ? T.chip : T.same + 0.1;
  const { anchor, partner } = getGeometry();
  const z = zoomAmount(frame, fps);
  const out = overlayOut(frame, fps);
  if (frame < start * fps || z <= 0) return null;

  const dx = index === 1 ? SHIFT : 0;
  const A = toScreen(peakPosition(anchor), z);
  const P = toScreen(peakPosition(partner), z);
  const sources = [
    { x: A.x + dx, y: A.y + BADGE_DY, text: "f1" },
    { x: P.x + dx, y: P.y + BADGE_DY, text: "f2" },
    { x: (A.x + P.x) / 2 + dx, y: AXIS_Y + 64, text: "Δt" },
  ];
  const left = chipLeft(index, frame, fps);
  const box = interpolate(frame, [(start + 0.45) * fps, (start + 0.75) * fps], [0, 1], clamp);
  const hash = spring({ frame: frame - (start + 0.75) * fps, fps, config: { damping: 12 } });
  const ok = spring({ frame: frame - (T.same + 1.9) * fps, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <div
        style={{
          position: "absolute",
          left,
          top: CHIP_Y - 42,
          width: SLOT_W * 3 + 12,
          height: 84,
          borderRadius: 18,
          border: `3px solid ${COLORS.accentLight}`,
          background: "rgba(15,30,66,0.85)",
          boxShadow: `0 0 20px ${COLORS.accent}`,
          opacity: box,
          boxSizing: "border-box",
        }}
      >
        {[1, 2].map((d) => (
          <div
            key={d}
            style={{
              position: "absolute",
              left: SLOT_W * d + 3,
              top: 14,
              width: 3,
              height: 50,
              background: COLORS.textDim,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      {sources.map((s, k) => {
        const fly = interpolate(
          frame,
          [(start + k * 0.12) * fps, (start + k * 0.12 + 0.5) * fps],
          [0, 1],
          { ...clamp, easing: ease },
        );
        return (
          <div
            key={s.text}
            style={{
              position: "absolute",
              left: interpolate(fly, [0, 1], [s.x, left + SLOT_CX[k]]),
              top: interpolate(fly, [0, 1], [s.y, CHIP_Y]),
              translate: "-50% -50%",
              fontFamily: FONT,
              fontSize: 36,
              color: COLORS.text,
              padding: "6px 18px",
              borderRadius: 14,
              background: COLORS.card,
              border: `3px solid ${fly < 1 ? COLORS.accentLight : "transparent"}`,
              whiteSpace: "nowrap",
            }}
          >
            {s.text}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: left + 345,
          top: CHIP_Y,
          translate: "-50% -50%",
          fontFamily: FONT,
          fontSize: 54,
          color: COLORS.text,
          opacity: hash,
        }}
      >
        →
      </div>
      <HashChip
        label={MAIN_HASH}
        glow={ok}
        style={{
          left: left + HASH_CX - HASH_CHIP.width / 2,
          top: CHIP_Y - HASH_CHIP.height / 2,
          opacity: hash,
          scale: String(interpolate(hash, [0, 1], [0.5, 1])),
          borderColor: ok > 0.5 ? COLORS.success : COLORS.accentLight,
        }}
      />
    </div>
  );
};

const Verdict: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eq = spring({ frame: frame - (T.same + 1.4) * fps, fps, config: { damping: 14 } });
  const ok = spring({ frame: frame - (T.same + 1.9) * fps, fps, config: { damping: 10 } });
  const out = overlayOut(frame, fps);
  if (eq <= 0 || zoomAmount(frame, fps) <= 0) return null;
  const left0 = chipLeft(0, frame, fps);
  const left1 = chipLeft(1, frame, fps);
  const eqX = (left0 + CHIP_W + left1) / 2;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <div
        style={{
          position: "absolute",
          left: eqX,
          top: CHIP_Y,
          translate: "-50% -50%",
          scale: String(eq),
          fontFamily: FONT,
          fontSize: 80,
          color: COLORS.success,
        }}
      >
        =
      </div>
      <div
        style={{
          position: "absolute",
          left: left1 + CHIP_W + 70,
          top: CHIP_Y,
          translate: "-50% -50%",
          width: 92,
          height: 92,
          borderRadius: 46,
          background: COLORS.success,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 58,
          color: "#03150C",
          fontWeight: 900,
          scale: String(ok),
          boxShadow: `0 0 30px ${COLORS.success}`,
        }}
      >
        ✓
      </div>
      <div
        style={{
          position: "absolute",
          top: CHIP_Y + 70,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 44,
          color: COLORS.success,
          opacity: ok,
        }}
      >
        Same fingerprint, any start time
      </div>
    </div>
  );
};

const HashStack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { bursts } = getGeometry();
  const stack = getHashStack();
  const header = spring({ frame: frame - (T.every + 0.2) * fps, fps, config: { damping: 200 } });

  // Chip 0 flies from the zoomed fingerprint chip to the top of the stack
  const fly0 = interpolate(frame, [T.zoomOut * fps, (T.zoomOut + 0.8) * fps], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const z = zoomAmount(frame, fps);
  const zoomedLeft = chipLeft(0, T.zoomOut * fps, fps);
  const src0 = { x: zoomedLeft + HASH_CX - HASH_CHIP.width / 2, y: CHIP_Y - HASH_CHIP.height / 2 };

  const chips: React.ReactNode[] = [];
  if (t >= T.zoomOut) {
    chips.push(
      <HashChip
        key="c0"
        label={stack[0].label}
        style={{
          left: interpolate(fly0, [0, 1], [src0.x, stack[0].x]),
          top: interpolate(fly0, [0, 1], [src0.y, stack[0].y]),
          opacity: z > 0 ? 1 - overlayOut(frame, fps) : 1,
        }}
      />,
    );
  }
  bursts.forEach((b, i) => {
    const s = burstStart(i) + 0.2;
    if (t < s) return;
    const fly = interpolate(t, [s, s + 0.6], [0, 1], { ...clamp, easing: ease });
    const pop = spring({ frame: frame - s * fps, fps, config: { damping: 14 } });
    const B = peakPosition(b.anchor);
    const dest = stack[i + 1];
    chips.push(
      <HashChip
        key={`c${i + 1}`}
        label={b.hash}
        style={{
          left: interpolate(fly, [0, 1], [B.x - HASH_CHIP.width / 2, dest.x]),
          top: interpolate(fly, [0, 1], [B.y - HASH_CHIP.height / 2, dest.y]),
          scale: String(interpolate(pop, [0, 1], [0.3, 1])),
        }}
      />,
    );
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: STACK.left,
          width: HASH_CHIP.width,
          top: STACK.top - 62,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 34,
          color: COLORS.textDim,
          opacity: header,
        }}
      >
        fingerprints
      </div>
      {chips}
    </>
  );
};

export const Scene5Fingerprints: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene5.wav")} />
      <NightSky />
      <TargetZone />
      <Links />
      <StarField />
      <TimeAxis />
      <PairLabels ghost={false} />
      <PairLabels ghost />
      <FingerprintChip index={0} />
      <FingerprintChip index={1} />
      <Verdict />
      <HashStack />
      <Caption />
      <Title />
    </AbsoluteFill>
  );
};
