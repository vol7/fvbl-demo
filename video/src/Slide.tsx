import { Fragment } from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Mark } from "./Mark";
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
  /** A short label above the title, e.g. "Catch 1 · Export". Cards only. */
  eyebrow?: string;
  /** The FVBL mark and name above the sentence. On for the hero and close. */
  lockup?: boolean;
  /** Own backdrop. Off in the cut, where one Backdrop sits under the whole timeline. */
  chrome?: boolean;
  /** Small print along the bottom, e.g. the concept disclaimer on the close. */
  note?: string;
};

/** Titles this short are headlines and set larger; longer ones are sentences. */
const HEADLINE_MAX = 32;
/** Frames between one word of the title and the next. */
const STAGGER = 3;

const ease = Easing.bezier(0.2, 0, 0, 1);

/** 0 → 1 over `length` frames from `start`, eased. */
function rise(frame: number, start: number, length = 20) {
  return interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}

/**
 * A slide. Deep navy derived from the portal's primary hue, with a blue bloom
 * rising from the bottom and fine grain so the gradient never bands. The
 * sentence is the slide: large, tight, centred, rising in word by word.
 */
export const Slide: React.FC<Props> = ({
  title,
  eyebrow,
  lockup = false,
  chrome = true,
  note,
}) => {
  const frame = useCurrentFrame();
  // A "\n" in the title is a deliberate line break.
  const lines = title.split("\n").map((line) => line.split(" "));
  const headline = Math.max(...lines.map((l) => l.join(" ").length)) <= HEADLINE_MAX;
  let n = 0;
  const titleStart = eyebrow ? 10 : 6;

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
          <Mark height={52} />
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

      {eyebrow ? (
        <Interactive.Div
          name="Eyebrow"
          style={{
            position: "relative",
            marginBottom: -16,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#5aa0d8",
            opacity: rise(frame, 0, 14),
            translate: `0px ${8 * (1 - rise(frame, 0, 14))}px`,
          }}
        >
          {eyebrow}
        </Interactive.Div>
      ) : null}

      <Interactive.Div
        name="Title"
        style={{
          position: "relative",
          maxWidth: headline ? "18ch" : "26ch",
          fontSize: headline ? 128 : 92,
          fontWeight: headline ? 700 : 600,
          letterSpacing: headline ? "-0.045em" : "-0.035em",
          lineHeight: headline ? 1.02 : 1.06,
          textWrap: "balance",
        }}
      >
        {lines.map((words, l) => (
          <Fragment key={l}>
            {l > 0 ? <br /> : null}
            {words.map((word, i) => {
              const p = rise(frame, titleStart + n++ * STAGGER);
              // A plain space between the spans, so the title can still wrap.
              return (
                <Fragment key={i}>
                  {i > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      opacity: p,
                      translate: `0px ${20 * (1 - p)}px`,
                      filter: `blur(${4 * (1 - p)}px)`,
                    }}
                  >
                    {word}
                  </span>
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </Interactive.Div>

      {note ? (
        <div
          style={{
            position: "absolute",
            bottom: 170,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "0.01em",
            color: "rgba(245,248,251,0.7)",
            opacity: interpolate(frame, [20, 36], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
