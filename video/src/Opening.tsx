import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
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
  /** What FVBL is for. */
  mission: string;
  /** The line under the lockup. */
  hero: string;
};

/**
 * Where each beat starts, in frames, timed to the hero's voiceover at 155
 * words a minute (lines.ts, each line 10 frames after its beat): the figure,
 * the problem, the mission, then the lockup under the ledger sentence. Each
 * beat lifts out over its last 12 frames.
 */
const BEATS = { stat: 0, turn: 240, mission: 380, hero: 520 };

const ease = Easing.bezier(0.2, 0, 0, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * The hero as four beats on one persistent backdrop: the figure, the
 * problem, the mission, the lockup.
 */
export const Opening: React.FC<Props> = ({
  stat,
  statLabel,
  statFollow,
  source,
  turn,
  mission,
  hero,
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
    <Beat name="Turn" from={BEATS.turn} to={BEATS.mission}>
      <Slide title={turn} chrome={false} />
    </Beat>
    <Beat name="Mission" from={BEATS.mission} to={BEATS.hero}>
      <Slide title={mission} chrome={false} />
    </Beat>
    <Beat name="Hero" from={BEATS.hero}>
      <Slide title={hero} lockup chrome={false} />
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
    to === undefined ? 0 : interpolate(frame, [to - 12, to], [0, 1], { ...clamp, easing: ease });
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
