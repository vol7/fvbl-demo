import { Composition, Folder } from "remotion";
import { AudienceContext, type Audience } from "./audience";
import { Demo, HEROES } from "./Demo";
import { LINES } from "./lines";
import { MapPeers } from "./MapPeers";
import { MapScene } from "./MapScene";
import { Voice } from "./Voice";
import { Opening } from "./Opening";
import { Backdrop, Slide } from "./Slide";

/** The first, joint map, on its navy ground. Neither cut plays it now. */
const MapPreview: React.FC<{ audience: Audience }> = ({ audience }) => (
  <AudienceContext.Provider value={audience}>
    <Backdrop />
    <MapScene />
  </AudienceContext.Provider>
);

/** A no-hub map, as each cut plays it, with the map's lines as captions. */
const MapPeersPreview: React.FC<{ variant: "quiet" | "join"; country: Audience }> = ({
  variant,
  country,
}) => (
  <AudienceContext.Provider value={country}>
    <Backdrop />
    <MapPeers variant={variant} country={country} />
    <Voice lines={LINES.map} showScript />
  </AudienceContext.Provider>
);

/** The hero on its navy ground, with the cut's copy. */
const OpeningPreview: React.FC = () => (
  <>
    <Backdrop />
    <Opening {...HEROES.ca} />
  </>
);

/**
 * Each version's length in frames, for its cut and its -Review cut. They
 * differ because the recorded shots do (`SHOTS` in Demo.tsx).
 */
const DURATION = { ca: 7598, us: 7244 } satisfies Record<Audience, number>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* One cut, two versions: Canada-first and US-first (audience.ts).
          DURATION = sum of every <TransitionSeries.Sequence> in Demo.tsx
          minus 16 per <Transition>, per version. `pnpm durations` prints both.
          The -Review cuts show each voiceover line as a caption, for checking
          the script against the picture before the voice is recorded.
          Written out rather than looped so the Studio can save their props:
          it needs a literal id and defaultProps to find each one. */}
      <Composition
        id="Demo-CA"
        component={Demo}
        durationInFrames={DURATION.ca}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ audience: "ca", showScript: false }}
      />
      <Composition
        id="Demo-CA-Review"
        component={Demo}
        durationInFrames={DURATION.ca}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ audience: "ca", showScript: true }}
      />
      <Composition
        id="Demo-US"
        component={Demo}
        durationInFrames={DURATION.us}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ audience: "us", showScript: false }}
      />
      <Composition
        id="Demo-US-Review"
        component={Demo}
        durationInFrames={DURATION.us}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ audience: "us", showScript: true }}
      />

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
        {(["quiet", "join"] as const).map((variant) => (
          <Composition
            key={variant}
            id={`Map-US-${variant === "quiet" ? "Quiet" : "Join"}`}
            component={MapPeersPreview}
            durationInFrames={525}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ variant, country: "us" }}
          />
        ))}
        <Composition
          id="Map-CA-Join"
          component={MapPeersPreview}
          durationInFrames={525}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ variant: "join", country: "ca" }}
        />
        <Composition
          id="Opening"
          component={OpeningPreview}
          durationInFrames={885}
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
