import { Audio } from "@remotion/media";
import { Fragment } from "react";
import { getStaticFiles, Sequence, staticFile } from "remotion";
import { useAudience } from "./audience";
import { estimate, mark, say, type Line } from "./lines";
import { Script } from "./Script";
import { mix } from "./Soundtrack";

/**
 * A scene's voiceover: each line starts on its own frame. The take is
 * `public/audio/vo/<audience>/<id>.wav` (or .mp3). A shared line (one text,
 * read the same in both cuts) falls back to the Canada take, so the US cut
 * only needs takes for its own lines. A line with no recorded take plays its
 * scratch take from `public/audio/vo-scratch/` (`pnpm voice:scratch`), in the
 * same order. A missing take is silent, and a present finished mix
 * (`Soundtrack`) silences them all. With `showScript`,
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
        const at = mark(line, audience);
        if (at === null) return null;
        const shared = typeof line.text === "string";
        const dirs = [audience, ...(shared ? ["ca"] : [])];
        const take = ["vo", "vo-scratch"]
          .flatMap((folder) =>
            dirs.flatMap((dir) =>
              ["wav", "mp3"].map((ext) => `audio/${folder}/${dir}/${line.id}.${ext}`)
            )
          )
          .find((path) => files.includes(path));
        const text = say(line, audience);
        return (
          <Fragment key={line.id}>
            {take && !mixed ? (
              // Mounted a second early so the take is loaded when its mark
              // arrives; otherwise the Studio preview clips its first words.
              // Premounting needs the default layout, an empty full-frame div.
              <Sequence
                name={`Voice ${line.id}`}
                from={at}
                premountFor={30}
              >
                <Audio src={staticFile(take)} />
              </Sequence>
            ) : null}
            {showScript ? (
              <Sequence
                name={`Caption ${line.id}`}
                from={at}
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
