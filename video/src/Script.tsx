import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "./theme";

/**
 * One voiceover line, as a caption along the bottom while it's spoken. Only
 * in the review render (`showScript`), so the script can be judged against
 * the picture before the voice is recorded. The final render leaves it off.
 */
export const Script: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      name="Script"
      style={{ justifyContent: "flex-end", alignItems: "center", padding: 48 }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "14px 24px",
          borderRadius: 12,
          backgroundColor: "rgba(0,0,0,0.72)",
          color: "#fafafa",
          fontFamily,
          fontSize: 30,
          fontStyle: "italic",
          letterSpacing: "normal",
          lineHeight: 1.35,
          textAlign: "center",
          textWrap: "balance",
          opacity: interpolate(frame, [4, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
