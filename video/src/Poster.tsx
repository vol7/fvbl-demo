import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Mark } from "./Mark";
import { fontFamily } from "./theme";

const ease = Easing.bezier(0.2, 0, 0, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * The brand, large, before anything else: the mark and the name, settling in
 * from a soft blur with a glow behind. No voice; the music carries it. It
 * gives the name its moment, so the hero never has to shrink it.
 */
export const Poster: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: ease });
  const name = interpolate(frame, [8, 32], [0, 1], { ...clamp, easing: ease });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        color: "#f5f8fb",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(90,160,216,0.28) 0%, rgba(79,209,181,0.08) 40%, transparent 70%)",
          opacity: p,
          scale: 0.9 + 0.1 * p,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          opacity: p,
          scale: 0.94 + 0.06 * p,
          filter: `blur(${8 * (1 - p)}px)`,
        }}
      >
        <Mark height={200} />
        <div
          style={{
            fontSize: 188,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            opacity: name,
            translate: `${-16 * (1 - name)}px 0px`,
          }}
        >
          FVBL
        </div>
      </div>
    </AbsoluteFill>
  );
};
