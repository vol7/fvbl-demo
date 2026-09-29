import { Audio } from "@remotion/media";
import { getStaticFiles, interpolate, staticFile, useVideoConfig } from "remotion";
import { useAudience, type Audience } from "./audience";

/** The finished mix: voice and music cut to the locked picture in a DAW, one per version. */
export const mix = (audience: Audience) => `audio/soundtrack-${audience}.wav`;
/** The music alone, for rough cuts before the voice is recorded. */
const MUSIC = "audio/music.mp3";

/** Music under the review cut sits low, so the captions read as the voice. */
const BED = 0.35;
const FADE_IN = 45;
const FADE_OUT = 150;

/**
 * The soundtrack. The finished mix wins when it is there: the swells on the
 * cards and the dips under the voice are done in the mix, against the picture.
 * Without it, the music plays as a flat bed with a fade in and out. Without
 * either, the cut is silent.
 */
export const Soundtrack: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const audience = useAudience();
  const files = getStaticFiles().map((f) => f.name);

  if (files.includes(mix(audience))) {
    return <Audio name="Soundtrack" src={staticFile(mix(audience))} />;
  }
  if (files.includes(MUSIC)) {
    return (
      <Audio
        name="Music bed"
        src={staticFile(MUSIC)}
        volume={(f) =>
          interpolate(
            f,
            [0, FADE_IN, durationInFrames - FADE_OUT, durationInFrames],
            [0, BED, BED, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
    );
  }
  return null;
};
