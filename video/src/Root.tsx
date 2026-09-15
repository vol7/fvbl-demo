import { Composition, Folder } from "remotion";
import { Demo } from "./Demo";
import { Opening } from "./Opening";
import { Slide } from "./Slide";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* durationInFrames = sum of every <TransitionSeries.Sequence> in Demo.tsx
          minus 16 per <Transition>. `pnpm durations` prints the current value. */}
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={4091}
        fps={30}
        width={1920}
        height={1080}
      />

      <Folder name="Slides">
        <Composition
          id="Opening"
          component={Opening}
          durationInFrames={240}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            hero: "A secure ledger of vehicle ownership.",
            mission:
              "OVIL safeguards vehicle records with owner authentication before any information is released.",
          }}
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
              "At the counter, the clerk sees the vehicle checked against historical records and the owner's approval confirmed.",
          }}
        />
      </Folder>
    </>
  );
};
