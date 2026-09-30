import { Audio } from "@remotion/media";
import { getStaticFiles, interpolate, staticFile, useVideoConfig } from "remotion";
import { useAudience, type Audience } from "./audience";

/** The finished mix: voice and music cut to the locked picture in a DAW, one per version. */
export const mix = (audience: Audience) => `audio/soundtrack-${audience}.wav`;
/** The music alone, for rough cuts before the voice is recorded. */
const MUSIC = "audio/music.mp3";
/**
 * Candidate beds, auditioned side by side: each file here plays as its own
 * layer, to be muted in the Studio timeline. Up to four; empty the folder
 * before a render.
 */
const COMPARE = "audio/compare/";

/** Music under the review cut sits low, so the captions read as the voice. */
const BED = 0.35;
const FADE_IN = 45;
const FADE_OUT = 150;

/**
 * The soundtrack. The finished mix wins when it is there: the swells on the
 * cards and the dips under the voice are done in the mix, against the picture.
 * Without it, the candidates in `audio/compare/` play together, one layer each,
 * or else the music plays as a flat bed with a fade in and out. Without any of
 * them, the cut is silent.
 */
export const Soundtrack: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const audience = useAudience();
  const files = getStaticFiles().map((f) => f.name);
  const [a, b, c, d] = files.filter((f) => f.startsWith(COMPARE) && f.endsWith(".mp3"));
  const name = (f: string) => `Music ${f.slice(COMPARE.length, -4)}`;
  const volume = (f: number) =>
    interpolate(
      f,
      [0, FADE_IN, durationInFrames - FADE_OUT, durationInFrames],
      [0, BED, BED, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

  if (files.includes(mix(audience))) {
    return <Audio name="Soundtrack" src={staticFile(mix(audience))} />;
  }
  // One <Audio> per slot, written out: the Studio merges layers that share a
  // source line into one row with one mute, so a .map() cannot be muted apart.
  if (a) {
    return (
      <>
        <Audio name={name(a)} src={staticFile(a)} volume={volume} from={-4} />
        {b && <Audio name={name(b)} src={staticFile(b)} volume={volume} from={-4} />}
        {c && <Audio name={name(c)} src={staticFile(c)} volume={volume} from={-4} />}
        {d && <Audio name={name(d)} src={staticFile(d)} volume={volume} from={-4} />}
      </>
    );
  }
  if (files.includes(MUSIC)) {
    return <Audio name="Music bed" src={staticFile(MUSIC)} volume={volume} from={-4} />;
  }
  return null;
};
