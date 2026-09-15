import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { fontFamily } from "./theme";

/** Navy ground, blue bloom rising from the bottom, fine grain against banding. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      name="Backdrop"
      style={{ backgroundColor: "#081527", overflow: "hidden" }}
    >
      <AbsoluteFill
        name="Bloom"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 50% 108%, rgba(0,105,168,0.85) 0%, rgba(0,105,168,0.25) 45%, transparent 70%), radial-gradient(ellipse 50% 40% at 12% -10%, rgba(90,160,216,0.22) 0%, transparent 60%)",
          scale: interpolate(frame, [0, 150], [1, 1.06], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          mixBlendMode: "overlay",
        }}
        aria-hidden
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>{" "}
    </AbsoluteFill>
  );
};

type Props = {
  title: string;
  /** Shield + FVBL above the sentence. On for the hero and close. */
  lockup?: boolean;
  /** Own backdrop. Off in the cut, where one Backdrop sits under the whole timeline. */
  chrome?: boolean;
};

/**
 * A slide. Deep navy derived from the portal's primary hue, with a blue bloom
 * rising from the bottom and fine grain so the gradient never bands. The
 * sentence is the slide: large, tight, centred.
 */
export const Slide: React.FC<Props> = ({
  title,
  lockup = false,
  chrome = true,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      name="Slide"
      style={{
        backgroundColor: chrome ? "#081527" : "transparent",
        color: "#f5f8fb",
        fontFamily,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
        padding: 160,
        textAlign: "center",
      }}
    >
      {chrome ? <Backdrop /> : null}

      {lockup ? (
        <Interactive.Div
          name="Lockup"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "rgba(245,248,251,0.92)",
            opacity: interpolate(frame, [0, 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0, 0, 1),
            }),
            translate: interpolate(frame, [0, 16], ["0px 12px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0, 0, 1),
            }),
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            FVBL
          </div>
        </Interactive.Div>
      ) : null}

      <Interactive.Div
        name="Title"
        style={{
          position: "relative",
          maxWidth: "26ch",
          fontSize: 92,
          fontWeight: 600,
          letterSpacing: "-0.035em",
          lineHeight: 1.06,
          textWrap: "balance",
          opacity: interpolate(frame, [6, 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 0, 0, 1),
          }),
          translate: interpolate(frame, [6, 26], ["0px 20px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 0, 0, 1),
          }),
          filter: `blur(${interpolate(frame, [6, 26], [4, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        {title}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
