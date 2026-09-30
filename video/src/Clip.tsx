import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  getStaticFiles,
  interpolate,
  Loop,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { createContext, useContext } from "react";
import { useAudience } from "./audience";

/** On in the -Review cuts: production notes such as "Stand-in" show there only. */
export const ReviewContext = createContext(false);
import { fontFamily } from "./theme";

type ClipProps = {
  /**
   * File name inside public/clips, e.g. "1-2-buyer.mp4". A take of the same
   * name in public/clips/<audience>/ wins, for a shot recorded per version.
   */
  file: string;
  /** Screenplay shot number, shown on the slate when the file is missing. */
  shot: string;
  /** Portal | Phone | ServiceOntario, for the slate. */
  surface: string;
  /** Source frames to skip, at 30 fps. */
  trimBefore?: number;
  /** 1 plays as recorded; 1.4 plays a slow take 40% faster. */
  playbackRate?: number;
  /** Top-left note for shots that show federal or cross-border sources. */
  caveat?: string;
  /** Top-right badge, e.g. "Concept mock-up" on the saved ServiceOntario page. */
  watermark?: string;
  /** Top-right label naming the scene, e.g. "Catch 1 of 3" and its title. */
  label?: { eyebrow: string; title: string };
};

/**
 * Old takes that stand in for v4 shots not recorded yet, with their length in
 * frames so they loop to fill the shot. A recorded file always wins. Delete
 * once flows 3a, 3b and 3c are recorded.
 */
const STAND_INS: Record<string, { file: string; frames: number }> = {
  "flow-3a.mp4": { file: "flow-3.mp4", frames: 634 },
  "flow-3b.mp4": { file: "flow-3.mp4", frames: 634 },
  "flow-3c.mp4": { file: "flow-3.mp4", frames: 634 },
};

/**
 * One recorded shot. Fits any clip size inside the 1920x1080 frame on a dark
 * matte. Missing files render a slate so the timeline can be previewed before
 * anything is recorded.
 */
export const Clip: React.FC<ClipProps> = ({
  file,
  shot,
  surface,
  trimBefore = 0,
  playbackRate = 1,
  caveat,
  watermark,
  label,
}) => {
  const audience = useAudience();
  const review = useContext(ReviewContext);
  const files = getStaticFiles().map((f) => f.name);
  const own = files.includes(`clips/${audience}/${file}`);
  const recorded = own || files.includes(`clips/${file}`);
  const standIn =
    !recorded && files.includes(`clips/${STAND_INS[file]?.file}`)
      ? STAND_INS[file]
      : undefined;
  const path = own
    ? `clips/${audience}/${file}`
    : `clips/${recorded ? file : standIn?.file}`;

  return (
    <AbsoluteFill>
      {standIn ? (
        <Loop durationInFrames={standIn.frames - trimBefore}>
          <Video
            name={`Shot ${shot}, stand-in`}
            src={staticFile(path)}
            trimBefore={trimBefore}
            muted
            objectFit="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </Loop>
      ) : recorded ? (
        <Video
          name={`Shot ${shot}`}
          src={staticFile(path)}
          trimBefore={trimBefore}
          playbackRate={playbackRate}
          muted
          objectFit="contain"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Slate shot={shot} surface={surface} file={file} />
      )}
      <Corner side="left">
        {caveat ? <Note text={caveat} /> : null}
      </Corner>
      <Corner side="right">
        {label ? <Label {...label} /> : null}
        {watermark ? <Note text={watermark} /> : null}
        {standIn && review ? <Note text={`Stand-in: ${standIn.file}, old take`} /> : null}
      </Corner>
    </AbsoluteFill>
  );
};

/** A top corner, stacking its notes downward. */
const Corner: React.FC<{ side: "left" | "right"; children: React.ReactNode }> = ({
  side,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      top: 36,
      [side]: 40,
      display: "flex",
      flexDirection: "column",
      alignItems: side === "left" ? "flex-start" : "flex-end",
      gap: 12,
    }}
  >
    {children}
  </div>
);

/** The scene's name, in the corner, where a title card used to be. */
const Label: React.FC<{ eyebrow: string; title: string }> = ({
  eyebrow,
  title,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0, 0, 1),
  });
  return (
    <div
      style={{
        padding: "16px 22px",
        borderRadius: 14,
        backgroundColor: "rgba(8,21,39,0.88)",
        color: "#f5f8fb",
        fontFamily,
        letterSpacing: "normal",
        textAlign: "right",
        opacity: p,
        translate: `0px ${-10 * (1 - p)}px`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#f59e8b",
        }}
      >
        {eyebrow}
      </div>
      <div style={{ marginTop: 6, fontSize: 34, fontWeight: 700 }}>{title}</div>
    </div>
  );
};

/** A small note in a top corner, above the recording: one quiet line. */
const Note: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      padding: "6px 12px",
      borderRadius: 8,
      backgroundColor: "rgba(8,21,39,0.35)",
      // Light enough to see through, blurred so the page behind doesn't
      // tangle with the words.
      backdropFilter: "blur(14px)",
      color: "rgba(245,248,251,0.85)",
      fontFamily,
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

const Slate: React.FC<{ shot: string; surface: string; file: string }> = ({
  shot,
  surface,
  file,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1c1c1e",
      color: "#a3a3a3",
      fontFamily,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    }}
  >
    <div
      style={{
        fontSize: 28,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {surface}
    </div>
    <div
      style={{
        fontSize: 120,
        fontWeight: 700,
        color: "#fafafa",
        letterSpacing: "-0.03em",
      }}
    >
      Shot {shot}
    </div>
    <div style={{ fontSize: 28, fontFamily: "ui-monospace, Menlo, monospace" }}>
      public/clips/{file}
    </div>
  </AbsoluteFill>
);
