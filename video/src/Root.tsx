import { Composition, Folder } from "remotion";
import { AudienceContext, type Audience } from "./audience";
import { Demo, HEROES } from "./Demo";
import { MapScene } from "./MapScene";
import { Opening } from "./Opening";
import { Backdrop, Slide } from "./Slide";

/** The map on its navy ground, as it sits in the cut. */
const MapPreview: React.FC<{ audience: Audience }> = ({ audience }) => (
  <AudienceContext.Provider value={audience}>
    <Backdrop />
    <MapScene />
  </AudienceContext.Provider>
);

/** The hero on its navy ground, with the cut's copy. */
const OpeningPreview: React.FC = () => (
  <>
    <Backdrop />
    <Opening {...HEROES.ca} />
  </>
);

/** The cut's length in frames, shared by all four Demo compositions. */
const DURATION = 6820;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* One cut, two versions: Canada-first and US-first (audience.ts).
          DURATION = sum of every <TransitionSeries.Sequence> in Demo.tsx
          minus 16 per <Transition>. `pnpm durations` prints the current value.
          The -Review cuts show each voiceover line as a caption, for checking
          the script against the picture before the voice is recorded. */}
      {(["ca", "us"] as const).flatMap((audience) =>
        [false, true].map((showScript) => (
          <Composition
            key={`${audience}-${showScript}`}
            id={`Demo-${audience.toUpperCase()}${showScript ? "-Review" : ""}`}
            component={Demo}
            durationInFrames={DURATION}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ audience, showScript }}
          />
        )),
      )}

      <Folder name="Slides">
        {(["ca", "us"] as const).map((audience) => (
          <Composition
            key={audience}
            id={`Map-${audience.toUpperCase()}`}
            component={MapPreview}
            durationInFrames={525}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ audience }}
          />
        ))}
        <Composition
          id="Opening"
          component={OpeningPreview}
          durationInFrames={810}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Slide-Hero"
          component={Slide}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: "A secure ledger of vehicle ownership.",
            lockup: true,
          }}
        />
        <Composition
          id="Slide-Statement"
          component={Slide}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title:
              "Clerks see whether the registered owner has pre-approved the request, and issue accordingly.",
          }}
        />
      </Folder>
    </>
  );
};
