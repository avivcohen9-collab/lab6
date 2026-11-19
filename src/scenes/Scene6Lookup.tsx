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

export const SCENE6_DURATION = 27; // seconds (narration is 26.2s)

// Phrase cues (seconds), from silence detection on public/narration/scene6.wav
const T = {
  table: 0.8, // "Now Shazam looks up each fingerprint in a hash table,"
  built: 3.3, // "built ahead of time from every song in its library."
  key: 6.6, // "The fingerprint is the key."
  hashFn: 8.4, // "A hash function maps the key straight to a bucket,"
  constant: 11.3, // "so each lookup takes constant time,"
  o1: 13.8, // "O of one,"
  oN: 14.6, // "instead of scanning millions of songs, which is O of n."
  value: 18.7, // "The value stored in each bucket is a list of pairs:"
  songs: 22.2, // "a song that contains this fingerprint,"
  times: 24.4, // "and the time it appears in that song."
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

// A hash table: the row index IS the bucket number that h(key) points to.
// Keys are scattered, not sorted (that's the point of hashing).
export const INDEX: { hash: string; hits: Hit[] }[] = [
  { hash: "91C2", hits: [{ song: "Midnight Drive", time: "0:42.6" }] },
  { hash: "E915", hits: [{ song: "Paper Planes", time: "1:30.2" }] },
  {
    hash: "3A7F",
    hits: [
      { song: "Midnight Drive", time: "0:42.1" },
      { song: "Ocean Lights", time: "1:05.3" },
    ],
  },
  { hash: "4E21", hits: [{ song: "Paper Planes", time: "0:09.6" }] },
  {
    hash: "A8E0",
    hits: [
      { song: "Ocean Lights", time: "0:33.2" },
      { song: "Midnight Drive", time: "0:44.3" },
    ],
  },
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
    hash: "D27A",
    hits: [
      { song: "Golden Hour", time: "0:17.4" },
      { song: "Midnight Drive", time: "0:43.4" },
    ],
  },
  { hash: "C4F6", hits: [{ song: "Ocean Lights", time: "0:51.9" }] },
  {
    hash: "5F13",
    hits: [
      { song: "Ocean Lights", time: "0:12.7" },
      { song: "Midnight Drive", time: "0:43.9" },
    ],
  },
  { hash: "7B08", hits: [{ song: "Golden Hour", time: "2:03.0" }] },
  {
    hash: "6C3D",
    hits: [
      { song: "Paper Planes", time: "0:58.7" },
      { song: "Ocean Lights", time: "1:51.4" },
    ],
  },
];

// Fingerprints from your recording (the chips Scene 5 ends with), in order.
export const QUERY = ["3A7F", "91C2", "0B4E", "D27A", "5F13", "A8E0", "6C3D"];

const bucketOf = (hash: string) => INDEX.findIndex((r) => r.hash === hash);

// ---------- Layout ----------

const CHIP_W = 170;
const CHIP_H = 58;
const QUERY_X = 70;
const queryY = (i: number) => 260 + i * 86;
// Where the chips start: a stack at the right edge, where Scene 5 leaves them
const START_X = 1650;
const START_W = 190;
const startY = (i: number) => 250 + i * 86;

const BOX_X = 285;
const BOX_W = 200;
const BOX_H = 130;
const BOX_Y = 520;

const TABLE_X = 530;
const TABLE_W = 1320;
const ROW_H = 48;
const ROW_GAP = 8;
const TABLE_TOP = 255;
const rowY = (r: number) => TABLE_TOP + r * (ROW_H + ROW_GAP);
const BUCKET_W = 70;
const KEY_W = 140;

// Lookup schedule: when each chip leaves the column, and how long it takes
const lookupTime = (i: number) =>
  i === 0 ? T.hashFn + 0.2 : T.constant + 0.1 + (i - 1) * 0.45;
const DURATION = (i: number) => (i === 0 ? 2.2 : 0.75);
const landTime = (i: number) => lookupTime(i) + DURATION(i);

// ---------- Components ----------

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 45,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 70,
        color: COLORS.textDim,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [-20, 0])}px`,
      }}
    >
      Step 4:{" "}
      <span style={{ color: COLORS.accentLight }}>Hash table lookup</span>
    </div>
  );
};

const QueryLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const last = QUERY.length - 1;
  const opacity = interpolate(
    frame,
    [0.9 * fps, 1.4 * fps, landTime(last) * fps, (landTime(last) + 0.4) * fps],
    [0, 1, 1, 0],
    clamp,
  );
  const keyIn = spring({
    frame: frame - T.key * fps,
    fps,
    config: { damping: 12 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: QUERY_X - 40,
        top: 175,
        width: CHIP_W + 80,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 28,
        lineHeight: 1.2,
        color: COLORS.textDim,
        opacity,
      }}
    >
      Your fingerprints
      <div
        style={{
          color: COLORS.accentLight,
          fontSize: 34,
          opacity: frame >= T.key * fps ? keyIn : 0,
          scale: String(interpolate(keyIn, [0, 1], [1.4, 1])),
        }}
      >
        = keys
      </div>
    </div>
  );
};

const QueryChip: React.FC<{ hash: string; i: number }> = ({ hash, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1) Move from Scene 5's stack (right edge) to the key column (left)
  const regroup = interpolate(
    frame,
    [(0.3 + i * 0.07) * fps, (1.5 + i * 0.07) * fps],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  // 2) Into the hash function box, pause, then straight to its bucket
  const t0 = lookupTime(i) * fps;
  const d = DURATION(i) * fps;
  const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const toBox = interpolate(frame, [t0, t0 + d * 0.35], [0, 1], ease);
  const toRow = interpolate(frame, [t0 + d * 0.6, t0 + d], [0, 1], ease);

  const b = bucketOf(hash);
  const homeX = interpolate(regroup, [0, 1], [START_X, QUERY_X]);
  const homeY = interpolate(regroup, [0, 1], [startY(i), queryY(i)]);
  const boxX = BOX_X + (BOX_W - CHIP_W) / 2;
  const boxY = BOX_Y + BOX_H + 14;
  const rowX = TABLE_X + BUCKET_W + 4;
  const rowYY = rowY(b) + (ROW_H - CHIP_H) / 2;

  const x =
    toRow > 0
      ? interpolate(toRow, [0, 1], [boxX, rowX])
      : interpolate(toBox, [0, 1], [homeX, boxX]);
  const y =
    toRow > 0
      ? interpolate(toRow, [0, 1], [boxY, rowYY])
      : interpolate(toBox, [0, 1], [homeY, boxY]);
  // The chip dissolves into the bucket's key cell when it lands
  const landed = interpolate(frame, [t0 + d, t0 + d + 6], [1, 0], clamp);
  const isFirst = i === 0;
  const keyGlow =
    isFirst && frame >= T.key * fps && frame < t0
      ? 0.5 + 0.5 * Math.sin((frame - T.key * fps) / 4)
      : 0;
  const width = interpolate(regroup, [0, 1], [START_W, CHIP_W]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: CHIP_H,
        borderRadius: 14,
        background: COLORS.accent,
        border: `2px solid ${COLORS.accentLight}`,
        boxShadow: `0 0 ${24 + 30 * keyGlow}px ${COLORS.accent}`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        fontSize: 30,
        color: COLORS.text,
        letterSpacing: 2,
        opacity: landed,
      }}
    >
      #{hash}
    </div>
  );
};

const HashFunctionBox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.hashFn * fps,
    fps,
    config: { damping: 14 },
  });
  const last = QUERY.length - 1;
  const fade = interpolate(
    frame,
    [(landTime(last) + 0.3) * fps, (landTime(last) + 0.8) * fps],
    [1, 0],
    clamp,
  );
  if (frame < T.hashFn * fps) return null;

  // Which chip is currently being hashed, and its output bucket
  let current = -1;
  QUERY.forEach((_, i) => {
    const t0 = lookupTime(i) * fps;
    const d = DURATION(i) * fps;
    if (frame >= t0 + d * 0.3 && frame < t0 + d * 0.75) current = i;
  });
  const out = current >= 0 ? bucketOf(QUERY[current]) : null;

  return (
    <div
      style={{
        position: "absolute",
        left: BOX_X,
        top: BOX_Y,
        width: BOX_W,
        height: BOX_H,
        borderRadius: 20,
        background: COLORS.card,
        border: `3px solid ${current >= 0 ? COLORS.accentLight : COLORS.accent}`,
        boxShadow: current >= 0 ? `0 0 30px ${COLORS.accent}` : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        color: COLORS.text,
        opacity: enter * fade,
        scale: String(interpolate(enter, [0, 1], [0.6, 1])),
      }}
    >
      <div style={{ fontSize: 22, color: COLORS.textDim }}>hash function</div>
      <div style={{ fontSize: 40 }}>h(key)</div>
      <div
        style={{
          fontSize: 30,
          color: COLORS.success,
          height: 36,
          opacity: out === null ? 0 : 1,
        }}
      >
        → bucket {out ?? ""}
      </div>
    </div>
  );
};

const TableHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.table * fps,
    fps,
    config: { damping: 200 },
  });
  const sub = interpolate(
    frame,
    [T.built * fps, (T.built + 0.5) * fps],
    [0, 1],
    clamp,
  );
  const colKey = interpolate(
    frame,
    [T.key * fps, (T.key + 0.4) * fps],
    [0, 1],
    clamp,
  );
  const colBucket = interpolate(
    frame,
    [T.hashFn * fps, (T.hashFn + 0.4) * fps],
    [0, 1],
    clamp,
  );
  const colValue = interpolate(
    frame,
    [T.value * fps, (T.value + 0.4) * fps],
    [0, 1],
    clamp,
  );
  const colStyle: React.CSSProperties = {
    position: "absolute",
    top: 52,
    fontSize: 24,
    color: COLORS.accentLight,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: TABLE_X,
        top: 150,
        width: TABLE_W,
        height: 90,
        fontFamily: FONT,
        opacity: enter,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <div style={{ fontSize: 40, color: COLORS.text }}>Hash table</div>
        <div style={{ fontSize: 26, color: COLORS.textDim, opacity: sub }}>
          built ahead of time from every song in the library
        </div>
      </div>
      <div
        style={{
          ...colStyle,
          left: 0,
          width: BUCKET_W,
          textAlign: "center",
          opacity: colBucket,
        }}
      >
        bucket
      </div>
      <div
        style={{
          ...colStyle,
          left: BUCKET_W + 4,
          width: KEY_W,
          textAlign: "center",
          opacity: colKey,
        }}
      >
        key
      </div>
      <div
        style={{ ...colStyle, left: BUCKET_W + KEY_W + 60, opacity: colValue }}
      >
        value = list of (song, time) pairs
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
    [(T.times + delay) * fps, (T.times + delay + 0.3) * fps],
    [0, 1],
    clamp,
  );
  const color = SONG_COLORS[hit.song];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.06)",
        border: `2px solid ${color}`,
        fontFamily: FONT,
        fontSize: 22,
        color: COLORS.text,
        whiteSpace: "nowrap",
        opacity: songIn,
        translate: `${interpolate(songIn, [0, 1], [-20, 0])}px 0px`,
      }}
    >
      ({" "}
      <div
        style={{ width: 11, height: 11, borderRadius: 6, background: color }}
      />
      {hit.song}
      <span style={{ color, opacity: timeIn }}>, {hit.time}</span> )
    </div>
  );
};

const PlaceholderBars: React.FC<{ count: number; hideAt: number | null }> = ({
  count,
  hideAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity =
    hideAt === null
      ? 1
      : interpolate(frame, [hideAt * fps, (hideAt + 0.3) * fps], [1, 0], clamp);
  if (opacity === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: BUCKET_W + KEY_W + 60,
        display: "flex",
        gap: 12,
        opacity,
      }}
    >
      {Array.from({ length: count }).map((_, k) => (
        <div
          key={k}
          style={{
            width: 220,
            height: 18,
            borderRadius: 9,
            background: "#1C2B52",
          }}
        />
      ))}
    </div>
  );
};

const BucketRow: React.FC<{ r: number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const row = INDEX[r];
  const q = QUERY.indexOf(row.hash);
  const isQueried = q >= 0;

  // Buckets fill in while "built ahead of time" is said
  const build = interpolate(
    frame,
    [(T.table + 0.3 + r * 0.38) * fps, (T.table + 0.3 + r * 0.38 + 0.4) * fps],
    [0, 1],
    clamp,
  );
  // Light up when its key lands
  const landAt = isQueried ? landTime(q) * fps : 1e6;
  const hit = isQueried
    ? spring({ frame: frame - landAt, fps, config: { damping: 15 } })
    : 0;
  const lit = frame >= landAt ? hit : 0;
  // Buckets nobody asked for dim once lookups start
  const dimOthers = isQueried
    ? 1
    : interpolate(
        frame,
        [T.constant * fps, (T.constant + 0.6) * fps],
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
        opacity: build * dimOthers,
        translate: `${interpolate(build, [0, 1], [40, 0])}px 0px`,
      }}
    >
      <div
        style={{
          width: BUCKET_W,
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRight: "2px solid #1C2B52",
          fontFamily: FONT,
          fontSize: 24,
          color: lit > 0 ? COLORS.success : COLORS.textDim,
        }}
      >
        [{r}]
      </div>
      <div
        style={{
          width: KEY_W,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 26,
          letterSpacing: 2,
          color: lit > 0 ? COLORS.text : COLORS.textDim,
        }}
      >
        #{row.hash}
      </div>
      <div
        style={{
          width: 50,
          fontSize: 26,
          color: COLORS.textDim,
          fontFamily: FONT,
        }}
      >
        →
      </div>
      {isQueried ? (
        <div style={{ display: "flex", gap: 10 }}>
          {row.hits.map((h, k) => (
            <HitPill key={k} hit={h} delay={q * 0.12 + k * 0.06} />
          ))}
        </div>
      ) : null}
      <PlaceholderBars
        count={row.hits.length}
        hideAt={isQueried ? T.songs : null}
      />
    </div>
  );
};

// Big-O comparison: O(1) hash lookup vs O(n) linear scan
const Complexity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o1 = spring({
    frame: frame - T.o1 * fps,
    fps,
    config: { damping: 12 },
  });
  const oN = spring({
    frame: frame - T.oN * fps,
    fps,
    config: { damping: 12 },
  });
  const strike = interpolate(
    frame,
    [(T.oN + 1.4) * fps, (T.oN + 1.9) * fps],
    [0, 1],
    clamp,
  );
  if (frame < T.o1 * fps) return null;

  const pill: React.CSSProperties = {
    position: "relative",
    padding: "8px 26px",
    borderRadius: 16,
    fontFamily: FONT,
    fontSize: 34,
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: TABLE_X,
        top: rowY(INDEX.length) + 12,
        width: TABLE_W,
        display: "flex",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          ...pill,
          background: "rgba(61,220,151,0.15)",
          border: `2px solid ${COLORS.success}`,
          color: COLORS.success,
          opacity: o1,
          scale: String(interpolate(o1, [0, 1], [1.4, 1])),
        }}
      >
        hash lookup: O(1) per key
      </div>
      <div
        style={{
          ...pill,
          background: "rgba(255,90,110,0.12)",
          border: `2px solid ${COLORS.danger}`,
          color: COLORS.danger,
          opacity: frame >= T.oN * fps ? oN : 0,
          scale: String(interpolate(oN, [0, 1], [1.4, 1])),
        }}
      >
        scan every song: O(n)
        <div
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            height: 4,
            borderRadius: 2,
            width: `calc(${strike * 100}% - 32px)`,
            background: COLORS.danger,
          }}
        />
      </div>
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
        <BucketRow key={r} r={r} />
      ))}
      <Complexity />
      <HashFunctionBox />
      <QueryLabel />
      {QUERY.map((h, i) => (
        <QueryChip key={h} hash={h} i={i} />
      ))}
    </AbsoluteFill>
  );
};
