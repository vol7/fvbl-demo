import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { MAP_CA_PEERS, MAP_US, type MapLayout, type Region } from "./map-shapes";
import { MARK_PATH } from "./Mark";
import { fontFamily } from "./theme";

/**
 * One country's map, with its neighbour drawn whole and quieter, and no hub:
 * the ledger is a caption beside the map, not a place on it, and nothing runs
 * to the capitals. `country` picks the map: the US cut's (the states, Canada
 * along the top, Ohio first) or, since 2026-09-30, the Canada cut's inverse
 * (the provinces and territories, the US along the bottom, Ontario first).
 * Two drafts were compared on 2026-09-29; both cuts play `join`. `quiet`
 * stays as the Map-US-Quiet preview.
 *
 * - `quiet`: the states ripple out from the border as in MapScene, then every
 *   state pulses in time with the ledger's mark. The only line is the flag,
 *   hopping across Lake Erie from Ohio to Ontario and back.
 * - `join`: Ohio (Ontario) lights first, then the other states (provinces)
 *   join one by one at an uneven pace, so it reads as each choosing to, not a
 *   national switch-on. The neighbour comes on last, as the partner across
 *   the border. Each region's records streak into the ledger as it joins.
 *   When the first region raises the flag, it streaks in and back out to
 *   every region on the ledger, each flashing coral as it lands. The
 *   neighbour's streak lands across the border (Lake Erie in the US cut,
 *   Pennsylvania in Canada's), with no flash.
 *   Streaks fade as they land: no standing wiring to a centre.
 *
 * Timed to the map's three voice lines (lines.ts): 10, 110, 332.
 */

const TEAL = "#4fd1b5";
const FLAG = "#f59e8b";
const INK = "#f5f8fb";
const BLUE = "#5aa0d8";

const ease = Easing.bezier(0.2, 0, 0, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const progress = (frame: number, start: number, length = 20) =>
  interpolate(frame, [start, start + length], [0, 1], { ...clamp, easing: ease });

/** A quick rise and a slower fall, peaking `rise` frames after `at`. */
const blip = (frame: number, at: number, rise = 6, fall = 28) =>
  interpolate(frame, [at, at + rise, at + rise + fall], [0, 1, 0], clamp);

const key = (r: Region) => r.country + r.code;

/** A map's cast: its layout, the region that lights first, and its neighbour. */
type Peers = {
  L: MapLayout;
  /** The region that lights first and raises the flag, unnamed. */
  first: Region;
  /** The other country, drawn whole. */
  neighbour: Region;
  /** This country's own regions. */
  home: Region[];
  /** Where the flag lands in the neighbour. */
  across: { x: number; y: number };
};

const peers = (L: MapLayout, first: string): Peers => {
  const neighbour = L.regions.find((r) => r.country === L.neighbour)!;
  const home = L.regions.filter((r) => r.country !== L.neighbour);
  return {
    L,
    first: home.find((r) => r.code === first)!,
    neighbour,
    home,
    across: L.across!,
  };
};

const MAPS = { us: peers(MAP_US, "OH"), ca: peers(MAP_CA_PEERS, "ON") };

/** The mark and its caption, right of the map. */
const CAPTION = { x: 1640, y: 520 };
const MARK = 64;

const FLAG_AT = 336;
/** Frames a streak takes between a region and the ledger. */
const TRAVEL = 32;
/** A streak's length, as a share of its path. */
const TAIL = 0.18;
/** The flag reaches the ledger, then goes back out to every region. */
const FLAG_IN = FLAG_AT + TRAVEL;
/** Where the flag lands in a region: the neighbour's, across the border. */
const target = (P: Peers, r: Region) => (r === P.neighbour ? P.across : r);
/** How long the flag takes to reach a region: farther takes longer, so it sweeps out. */
const outTravel = (P: Peers, r: Region) => {
  const to = target(P, r);
  return Math.round(18 + Math.hypot(CAPTION.x - to.x, CAPTION.y - to.y) / 45);
};
/** When the flag leaves the ledger for a region: staggered, not one burst. */
const outAt = (r: Region) => FLAG_IN + Math.round(random(`out-${r.code}`) * 10);
/** When the flag lands in a region. */
const waveAt = (P: Peers, r: Region) => outAt(r) + outTravel(P, r);
const RETURN_AT = 404;
/** The quiet draft's pulses, through the second voice line. */
const PULSES = [160, 214, 268];

/** When each region lights, per draft. */
function schedule(P: Peers, variant: "quiet" | "join"): Map<string, number> {
  if (variant === "quiet") {
    const order = [...P.L.regions].sort((a, b) => a.border - b.border);
    return new Map(order.map((r, i) => [key(r), 12 + i * 1.5]));
  }
  // The first region, then the rest in a shuffled order that starts slow and
  // speeds up, like each signing on; then the neighbour.
  const rest = P.home.filter((r) => r !== P.first).sort(
    (a, b) => random(`join-${a.code}`) - random(`join-${b.code}`),
  );
  const times = new Map<string, number>([
    [key(P.first), 14],
    [key(P.neighbour), 182],
  ]);
  rest.forEach((r, i) => {
    // Ease-out on the index, with a linear share so it never bunches up: the
    // gaps start at about 7 frames and shrink to about 1.
    const x = i / (rest.length - 1);
    const share = 0.75 * (1 - (1 - x) ** 3) + 0.25 * x;
    const jitter = (random(`jitter-${r.code}`) - 0.5) * 2;
    times.set(key(r), Math.round(30 + share * 140 + jitter));
  });
  return times;
}

/** The flag's hop, bowed up over the lake. */
function hopPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const cx = (from.x + to.x) / 2 + 40;
  const cy = Math.min(from.y, to.y) - 70;
  return `M${from.x} ${from.y}Q${cx} ${cy} ${to.x} ${to.y}`;
}

/** How far along its path a streak is, running past 1 so its tail clears. */
const travel = (frame: number, start: number, length = TRAVEL) =>
  interpolate(frame, [start, start + length], [0, 1 + TAIL], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

/** The path between a region and the ledger, bowed upward. */
function feedPath(from: { x: number; y: number }) {
  const to = CAPTION;
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - Math.hypot(to.x - from.x, to.y - from.y) * 0.18;
  return `M${from.x} ${from.y}Q${cx} ${cy} ${to.x} ${to.y}`;
}

/** A short streak along a region's path: in to the ledger, or `outward` from it. */
const Streak: React.FC<{
  from: { x: number; y: number };
  start: number;
  color: string;
  width: number;
  outward?: boolean;
  length?: number;
}> = ({ from, start, color, width, outward, length }) => {
  const frame = useCurrentFrame();
  const t = travel(frame, start, length);
  if (t <= 0 || t >= 1 + TAIL) return null;
  const head = outward ? 1 - t : t - TAIL;
  const opacity = interpolate(t, [0, 0.12, 1 - 0.12, 1 + TAIL], [0, 1, 1, 0], clamp);
  return (
    <path
      d={feedPath(from)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={`${TAIL} 2`}
      strokeDashoffset={-head}
      strokeOpacity={opacity}
    />
  );
};

const Hop: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  at: number;
}> = ({ from, to, at }) => {
  const frame = useCurrentFrame();
  const draw = progress(frame, at, 26);
  const fade = interpolate(frame, [at + 30, at + 60], [1, 0], clamp);
  if (draw === 0 || fade === 0) return null;
  return (
    <path
      d={hopPath(from, to)}
      fill="none"
      stroke={FLAG}
      strokeWidth={3}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - draw}
      strokeOpacity={fade}
    />
  );
};

/** A landing: a ring that opens where the flag arrives. */
const Landing: React.FC<{ at: { x: number; y: number }; frame: number; from: number }> = ({
  at,
  frame,
  from,
}) => {
  const p = progress(frame, from, 30);
  if (p === 0 || p === 1) return null;
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={6 + 34 * p}
      fill="none"
      stroke={FLAG}
      strokeWidth={2}
      strokeOpacity={1 - p}
    />
  );
};

export const MapPeers: React.FC<{
  variant: "quiet" | "join";
  /** Whose map: the US cut's, or the Canada cut's inverse. */
  country?: "us" | "ca";
  note?: string;
}> = ({ variant, country = "us", note }) => {
  const frame = useCurrentFrame();
  const P = MAPS[country];
  const { L, first: FIRST, across: ACROSS } = P;
  const lightsAt = schedule(P, variant);
  const land = progress(frame, 0, 24);

  // The flag: the first region (Ohio, or Ontario in Canada's map) turns
  // coral as it's raised; the other side receives it.
  const raised = interpolate(frame, [FLAG_AT - 6, FLAG_AT + 6], [0, 1], clamp);
  const landed = FLAG_AT + 26;
  const back = RETURN_AT + 26;
  const pulse = Math.max(...PULSES.map((at) => blip(frame, at, 8, 34)));
  const quietPulse = variant === "quiet" ? pulse : 0;
  // The mark answers each region's records arriving, the pulses, and the flag.
  const joined = variant === "join"
    ? Math.max(0, ...[...lightsAt.values()].map((at) => blip(frame, at + TRAVEL - 4, 3, 14) * 0.5))
    : 0;
  const flagIn =
    variant === "join" ? blip(frame, FLAG_IN - 4, 6, 40) : blip(frame, FLAG_AT + 10, 6, 40);
  const markSwell = Math.max(quietPulse, joined, flagIn);
  const markScale = MARK / 41;

  return (
    <AbsoluteFill style={{ fontFamily, color: INK }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <mask id="peers-water" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <rect width={1920} height={1080} fill="white" />
            {L.lakes.map((l) => (
              <path key={l.name} d={l.d} fill="black" />
            ))}
          </mask>
        </defs>

        <g mask="url(#peers-water)">
          <g opacity={land}>
            {L.regions.map((r) => (
              <path
                key={key(r)}
                d={r.d}
                fill={INK}
                fillOpacity={0.035}
                stroke={INK}
                strokeOpacity={0.16}
                strokeWidth={1}
                strokeLinejoin="round"
              />
            ))}
          </g>
          {L.regions.map((r) => {
            const at = lightsAt.get(key(r))!;
            const p = progress(frame, at, variant === "join" ? 14 : 20);
            const quiet = r.country === L.neighbour;
            // A region that just joined glows a moment brighter; the
            // neighbour, drawn whole, only a little, or it floods the frame.
            const glow =
              variant === "join" ? blip(frame, at, 4, 20) * (quiet ? 0.3 : 1) : 0;
            // The flag passing through, in coral.
            const wave =
              variant === "join" && !quiet && r !== FIRST
                ? blip(frame, waveAt(P, r) - 2, 4, 30) * p
                : 0;
            // Coral over teal mixes to grey, so the teal steps aside for it.
            const under = 1 - wave;
            return (
              <g key={key(r)}>
                <path
                  d={r.d}
                  fill={TEAL}
                  fillOpacity={((quiet ? 0.07 : 0.14) * p + 0.12 * glow) * under}
                  stroke={TEAL}
                  strokeOpacity={Math.min(1, (quiet ? 0.5 : 0.75) * p + 0.25 * glow) * under}
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
                {wave > 0 ? (
                  <path
                    d={r.d}
                    fill={FLAG}
                    fillOpacity={0.3 * wave}
                    stroke={FLAG}
                    strokeOpacity={0.7 * wave}
                    strokeWidth={1}
                    strokeLinejoin="round"
                  />
                ) : null}
              </g>
            );
          })}
          {/* The flag raised in Ohio, and received on the other side. */}
          <path
            d={FIRST.d}
            fill={FLAG}
            fillOpacity={0.5 * raised}
            stroke={FLAG}
            strokeOpacity={raised}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </g>

        <g opacity={land}>
          {L.lakes.map((l) => (
            <path
              key={l.name}
              d={l.d}
              fill="none"
              stroke={TEAL}
              strokeOpacity={0.35 * progress(frame, 12, 24)}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* The quiet draft's pulse: every region, in time with the mark. */}
        {variant === "quiet"
          ? L.regions.map((r) => {
              const lit = progress(frame, lightsAt.get(key(r))!);
              return (
                <circle
                  key={`pulse-${key(r)}`}
                  cx={r.x}
                  cy={r.y}
                  r={2.5 + 5 * pulse}
                  fill={INK}
                  fillOpacity={lit * (0.35 + 0.65 * pulse)}
                />
              );
            })
          : null}

        {/* The quiet draft's flag hops the lake, and comes back. */}
        {variant === "quiet" ? (
          <>
            <Hop from={FIRST} to={ACROSS} at={FLAG_AT} />
            <Landing at={ACROSS} frame={frame} from={landed} />
            <Hop from={ACROSS} to={FIRST} at={RETURN_AT} />
            <Landing at={FIRST} frame={frame} from={back} />
          </>
        ) : (
          <>
            <Landing at={FIRST} frame={frame} from={FLAG_AT} />
          </>
        )}

        {variant === "join" ? (
          <>
            {/* Each region's records, streaking in as it joins. */}
            {L.regions.map((r) => (
              <Streak
                key={`in-${key(r)}`}
                from={r}
                start={lightsAt.get(key(r))!}
                color={INK}
                width={1.25}
              />
            ))}
            {/* The flag: in from Ohio, then out to every region on the ledger. */}
            <Streak from={FIRST} start={FLAG_AT} color={FLAG} width={3} />
            {L.regions
              .filter((r) => r !== FIRST)
              .map((r) => (
                <Streak
                  key={`out-${key(r)}`}
                  from={target(P, r)}
                  start={outAt(r)}
                  length={outTravel(P, r)}
                  color={FLAG}
                  width={1.25}
                  outward
                />
              ))}
          </>
        ) : null}
        {/* The first region goes unnamed: a named state or province lighting
            first would read as one that has signed on, and this is a concept. */}
        <Label x={L.labels.CA.x} y={L.labels.CA.y} p={progress(frame, 32)}>
          CANADA
        </Label>
        <Label x={L.labels.US.x} y={L.labels.US.y} p={progress(frame, 32)}>
          UNITED STATES
        </Label>

        {/* The ledger: a caption beside the map, not a place on it. */}
        <g opacity={progress(frame, 20, 24)}>
          <circle
            cx={CAPTION.x}
            cy={CAPTION.y}
            r={56 + 14 * markSwell}
            fill={BLUE}
            fillOpacity={0.1 + 0.16 * markSwell}
          />
          <path
            d={MARK_PATH}
            fill={INK}
            fillRule="evenodd"
            transform={`translate(${CAPTION.x - (37 * markScale) / 2} ${CAPTION.y - MARK / 2}) scale(${markScale})`}
          />
          <text fontFamily={fontFamily} x={CAPTION.x} y={CAPTION.y + 104} textAnchor="middle" fill={INK} fontSize={26} fontWeight={600} letterSpacing="0.08em">
            FVBL
          </text>
          <text fontFamily={fontFamily} x={CAPTION.x} y={CAPTION.y + 136} textAnchor="middle" fill="rgba(245,248,251,0.65)" fontSize={20} fontWeight={500}>
            One shared ledger
          </text>
        </g>
      </svg>

      {note ? (
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 48,
            maxWidth: 560,
            textAlign: "right",
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.35,
            color: "rgba(245,248,251,0.6)",
            opacity: progress(frame, 52),
          }}
        >
          {note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Label: React.FC<{ x: number; y: number; p: number; children: string }> = ({
  x,
  y,
  p,
  children,
}) => (
  // The font is set on every <text>, not inherited: Studio's in-browser
  // render doesn't carry CSS fonts into SVG, and falls back to a serif.
  <text
    fontFamily={fontFamily}
    x={x}
    y={y}
    textAnchor="middle"
    fill={INK}
    fillOpacity={0.72 * p}
    fontSize={22}
    fontWeight={600}
    letterSpacing="0.2em"
  >
    {children}
  </text>
);
