import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useAudience } from "./audience";
import { MAP_CA, MAP_US, type MapLayout, type Region } from "./map-shapes";
import { MARK_PATH } from "./Mark";
import { fontFamily } from "./theme";

/**
 * The closing vision, drawn as the real map, with the big lakes as water
 * (shapes from map-shapes.ts). Each version draws its own country in full and
 * the other as a neighbour: the US-first map is the usual US map, with Canada
 * drawn whole along the top, so the two read as partners, not one bloc. The ledger, drawn as the FVBL mark to call back the title
 * cards, sits off the coast in neither country, so both read as partners in
 * it. Neither country goes first: the states and the provinces light
 * together, rippling out from the border, and one arc ties each country's
 * capital to the ledger, from a dot on the city. Then every region's records pulse in, each a short streak along
 * its own path. Then a flag goes in from each side of the border and out to
 * every region, each landing on the other side: a flag on one side shows up
 * on the other, whichever side the audience is on. Timed to the map's three
 * voice lines (lines.ts).
 */

const BLUE = "#5aa0d8";
const TEAL = "#4fd1b5";
const FLAG = "#f59e8b";
const INK = "#f5f8fb";

const LAYOUTS = { ca: MAP_CA, us: MAP_US };

type Point = { x: number; y: number };

/** The mark's height on the map, in pixels; its viewBox is 37 × 41. */
const MARK = 72;

/**
 * A layout's regions, nearest the border first, so both sides ripple out
 * from it, and the two it sends a flag from, one each side, each landing on
 * the other: Ontario (or Canada, drawn whole) and Ohio, the US version's
 * example state.
 */
function arrange(layout: MapLayout) {
  const regions = [...layout.regions].sort((a, b) => a.border - b.border);
  const crossing = layout.crossing.map(
    (key) => regions.find((r) => `${r.country}-${r.code}` === key)!,
  );
  return { regions, crossing };
}

function gap(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Frame each beat starts on. */
const AT = {
  land: 0,
  join: 12,
  arcs: 30,
  gather: 190,
  flag: 336,
  spread: 384,
};
/** Frames between one region lighting, or pulsing in, and the next. */
const RIPPLE = 1.5;
const STAGGER = 0.5;
const TRAVEL = 44;
/** A streak's length, as a share of its path. */
const TAIL = 0.16;

const ease = Easing.bezier(0.2, 0, 0, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function progress(frame: number, start: number, length = 20): number {
  return interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: ease,
  });
}

/** How far along its path a streak is, running past 1 so its tail clears. */
function travel(frame: number, start: number): number {
  return interpolate(frame, [start, start + TRAVEL], [0, 1 + TAIL], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
}

/** The arc's bend: a point off the chord's midpoint, bowed upward. */
function control(r: Point, hub: Point) {
  return {
    x: (r.x + hub.x) / 2,
    y: (r.y + hub.y) / 2 - gap(r, hub) * 0.22,
  };
}

const arcPath = (r: Point, hub: Point) => {
  const c = control(r, hub);
  return `M${r.x} ${r.y}Q${c.x} ${c.y} ${hub.x} ${hub.y}`;
};

/** One country's arc to the ledger, drawing in. */
const Arc: React.FC<{ from: Point; hub: Point; p: number }> = ({
  from,
  hub,
  p,
}) => (
  <path
    d={arcPath(from, hub)}
    fill="none"
    stroke={TEAL}
    strokeWidth={1.5}
    strokeOpacity={0.55}
    strokeLinecap="round"
    pathLength={1}
    strokeDasharray="1 1"
    strokeDashoffset={1 - p}
  />
);

/**
 * A short streak along a region's path. `t` is where its head is, 0 at the
 * region and 1 at the ledger; `outward` runs it the other way.
 */
const Streak: React.FC<{
  region: Region;
  hub: Point;
  t: number;
  color: string;
  width: number;
  outward?: boolean;
}> = ({ region, hub, t, color, width, outward }) => {
  if (t <= 0 || t >= 1 + TAIL) return null;
  // Inward the visible dash is [t - TAIL, t]; outward it's [1 - t, 1 - t + TAIL].
  const start = outward ? 1 - t : t - TAIL;
  // Fades in as it leaves and out as it lands, so no stub is left behind.
  const opacity = interpolate(
    t,
    [0, 0.12, 1 - 0.12, 1 + TAIL],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <path
      d={arcPath(region, hub)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={`${TAIL} 2`}
      strokeDashoffset={-start}
      strokeOpacity={opacity}
    />
  );
};

/** A region lighting up; the neighbour, drawn whole, lights quieter. */
const Shape: React.FC<{ region: Region; p: number; quiet: boolean }> = ({
  region,
  p,
  quiet,
}) => (
  <path
    d={region.d}
    fill={TEAL}
    fillOpacity={(quiet ? 0.05 : 0.14) * p}
    stroke={TEAL}
    strokeOpacity={(quiet ? 0.4 : 0.75) * p}
    strokeWidth={1}
    strokeLinejoin="round"
  />
);

const Label: React.FC<{
  x: number;
  y: number;
  p: number;
  children: string;
}> = ({ x, y, p, children }) => (
  <text
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

export const MapScene: React.FC<{
  /** Small print in the corner, e.g. the sources caveat. */
  note?: string;
}> = ({ note }) => {
  const frame = useCurrentFrame();
  const layout = LAYOUTS[useAudience()];
  const { regions: JOINED, crossing: CROSSING } = arrange(layout);
  const HUB = layout.hub;
  const land = progress(frame, AT.land, 24);
  const join = progress(frame, AT.join, 24);
  const lit = (i: number) => progress(frame, AT.join + i * RIPPLE);
  const arcs = progress(frame, AT.arcs, 40);

  // The ledger swells as each wave lands; each side lights as the other's flag reaches it.
  const swell = (landsAt: number) =>
    interpolate(
      frame,
      [landsAt - 6, landsAt + 4, landsAt + 30],
      [0, 1, 0],
      clamp,
    );
  const lastIn = AT.gather + JOINED.length * STAGGER + TRAVEL;
  const hubSwell = Math.max(swell(lastIn), swell(AT.flag + TRAVEL));
  const received = interpolate(
    frame,
    [AT.spread + TRAVEL - 4, AT.spread + TRAVEL + 8, AT.spread + TRAVEL + 60],
    [0, 1, 0.35],
    clamp,
  );
  const markScale = MARK / 41;

  return (
    <AbsoluteFill
      name="Map"
      style={{ fontFamily, color: INK, letterSpacing: "normal" }}
    >
      <svg
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          {/* The lakes, cut out of the land so the backdrop shows through. */}
          <mask
            id="water"
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={1920}
            height={1080}
          >
            <rect width={1920} height={1080} fill="white" />
            {layout.lakes.map((l) => (
              <path key={l.name} d={l.d} fill="black" />
            ))}
          </mask>
        </defs>

        <g mask="url(#water)">
          {/* Every border, faint, before anything lights. */}
          <g opacity={land}>
            {JOINED.map((r) => (
              <path
                key={r.country + r.code}
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
          {JOINED.map((r, i) => (
            <Shape
              key={r.country + r.code}
              region={r}
              p={lit(i)}
              quiet={r.country === layout.neighbour}
            />
          ))}
          {CROSSING.map((r) => (
            <path
              key={`received-${r.country}${r.code}`}
              d={r.d}
              fill={FLAG}
              fillOpacity={0.5 * received}
              stroke={FLAG}
              strokeOpacity={received}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          ))}
        </g>
        {/* Shorelines, so the lakes read as water, not holes. */}
        <g opacity={land}>
          {layout.lakes.map((l) => (
            <path
              key={l.name}
              d={l.d}
              fill="none"
              stroke={TEAL}
              strokeOpacity={0.35 * join}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {Object.values(layout.capitals).map((c) => (
          <g key={c.name}>
            <Arc from={c} hub={HUB} p={arcs} />
            <circle
              cx={c.x}
              cy={c.y}
              r={4}
              fill={TEAL}
              opacity={arcs > 0 ? 1 : 0}
            />
          </g>
        ))}

        {/* Every region's records, pulsing in. */}
        {JOINED.map((r, i) => (
          <Streak
            key={`in-${r.country}${r.code}`}
            region={r}
            hub={HUB}
            t={travel(frame, AT.gather + i * STAGGER)}
            color={INK}
            width={1.25}
          />
        ))}
        {/* A flag from each side goes in, then out to every region. */}
        {CROSSING.map((r) => (
          <Streak
            key={`flag-${r.country}${r.code}`}
            region={r}
            hub={HUB}
            t={travel(frame, AT.flag)}
            color={FLAG}
            width={3}
          />
        ))}
        {JOINED.map((r) => {
          const crossing = CROSSING.includes(r);
          return (
            <Streak
              key={`out-${r.country}${r.code}`}
              region={r}
              hub={HUB}
              t={travel(frame, AT.spread)}
              color={crossing ? FLAG : INK}
              width={crossing ? 3 : 1}
              outward
            />
          );
        })}

        <Label {...layout.labels.CA} p={progress(frame, AT.join + 20)}>
          CANADA
        </Label>
        <Label {...layout.labels.US} p={progress(frame, AT.join + 20)}>
          UNITED STATES
        </Label>

        {/* The ledger: the FVBL mark, belonging to neither country. */}
        <g opacity={join}>
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r={62 + 18 * hubSwell}
            fill={BLUE}
            fillOpacity={0.1 + 0.16 * hubSwell}
          />
          <path
            d={MARK_PATH}
            fill={INK}
            fillRule="evenodd"
            transform={`translate(${HUB.x - (37 * markScale) / 2} ${HUB.y - MARK / 2}) scale(${markScale})`}
          />
          <text
            x={HUB.x}
            y={HUB.y + 112}
            textAnchor="middle"
            fill={INK}
            fontSize={26}
            fontWeight={600}
            letterSpacing="0.08em"
          >
            FVBL
          </text>
          <text
            x={HUB.x}
            y={HUB.y + 144}
            textAnchor="middle"
            fill="rgba(245,248,251,0.65)"
            fontSize={20}
            fontWeight={500}
          >
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
            opacity: progress(frame, AT.join + 40),
          }}
        >
          {note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
