import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { useId } from "react";
import { AbsoluteFill } from "remotion";

type WhipProps = Record<string, never>;

/** How far the scenes smear sideways at the middle of the move, in pixels. */
const SMEAR = 70;

/**
 * Custom presentation: a whip pan. Both scenes travel left as one strip, the
 * outgoing one leaving as the incoming one arrives, smeared by a horizontal
 * blur that peaks mid-move. Pair with a short, sharp ease-in-out.
 */
const WhipPresentation: React.FC<
  TransitionPresentationComponentProps<WhipProps>
> = ({ children, presentationDirection, presentationProgress }) => {
  // useId's colons are not valid in a url(#…) reference.
  const filter = `whip${useId().replace(/:/g, "")}`;
  const p = presentationProgress;
  const x = presentationDirection === "entering" ? (1 - p) * 100 : -p * 100;
  const blur = SMEAR * Math.sin(Math.PI * p);
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={filter} x="-20%" y="0" width="140%" height="100%">
          {/* Horizontal only: the smear of a camera panning fast. */}
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ translate: `${x}% 0px`, filter: `url(#${filter})` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const whip = (): TransitionPresentation<WhipProps> => ({
  component: WhipPresentation,
  props: {},
});
