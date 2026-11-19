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

export const SCENE6_DURATION = 20.5; // seconds (narration is 19.6s)

// Sentence cues (seconds), from silence detection on public/narration/scene6.wav
const T = {
  index: 1.2, // "Now Shazam looks up each fingerprint in a giant index."
  built: 4.0, // "It was built ahead of time,"
  everySong: 5.8, // "by fingerprinting every song in its library."
  instant: 9.0, // "Finding a fingerprint there is instant,"
  dictionary: 11.5, // "like looking up a word in a dictionary."
  songs: 14.2, // "Each one points to the songs that contain it,"
  moment: 17.0, // "and the exact moment it appears in each song."
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------- Data (exported so Scene 7 can reuse the same hits) ----------

export const SONG_COLORS: Record<string, string> = {
  "Midnight Drive": "#FF7A59", // the right song (matches Scene 1's card)
  "Ocean Lights": "#3DDC97",
  "Paper Planes": "#FFB547",
  "Golden Hour": "#B07BFF",
};

export type Hit = { song: string; time: string };

// The index is sorted by hash, like a dictionary.
export const INDEX: { hash: string; hits: Hit[] }[] = [
  {
    hash: "0B4E",
    hits: [
      { song: "Midnight Drive", time: "0:43.0" },
      { song: "Ocean Lights", time: "2:40.1" },
      { song: "Paper Planes", time: "2:11.8" },
    ],
  },
  { hash: "1D90", hits: [{ song: "Golden Hour", time: "1:22.5" }] },
  {
    hash: "3A7F",
    hits: [
      { song: "Midnight Drive", time: "0:42.1" },
      { song: "Ocean Lights", time: "1:05.3" },
    ],
  },
  { hash: "4E21", hits: [{ song: "Paper Planes", time: "0:09.6" }] },
  {
    hash: "5F13",
    hits: [
      { song: "Ocean Lights", time: "0:12.7" },
      { song: "Midnight Drive", time: "0:43.9" },
    ],
  },
  {
    hash: "6C3D",
    hits: [
      { song: "Paper Planes", time: "0:58.7" },
      { song: "Ocean Lights", time: "1:51.4" },
    ],
  },
  { hash: "7B08", hits: [{ song: "Golden Hour", time: "2:03.0" }] },
  { hash: "91C2", hits: [{ song: "Midnight Drive", time: "0:42.6" }] },
  {
    hash: "A8E0",
    hits: [
      { song: "Ocean Lights", time: "0:33.2" },
      { song: "Midnight Drive", time: "0:44.3" },
    ],
  },
  { hash: "C4F6", hits: [{ song: "Ocean Lights", time: "0:51.9" }] },
  {
    hash: "D27A",
    hits: [
      { song: "Golden Hour", time: "0:17.4" },
      { song: "Midnight Drive", time: "0:43.4" },
    ],
  },
  { hash: "E915", hits: [{ song: "Paper Planes", time: "1:30.2" }] },
];

// Fingerprints from your recording (the chips Scene 5 ends with), in order.
export const QUERY = ["3A7F", "91C2", "0B4E", "D27A", "5F13", "A8E0", "6C3D"];

// ---------- Layout ----------

const CHIP_W = 190;
const CHIP_H = 62;
const QUERY_X = 110;
const queryY = (i: number) => 250 + i * 86;
// Where the chips start: a stack at the right edge, where Scene 5 leaves them
const START_X = 1650;

const TABLE_X = 440;
const TABLE_W = 1370;
const ROW_H = 48;
const ROW_GAP = 8;
const TABLE_TOP = 250;
const rowY = (r: number) => TABLE_TOP + r * (ROW_H + ROW_GAP);
const HASH_CELL_W = 150;

const rowOfHash = (hash: string) => INDEX.findIndex((r) => r.hash === hash);

// When each query chip gets looked up (seconds)
const lookupTime = (i: number) =>
  i === 0 ? T.instant : T.dictionary + 0.3 + (i - 1) * 0.28;
const FLIGHT = (i: number) => (i === 0 ? 0.8 : 0.45);

// ---------- Components ----------

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 76,
        color: COLORS.textDim,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [-20, 0])}px`,
      }}
    >
      Step 4: <span style={{ color: COLORS.accentLight }}>Lookup</span>
    </div>
  );
};

const QueryLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const last = QUERY.length - 1;
  const opacity = interpolate(
    frame,
    [
      0.9 * fps,
      1.4 * fps,
      (lookupTime(last) + FLIGHT(last)) * fps,
      (lookupTime(last) + FLIGHT(last) + 0.4) * fps,
    ],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: QUERY_X - 30,
        top: 195,
        width: CHIP_W + 60,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 28,
        color: COLORS.textDim,
        opacity,
      }}
    >
      Your fingerprints
    </div>
  );
};

const QueryChip: React.FC<{ hash: string; i: number }> = ({ hash, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1) Move from Scene 5's stack (right edge) to the query column (left)
  const regroup = interpolate(
    frame,
    [(0.3 + i * 0.07) * fps, (1.5 + i * 0.07) * fps],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  // 2) Fly into its row in the index
  const t0 = lookupTime(i) * fps;
  const fly = interpolate(frame, [t0, t0 + FLIGHT(i) * fps], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const r = rowOfHash(hash);
  const targetX = TABLE_X + 12;
  const targetY = rowY(r) + (ROW_H - CHIP_H) / 2;

  const homeX = interpolate(regroup, [0, 1], [START_X, QUERY_X]);
  const homeY = queryY(i);
  const x = interpolate(fly, [0, 1], [homeX, targetX]);
  const y = interpolate(fly, [0, 1], [homeY, targetY]);
  // Once it lands, the chip dissolves into the row's hash cell
  const landed = interpolate(
    frame,
    [t0 + FLIGHT(i) * fps, t0 + FLIGHT(i) * fps + 6],
    [1, 0],
    clamp,
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CHIP_W,
        height: CHIP_H,
        borderRadius: 14,
        background: COLORS.accent,
        border: `2px solid ${COLORS.accentLight}`,
        boxShadow: `0 0 24px ${COLORS.accent}`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        fontSize: 32,
        color: COLORS.text,
        letterSpacing: 2,
        opacity: landed,
        scale: String(interpolate(fly, [0, 1], [1, 0.8])),
      }}
    >
      #{hash}
    </div>
  );
};

const TableHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.index * fps,
    fps,
    config: { damping: 200 },
  });
  const sub = interpolate(
    frame,
    [T.built * fps, (T.built + 0.5) * fps],
    [0, 1],
    clamp,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: TABLE_X,
        top: 185,
        width: TABLE_W,
        display: "flex",
        alignItems: "baseline",
        gap: 24,
        fontFamily: FONT,
        opacity: enter,
      }}
    >
      <div style={{ fontSize: 40, color: COLORS.text }}>Giant index</div>
      <div style={{ fontSize: 28, color: COLORS.textDim, opacity: sub }}>
        built ahead of time from every song in the library
      </div>
    </div>
  );
};

const HitPill: React.FC<{ hit: Hit; delay: number }> = ({ hit, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const songIn = spring({
    frame: frame - (T.songs + delay) * fps,
    fps,
    config: { damping: 200 },
  });
  const timeIn = interpolate(
    frame,
    [(T.moment + delay) * fps, (T.moment + delay + 0.3) * fps],
    [0, 1],
    clamp,
  );
  const color = SONG_COLORS[hit.song];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 16px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.06)",
        border: `2px solid ${color}`,
        fontFamily: FONT,
        fontSize: 24,
        color: COLORS.text,
        whiteSpace: "nowrap",
        opacity: songIn,
        translate: `${interpolate(songIn, [0, 1], [-20, 0])}px 0px`,
      }}
    >
      <div
        style={{ width: 12, height: 12, borderRadius: 6, background: color }}
      />
      {hit.song}
      <span
        style={{
          color,
          opacity: timeIn,
          marginLeft: interpolate(timeIn, [0, 1], [-8, 4]),
        }}
      >
        @ {hit.time}
      </span>
    </div>
  );
};

const IndexRow: React.FC<{ r: number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const row = INDEX[r];
  const q = QUERY.indexOf(row.hash);
  const isQueried = q >= 0;

  // Rows fill in top to bottom while "built ahead of time" is said
  const build = interpolate(
    frame,
    [(T.built + r * 0.3) * fps, (T.built + r * 0.3 + 0.4) * fps],
    [0, 1],
    clamp,
  );
  // Highlight when the matching chip lands
  const landAt = isQueried ? (lookupTime(q) + FLIGHT(q)) * fps : 1e6;
  const hit = isQueried
    ? spring({ frame: frame - landAt, fps, config: { damping: 15 } })
    : 0;
  const lit = frame >= landAt ? hit : 0;
  // Unqueried rows dim once the lookups start, to focus on the hits
  const dimOthers = isQueried
    ? 1
    : interpolate(
        frame,
        [T.dictionary * fps, (T.dictionary + 0.6) * fps],
        [1, 0.35],
        clamp,
      );

  return (
    <div
      style={{
        position: "absolute",
        left: TABLE_X,
        top: rowY(r),
        width: TABLE_W,
        height: ROW_H,
        borderRadius: 12,
        background: lit > 0 ? "rgba(26,140,255,0.22)" : COLORS.card,
        border: `2px solid ${lit > 0 ? COLORS.accentLight : "#1C2B52"}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingRight: 16,
        opacity: build * dimOthers,
        translate: `${interpolate(build, [0, 1], [40, 0])}px 0px`,
        scale: String(1 + 0.03 * lit * (1 - Math.min(1, (frame - landAt) / 20))),
      }}
    >
      <div
        style={{
          width: HASH_CELL_W,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 28,
          letterSpacing: 2,
          color: lit > 0 ? COLORS.text : COLORS.textDim,
        }}
      >
        #{row.hash}
      </div>
      <div style={{ fontSize: 28, color: COLORS.textDim, fontFamily: FONT }}>
        →
      </div>
      {isQueried ? (
        <div style={{ display: "flex", gap: 12 }}>
          {row.hits.map((h, k) => (
            <HitPill key={k} hit={h} delay={q * 0.12 + k * 0.06} />
          ))}
        </div>
      ) : null}
      {/* Placeholder bars until the songs are revealed (and for unqueried rows) */}
      <PlaceholderBars count={row.hits.length} hide={isQueried} />
    </div>
  );
};

const PlaceholderBars: React.FC<{ count: number; hide: boolean }> = ({
  count,
  hide,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = hide
    ? interpolate(frame, [T.songs * fps, (T.songs + 0.3) * fps], [1, 0], clamp)
    : 1;
  if (opacity === 0) return null;
  return (
    <div
      style={{
        position: hide ? "absolute" : "static",
        left: HASH_CELL_W + 60,
        display: "flex",
        gap: 12,
        opacity,
      }}
    >
      {Array.from({ length: count }).map((_, k) => (
        <div
          key={k}
          style={{
            width: 200,
            height: 18,
            borderRadius: 9,
            background: "#1C2B52",
          }}
        />
      ))}
    </div>
  );
};

const SpeedStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (T.instant + FLIGHT(0) + 0.1) * fps;
  const pop = spring({ frame: frame - at, fps, config: { damping: 10 } });
  const fade = interpolate(
    frame,
    [(T.songs - 0.4) * fps, T.songs * fps],
    [1, 0],
    clamp,
  );
  if (frame < at) return null;
  const r = rowOfHash(QUERY[0]);
  return (
    <div
      style={{
        position: "absolute",
        left: TABLE_X + 520,
        top: rowY(r) - 6,
        padding: "6px 18px",
        borderRadius: 14,
        background: COLORS.success,
        color: COLORS.bgBottom,
        fontFamily: FONT,
        fontSize: 30,
        opacity: pop * fade,
        scale: String(interpolate(pop, [0, 1], [1.5, 1])),
      }}
    >
      found in 0.001s
    </div>
  );
};

// The dictionary analogy, spelled out under the index
const DictionaryHint: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.dictionary * fps,
    fps,
    config: { damping: 200 },
  });
  const fade = interpolate(
    frame,
    [(T.songs - 0.4) * fps, T.songs * fps],
    [1, 0],
    clamp,
  );
  if (frame < T.dictionary * fps) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: TABLE_X,
        top: rowY(INDEX.length) + 14,
        width: TABLE_W,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 34,
        color: COLORS.textDim,
        opacity: enter * fade,
        translate: `0px ${interpolate(enter, [0, 1], [16, 0])}px`,
      }}
    >
      Sorted like a dictionary:{" "}
      <span style={{ color: COLORS.accentLight }}>
        jump straight to the entry, no scanning
      </span>
    </div>
  );
};

export const Scene6Lookup: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene6.wav")} />
      <Title />
      <TableHeader />
      {INDEX.map((_, r) => (
        <IndexRow key={r} r={r} />
      ))}
      <DictionaryHint />
      <SpeedStamp />
      <QueryLabel />
      {QUERY.map((h, i) => (
        <QueryChip key={h} hash={h} i={i} />
      ))}
    </AbsoluteFill>
  );
};
