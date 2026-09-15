import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Slide } from "./Slide";

/**
 * Hero and mission on one persistent backdrop. The lockup and first sentence
 * hold until frame 130 and lift out over 12 frames; the second sentence rises
 * in behind them and holds to the end of the 300-frame opening.
 */
export const Opening: React.FC<{ hero: string; mission: string }> = ({
  hero,
  mission,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill name="Opening">
      <AbsoluteFill
        name="Hero type"
        style={{
          opacity: interpolate(frame, [130, 142], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 0, 0, 1),
          }),
          translate: interpolate(frame, [130, 142], ["0px 0px", "0px -14px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 0, 0, 1),
          }),
          filter: `blur(${interpolate(frame, [130, 142], [0, 4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <Slide title={hero} lockup chrome={false} />
      </AbsoluteFill>

      <Interactive.Div
        name="Mission type"
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [142, 162], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 0, 0, 1),
          }),
          translate: interpolate(frame, [142, 162], ["0px 20px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 0, 0, 1),
          }),
          filter: `blur(${interpolate(frame, [142, 162], [4, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <Slide title={mission} chrome={false} />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
