import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { Mark } from "./Mark";
import { Slide } from "./Slide";
import { fontFamily } from "./theme";

type Props = {
  /** The headline figure, counted up from zero. */
  stat: number;
  /** What the figure counts, under it. */
  statLabel: string;
  /** The second half of the first sentence, rising in under the label. */
  statFollow: string;
  /** Where the figure comes from, small along the bottom. */
  source: string;
  /** The problem, in one sentence. */
  turn: string;
  /** The line under the lockup. */
  hero: string;
  /** The three kinds of record FVBL checks, as the voice names them. */
  sources: string[];
};

/**
 * Where each beat starts, in frames, timed to the hero's voiceover (lines.ts,
 * each line 10 frames after its beat): the figure, the problem, then the
 * lockup, which arrives as the voice names FVBL and holds under the ledger
 * sentence. Each beat lifts out over its last 12 frames.
 */
const BEATS = { stat: 0, turn: 240, hero: 410 };

const ease = Easing.bezier(0.2, 0, 0, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * The hero as three beats on one persistent backdrop: the figure, the
 * problem, the lockup. FVBL first appears when the voice names it.
 */
export const Opening: React.FC<Props> = ({
  stat,
  statLabel,
  statFollow,
  source,
  turn,
  hero,
  sources,
}) => (
  <AbsoluteFill name="Opening">
    <Beat name="Stat" from={BEATS.stat} to={BEATS.turn}>
      <Stat
        value={stat}
        label={statLabel}
        follow={statFollow}
        source={source}
      />
    </Beat>
    <Beat name="Turn" from={BEATS.turn} to={BEATS.hero}>
      <Slide title={turn} chrome={false} />
    </Beat>
    <Beat name="Hero" from={BEATS.hero}>
      <Explainer hero={hero} sources={sources} />
    </Beat>
  </AbsoluteFill>
);

/** One beat. Its children see frame 0 at `from`; it lifts out before `to`. */
const Beat: React.FC<{
  name: string;
  from: number;
  to?: number;
  children: React.ReactNode;
}> = ({ name, from, to, children }) => {
  const frame = useCurrentFrame();
  const out =
    to === undefined
      ? 0
      : interpolate(frame, [to - 12, to], [0, 1], { ...clamp, easing: ease });
  return (
    <Sequence
      name={name}
      from={from}
      durationInFrames={to === undefined ? Infinity : to - from}
    >
      <AbsoluteFill
        style={{
          opacity: 1 - out,
          translate: `0px ${-14 * out}px`,
          filter: `blur(${4 * out}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </Sequence>
  );
};

/** The figure counts up over 40 frames, then the label and the follow-on rise in. */
const Stat: React.FC<{
  value: number;
  label: string;
  follow: string;
  source: string;
}> = ({ value, label, follow, source }) => {
  const frame = useCurrentFrame();
  const count = interpolate(frame, [0, 40], [0, value], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const rise = (start: number) =>
    interpolate(frame, [start, start + 20], [0, 1], { ...clamp, easing: ease });

  return (
    <AbsoluteFill
      style={{
        color: "#f5f8fb",
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Interactive.Div
        name="Figure"
        style={{
          fontSize: 260,
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          opacity: rise(0),
        }}
      >
        {Math.round(count).toLocaleString("en-US")}
      </Interactive.Div>
      <Interactive.Div
        name="Label"
        style={{
          marginTop: 28,
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          opacity: rise(18),
          translate: `0px ${16 * (1 - rise(18))}px`,
        }}
      >
        {label}
      </Interactive.Div>
      <Interactive.Div
        name="Follow"
        style={{
          marginTop: 14,
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#5aa0d8",
          opacity: rise(105),
          translate: `0px ${16 * (1 - rise(105))}px`,
        }}
      >
        {follow}
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: "0.01em",
          color: "rgba(245,248,251,0.6)",
          opacity: rise(30),
        }}
      >
        {source}
      </div>
    </AbsoluteFill>
  );
};

const INK = "#f5f8fb";
const BLUE = "#5aa0d8";
const TEAL = "#4fd1b5";

/**
 * When each part moves, in frames from the lockup, timed to lines 03, 04 and
 * 04b (lines.ts). The lockup holds, full size, while the voice names FVBL,
 * then gives way to the illustration. Each source lights and sends a pulse
 * into FVBL as the voice names it; FVBL takes a check; then a sealed block
 * slides out of it onto the ledger, pushing the older ones along, and a
 * shimmer runs down the chain as the voice says no one can change a record
 * without it showing.
 */
const T = {
  lockupOut: 150,
  sceneIn: 154,
  sources: [196, 212, 228],
  travel: 18,
  checked: 252,
  chainIn: 277,
  push: 315,
  seal: 345,
  shimmer: 399,
};

const at = (frame: number, start: number, length = 18) =>
  interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: ease,
  });
const blip = (frame: number, start: number, rise = 5, fall = 24) =>
  interpolate(
    frame,
    [start, start + rise, start + rise + fall],
    [0, 1, 0],
    clamp,
  );

/** Where things sit on the 1920×1080 frame. */
const CORE = { x: 960, y: 540, size: 208 };
const PILL = { x: 520, w: 360, h: 80, ys: [372, 540, 708] };
/** Ledger slots, nearest the core first; history fades to the right. */
const SLOT = { x0: 1190, step: 150, size: 112 };
const SLOT_FADE = [1, 0.72, 0.46, 0.22, 0];

/** Under a solid tile's glass: the backdrop's navy, a step lighter. */
const TILE = "#0d1d31";

/**
 * A frosted glass surface. `solid` puts it on an opaque base, for tiles that
 * pass over lines or each other.
 */
const glass = (lit: number, solid = false) => ({
  background: `linear-gradient(160deg, rgba(255,255,255,${0.1 + 0.04 * lit}), rgba(255,255,255,0.03))${solid ? `, ${TILE}` : ""}`,
  border: `1px solid rgba(${lit > 0 ? "79,209,181" : "255,255,255"},${0.14 + 0.36 * lit})`,
  boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 ${40 * lit}px rgba(79,209,181,${0.22 * lit}), inset 0 1px 0 rgba(255,255,255,0.12)`,
});

/** A small line icon per source: records, insurance, border. */
const SourceIcon: React.FC<{ kind: number; color: string }> = ({
  kind,
  color,
}) => {
  const c = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden>
      {kind === 0 ? (
        <>
          <path {...c} d="M3 10l9-6 9 6" />
          <path {...c} d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
        </>
      ) : kind === 1 ? (
        <path {...c} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      ) : (
        <>
          <circle {...c} cx={12} cy={12} r={9} />
          <path
            {...c}
            d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"
          />
        </>
      )}
    </svg>
  );
};

const Lock: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <rect
      x={5}
      y={11}
      width={14}
      height={10}
      rx={2.5}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
    />
    <path
      d="M8 11V8a4 4 0 0 1 8 0v3"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

/** A beam from a source to FVBL, bowed toward the centre line. */
const beam = (y: number) => {
  const x1 = PILL.x + PILL.w / 2;
  const x2 = CORE.x - CORE.size / 2;
  return `M${x1} ${y}C${x1 + 110} ${y} ${x2 - 110} ${CORE.y} ${x2} ${CORE.y}`;
};

/**
 * The lockup, full size, while the voice names FVBL; then the idea as an
 * illustration, not a screen: three sources feed FVBL, and each result goes
 * onto a chain of sealed blocks. It stays abstract on purpose, so it never
 * reads as a version of the portal the flows show later.
 */
const Explainer: React.FC<{ hero: string; sources: string[] }> = ({
  hero,
  sources,
}) => {
  const frame = useCurrentFrame();
  const lockupOut = at(frame, T.lockupOut, 14);
  const scene = at(frame, T.sceneIn, 28);
  const checked = at(frame, T.checked, 14);
  const chain = at(frame, T.chainIn, 24);
  const push = at(frame, T.push, 30);
  const seal = at(frame, T.seal, 16);
  // The core glows as each pulse lands.
  const hit = Math.max(
    ...T.sources.map((s) => blip(frame, s + T.travel, 4, 26)),
    blip(frame, T.push, 4, 30),
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: 1 - lockupOut,
          scale: 1 + 0.04 * lockupOut,
          filter: `blur(${6 * lockupOut}px)`,
        }}
      >
        <Slide title={hero} lockup chrome={false} />
      </AbsoluteFill>

      <AbsoluteFill style={{ fontFamily, color: INK, opacity: scene }}>
        {/* Light under the scene. */}
        <div
          style={{
            position: "absolute",
            left: CORE.x - 700,
            top: CORE.y - 380,
            width: 1400,
            height: 760,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(79,209,181,0.14) 0%, rgba(90,160,216,0.1) 35%, transparent 70%)",
          }}
        />

        {/* Beams and pulses. */}
        <svg
          viewBox="0 0 1920 1080"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            {/* In frame units: the middle beam is a flat line, and a
                bounding-box gradient on a zero-height path draws nothing. */}
            <linearGradient
              id="beam"
              gradientUnits="userSpaceOnUse"
              x1={PILL.x + PILL.w / 2}
              x2={CORE.x - CORE.size / 2}
              y1={0}
              y2={0}
            >
              <stop offset="0" stopColor={BLUE} stopOpacity={0.15} />
              <stop offset="1" stopColor={TEAL} stopOpacity={0.5} />
            </linearGradient>
          </defs>
          {PILL.ys.map((y, i) => {
            const lit = at(frame, T.sources[i], 12);
            const t = interpolate(
              frame,
              [T.sources[i], T.sources[i] + T.travel],
              [0, 1],
              {
                ...clamp,
                easing: Easing.inOut(Easing.cubic),
              },
            );
            return (
              <g key={i}>
                <path
                  d={beam(y)}
                  fill="none"
                  stroke="url(#beam)"
                  strokeWidth={1.5}
                  strokeOpacity={0.35 + 0.65 * lit}
                />
                {t > 0 && t < 1 ? (
                  <path
                    d={beam(y)}
                    fill="none"
                    stroke={TEAL}
                    strokeWidth={4}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="0.14 2"
                    strokeDashoffset={-(t * 1.14 - 0.14)}
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(79,209,181,0.9))",
                    }}
                  />
                ) : null}
              </g>
            );
          })}
          {/* The link from FVBL to the ledger. */}
          <line
            x1={CORE.x + CORE.size / 2}
            x2={SLOT.x0 - SLOT.size / 2}
            y1={CORE.y}
            y2={CORE.y}
            stroke={TEAL}
            strokeOpacity={0.45 * chain}
            strokeWidth={1.5}
          />
        </svg>

        {/* The sources. */}
        {sources.map((name, i) => {
          const lit = at(frame, T.sources[i], 12);
          const shown = at(frame, T.sceneIn + i * 6, 22);
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: PILL.x - PILL.w / 2,
                top: PILL.ys[i] - PILL.h / 2,
                width: PILL.w,
                height: PILL.h,
                borderRadius: PILL.h / 2,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 28px",
                ...glass(lit),
                opacity: shown,
                translate: `${-24 * (1 - shown)}px 0px`,
              }}
            >
              <SourceIcon kind={i} color={lit > 0.5 ? TEAL : BLUE} />
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  opacity: 0.7 + 0.3 * lit,
                }}
              >
                {name}
              </div>
            </div>
          );
        })}

        {/* The new block, under FVBL until it slides out onto the ledger. */}
        {(() => {
          const x = interpolate(push, [0, 1], [CORE.x, SLOT.x0]);
          const shimmer = blip(frame, T.shimmer, 5, 22);
          const lit = Math.max(1 - seal, shimmer);
          return (
            <div
              style={{
                position: "absolute",
                left: x - SLOT.size / 2,
                top: CORE.y - SLOT.size / 2,
                width: SLOT.size,
                height: SLOT.size,
                borderRadius: 28,
                display: "grid",
                placeItems: "center",
                ...glass(lit, true),
                opacity: push > 0 ? Math.min(1, push * 3) : 0,
                scale: 0.7 + 0.3 * push,
              }}
            >
              <Lock size={34} color={TEAL} />
            </div>
          );
        })()}

        {/* FVBL, where the checks land. */}
        <div
          style={{
            position: "absolute",
            left: CORE.x - CORE.size / 2,
            top: CORE.y - CORE.size / 2,
            width: CORE.size,
            height: CORE.size,
            borderRadius: 52,
            display: "grid",
            placeItems: "center",
            ...glass(Math.max(hit, 0.35 * checked), true),
            scale: 0.92 + 0.08 * scene + 0.03 * hit,
          }}
        >
          <Mark height={96} />
          {/* The check, once all three have answered. */}
          <div
            style={{
              position: "absolute",
              right: -18,
              top: -18,
              width: 52,
              height: 52,
              borderRadius: 26,
              display: "grid",
              placeItems: "center",
              backgroundColor: TEAL,
              boxShadow: "0 0 24px rgba(79,209,181,0.6)",
              opacity: checked,
              scale: 0.6 + 0.4 * checked,
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                fill="none"
                stroke="#081527"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* The ledger: the new block slid out of FVBL; the rest move along. */}
        {[0, 1, 2, 3, 4].map((k) => {
          // Block k sits in slot k before the push and slot k + 1 after; the
          // new block (k = -1) comes out of the core into slot 0.
          const slot = k + push;
          const x = SLOT.x0 + slot * SLOT.step;
          const fade = interpolate(slot, [0, 1, 2, 3, 4], SLOT_FADE, clamp);
          const shimmer = blip(frame, T.shimmer + slot * 6, 5, 22);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: x - SLOT.size / 2,
                top: CORE.y - SLOT.size / 2,
                width: SLOT.size,
                height: SLOT.size,
                borderRadius: 28,
                display: "grid",
                placeItems: "center",
                ...glass(shimmer, true),
                opacity: chain * fade,
              }}
            >
              {/* The link back to the block before; slot 0's is FVBL's. */}
              <div
                style={{
                  position: "absolute",
                  right: "100%",
                  top: "50%",
                  width: SLOT.step - SLOT.size,
                  height: 1.5,
                  marginTop: -0.75,
                  backgroundColor: INK,
                  opacity: 0.3 * Math.min(1, slot),
                }}
              />
              <Lock
                size={34}
                color={shimmer > 0.2 ? TEAL : "rgba(245,248,251,0.6)"}
              />
            </div>
          );
        })}

        {/* One label: what the chain is. */}
        <div
          style={{
            position: "absolute",
            left: SLOT.x0 - SLOT.size / 2,
            top: CORE.y + SLOT.size / 2 + 34,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: TEAL,
            opacity: chain,
          }}
        >
          SECURE LEDGER
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
