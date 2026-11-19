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
import { INDEX, QUERY, SONG_COLORS } from "./Scene6Lookup";

export const SCENE7_DURATION = 22.1; // seconds (narration is 21.21s)

// Sentence cues (seconds), from silence detection on public/narration/scene7.wav
const T = {
  share: 0.2, // "Several songs share some of these fingerprints, just by chance."
  timing: 3.9, // "So Shazam checks the timing."
  subtract: 6.1, // "For every match, it subtracts the moment in your recording..."
  example: 8.0, // "...from the moment in the song."
  wrong: 11.1, // "For a wrong song, those offsets are scattered."
  right: 14.4, // "But for the right song, they all line up at the same offset,"
  fortyTwo: 17.8, // "forty-two seconds in."
  answer: 19.7, // "That spike is the answer."
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------- Data (derived from Scene 6's index) ----------

export const RIGHT_SONG = "Midnight Drive";

/** When each of Scene 6's QUERY fingerprints occurs in your recording (s). */
export const QUERY_TIMES = [0.0, 0.5, 0.9, 1.3, 1.8, 2.2, 2.6];

const parseTime = (t: string) => {
  const [m, s] = t.split(":");
  return Number(m) * 60 + Number(s);
};

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
};

export type Match = {
  song: string;
  hash: string;
  query: number; // index into QUERY
  offset: number; // song time − recording time, seconds
  bin: number; // offset rounded to whole seconds
  stack: number; // position in its bin's stack (0 = bottom)
};

let matchesCache: Match[] | null = null;

/** Every index hit for your fingerprints, with its time offset. */
export const getMatches = (): Match[] => {
  if (matchesCache) return matchesCache;
  const stacks = new Map<string, number>();
  const matches: Match[] = [];
  QUERY.forEach((hash, query) => {
    const row = INDEX.find((r) => r.hash === hash);
    if (!row) return;
    for (const hit of row.hits) {
      const offset = parseTime(hit.time) - QUERY_TIMES[query];
      const bin = Math.round(offset);
      const key = `${hit.song}-${bin}`;
      const stack = stacks.get(key) ?? 0;
      stacks.set(key, stack + 1);
      matches.push({ song: hit.song, hash, query, offset, bin, stack });
    }
  });
  matchesCache = matches;
  return matches;
};

const SONGS = Object.keys(SONG_COLORS);
const songMatches = (song: string) => getMatches().filter((m) => m.song === song);

// ---------- Layout ----------

const PANEL_W = 820;
const PANEL_H = 370;
const panelPos = (i: number) => ({
  x: 110 + (i % 2) * (PANEL_W + 60),
  y: 250 + Math.floor(i / 2) * (PANEL_H + 30),
});
const PLOT_LEFT = 40;
const PLOT_W = 740;
const PLOT_TOP = 92;
const PLOT_H = 226;
const MAX_OFFSET = 180; // x-axis covers 0:00 to 3:00
const BLOCK_H = 32;
const BLOCK_GAP = 4;
const BLOCK_W = 16;

const offsetX = (sec: number) => PLOT_LEFT + (sec / MAX_OFFSET) * PLOT_W;

// When each block drops into its histogram (seconds)
const dropTime = (m: Match) => {
  if (m.song === RIGHT_SONG) {
    return T.right + 0.3 + m.query * 0.45;
  }
  const wrong = getMatches().filter((x) => x.song !== RIGHT_SONG);
  return T.wrong + 0.2 + wrong.indexOf(m) * 0.2;
};

// ---------- Components ----------

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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
      {/* Scene 6's title, same position and style, handing over */}
      <div style={{ ...base, opacity: 1 - out, translate: `0px ${-30 * out}px` }}>
        Step 4:{" "}
        <span style={{ color: COLORS.accentLight }}>Hash table lookup</span>
      </div>
      <div
        style={{
          ...base,
          opacity: enter,
          translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
        }}
      >
        Step 5: <span style={{ color: COLORS.accentLight }}>Line up in time</span>
      </div>
    </>
  );
};

const Formula: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.subtract * fps, fps, config: { damping: 200 } });
  const example = spring({ frame: frame - T.example * fps, fps, config: { damping: 200 } });

  // A worked example from the right song (Scene 6's #91C2 hit)
  const q = QUERY.indexOf("91C2");
  const songTime = INDEX.find((r) => r.hash === "91C2")?.hits.find(
    (h) => h.song === RIGHT_SONG,
  )?.time;

  return (
    <div
      style={{
        position: "absolute",
        top: 172,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        gap: 40,
        fontFamily: FONT,
        fontSize: 36,
        color: COLORS.text,
        opacity: enter,
        translate: `0px ${interpolate(enter, [0, 1], [20, 0])}px`,
      }}
    >
      <div>
        <span style={{ color: COLORS.accentLight }}>offset</span> = time in song −
        time in recording
      </div>
      {songTime ? (
        <div
          style={{
            color: SONG_COLORS[RIGHT_SONG],
            opacity: example,
            translate: `${interpolate(example, [0, 1], [-20, 0])}px 0px`,
          }}
        >
          e.g. {songTime} − {formatTime(QUERY_TIMES[q])} ={" "}
          {formatTime(parseTime(songTime) - QUERY_TIMES[q])}
        </div>
      ) : null}
    </div>
  );
};

const MatchBlock: React.FC<{ m: Match; color: string }> = ({ m, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = dropTime(m) * fps;
  const drop = spring({ frame: frame - at, fps, config: { damping: 14 } });
  if (frame < at) return null;

  const x = offsetX(m.bin) - BLOCK_W / 2;
  const bottom = PANEL_H - (PLOT_TOP + PLOT_H) + m.stack * (BLOCK_H + BLOCK_GAP);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom,
        width: BLOCK_W,
        height: BLOCK_H,
        borderRadius: 5,
        background: color,
        boxShadow: `0 0 12px ${color}`,
        opacity: drop,
        translate: `0px ${interpolate(drop, [0, 1], [-120, 0])}px`,
      }}
    />
  );
};

const Axes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [T.timing * fps, (T.timing + 0.8) * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const labels = interpolate(
    frame,
    [(T.timing + 0.4) * fps, (T.timing + 0.9) * fps],
    [0, 1],
    clamp,
  );
  const baseline = PLOT_TOP + PLOT_H;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: PLOT_LEFT,
          top: baseline,
          width: PLOT_W * draw,
          height: 3,
          borderRadius: 2,
          background: COLORS.textDim,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PLOT_LEFT,
          top: baseline - PLOT_H * draw,
          width: 3,
          height: PLOT_H * draw,
          borderRadius: 2,
          background: COLORS.textDim,
        }}
      />
      <div style={{ opacity: labels }}>
        {[0, MAX_OFFSET].map((sec) => (
          <div
            key={sec}
            style={{
              position: "absolute",
              left: offsetX(sec),
              top: baseline + 8,
              translate: "-50% 0px",
              fontFamily: FONT,
              fontSize: 20,
              color: COLORS.textDim,
            }}
          >
            {sec / 60}:00
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: PLOT_LEFT + 14,
            top: PLOT_TOP - 6,
            fontFamily: FONT,
            fontSize: 22,
            color: COLORS.textDim,
          }}
        >
          matches ↑
        </div>
        <div
          style={{
            position: "absolute",
            left: PLOT_LEFT,
            width: PLOT_W,
            textAlign: "center",
            top: baseline + 8,
            fontFamily: FONT,
            fontSize: 22,
            color: COLORS.textDim,
          }}
        >
          time offset →
        </div>
      </div>
    </>
  );
};

// Tally of matches per song, counting up as the panels appear
const MatchCount: React.FC<{ song: string; i: number }> = ({ song, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = songMatches(song).length;
  const shown = Math.round(
    interpolate(
      frame,
      [(T.share + 0.6 + i * 0.3) * fps, (T.share + 1.8 + i * 0.3) * fps],
      [0, total],
      clamp,
    ),
  );
  return (
    <div
      style={{
        padding: "4px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        fontSize: 26,
        color: COLORS.text,
      }}
    >
      {shown} {total === 1 ? "match" : "matches"}
    </div>
  );
};

const SpikeLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.fortyTwo * fps, fps, config: { damping: 12 } });
  const right = songMatches(RIGHT_SONG);
  if (frame < T.fortyTwo * fps || right.length === 0) return null;
  const height = right.length * (BLOCK_H + BLOCK_GAP);
  const offset = right[0].offset;

  return (
    <div
      style={{
        position: "absolute",
        left: offsetX(right[0].bin) + 24,
        top: PLOT_TOP + PLOT_H - height + 4,
        fontFamily: FONT,
        fontSize: 34,
        color: SONG_COLORS[RIGHT_SONG],
        whiteSpace: "nowrap",
        opacity: enter,
        translate: `${interpolate(enter, [0, 1], [-20, 0])}px 0px`,
      }}
    >
      ← all at {formatTime(offset)}
    </div>
  );
};

const SongPanel: React.FC<{ song: string; i: number }> = ({ song, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y } = panelPos(i);
  const color = SONG_COLORS[song];
  const isRight = song === RIGHT_SONG;
  const enter = spring({
    frame: frame - (T.share + 0.3 + i * 0.3) * fps,
    fps,
    config: { damping: 200 },
  });
  const answer = spring({ frame: frame - T.answer * fps, fps, config: { damping: 12 } });
  const dim = isRight
    ? 1
    : interpolate(frame, [T.answer * fps, (T.answer + 0.5) * fps], [1, 0.4], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: PANEL_W,
        height: PANEL_H,
        borderRadius: 24,
        background: COLORS.card,
        border: `${isRight ? 2 + 2 * answer : 2}px solid ${
          isRight && frame >= T.answer * fps ? COLORS.success : "#1C2B52"
        }`,
        boxShadow: isRight ? `0 0 ${50 * answer}px ${COLORS.success}` : "none",
        fontFamily: FONT,
        opacity: enter * dim,
        translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
        scale: String(isRight ? 1 + 0.03 * answer : 1),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          top: 20,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ width: 18, height: 18, borderRadius: 9, background: color }} />
        <div style={{ fontSize: 36, color: COLORS.text, flex: 1 }}>{song}</div>
        {isRight ? (
          <div
            style={{
              fontSize: 34,
              color: COLORS.success,
              opacity: answer,
              scale: String(interpolate(answer, [0, 1], [0.5, 1])),
            }}
          >
            ✓ Match
          </div>
        ) : null}
        <MatchCount song={song} i={i} />
      </div>
      <Axes />
      {songMatches(song).map((m) => (
        <MatchBlock key={`${m.hash}-${m.offset}`} m={m} color={color} />
      ))}
      {isRight ? <SpikeLabel /> : null}
    </div>
  );
};

export const Scene7Alignment: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      <Audio src={staticFile("narration/scene7.wav")} />
      <Title />
      <Formula />
      {SONGS.map((song, i) => (
        <SongPanel key={song} song={song} i={i} />
      ))}
    </AbsoluteFill>
  );
};
