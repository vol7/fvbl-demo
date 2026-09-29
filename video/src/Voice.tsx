import { Audio } from "@remotion/media";
import { Fragment } from "react";
import { getStaticFiles, Sequence, staticFile } from "remotion";
import { useAudience } from "./audience";
import { estimate, say, type Line } from "./lines";
import { Script } from "./Script";
import { mix } from "./Soundtrack";

/**
 * A scene's voiceover: each line starts on its own frame. The take is
 * `public/audio/vo/<audience>/<id>.wav` (or .mp3); a missing take is silent, and a
 * present finished mix (`Soundtrack`) silences them all. With `showScript`,
 * each line is also a caption for as long as it's spoken, for the review
 * render.
 */
export const Voice: React.FC<{ lines: Line[]; showScript: boolean }> = ({
  lines,
  showScript,
}) => {
  const audience = useAudience();
  const files = getStaticFiles().map((f) => f.name);
  const mixed = files.includes(mix(audience));

  return (
    <>
      {lines.map((line) => {
        const take = ["wav", "mp3"]
          .map((ext) => `audio/vo/${audience}/${line.id}.${ext}`)
          .find((path) => files.includes(path));
        const text = say(line, audience);
        return (
          <Fragment key={line.id}>
            {take && !mixed ? (
              <Sequence name={`Voice ${line.id}`} from={line.at} layout="none">
                <Audio src={staticFile(take)} />
              </Sequence>
            ) : null}
            {showScript ? (
              <Sequence
                name={`Caption ${line.id}`}
                from={line.at}
                durationInFrames={estimate(text) + 12}
              >
                <Script text={text} />
              </Sequence>
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
};
