import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Easing } from "remotion";
import { Clip } from "./Clip";
import { Opening } from "./Opening";
import { settle } from "./settle";
import { Backdrop, Slide } from "./Slide";

/**
 * The cut, per the 2026-09-11 review with Frank.
 *
 * Slides carry the sentences; clips are the recorded flows. Every actor change
 * gets a slide so the viewer always knows whether they are watching the buyer,
 * the owner or the clerk. The clerk section is three paused beats (checks,
 * timeline, authorization), each introduced by its own slide, instead of one
 * long scroll. The blockchain beat is the last thing, not inline.
 *
 * Holds: 165 frames for a slide under 9 words, 180 to 195 for a sentence,
 * 210 for the long clerk one. If it feels slow to us, it is right for the
 * room. Every hand-off is `settle` (16 frames): the outgoing scene drifts
 * away through blur while the next fades up.
 *
 * Clip durations come from `pnpm durations`. Unrecorded shots carry their
 * screenplay target so the timeline previews at the intended length.
 * Composition total in Root.tsx = sum of sequences minus 16 per transition.
 */

const handoff = (
  <TransitionSeries.Transition
    presentation={settle()}
    timing={linearTiming({
      durationInFrames: 16,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    })}
  />
);

export const Demo: React.FC = () => {
  return (
    <AbsoluteFill
      name="Stage"
      style={{
        letterSpacing: 6.9,
      }}
    >
      <Backdrop />
      <TransitionSeries name="FVBL demo">
        {/* Purpose first, then straight into the story. */}
        <TransitionSeries.Sequence name="Opening" durationInFrames={300}>
          <Opening
            hero="A secure ledger of vehicle ownership."
            mission="FVBL safeguards vehicle records with owner authentication before any information is released."
          />
        </TransitionSeries.Sequence>
        {handoff}

        {/* ── The buyer ─────────────────────────────────────────────── */}
        <TransitionSeries.Sequence name="Entry point" durationInFrames={180}>
          <Slide
            title="Customers can request a UVIP pre-approval from the ServiceOntario portal."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence
          name="Flow 1a ServiceOntario"
          durationInFrames={1074}
        >
          <Clip shot="1a" surface="ServiceOntario" file="flow-1a.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        {/* ── The owner ─────────────────────────────────────────────── */}
        <TransitionSeries.Sequence name="Owner" durationInFrames={165}>
          <Slide
            title="Registered owners get a request for approval."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence name="Flow 1b Phone" durationInFrames={540}>
          <Clip shot="1b" surface="Phone" file="flow-1b.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        {/* ── The clerk, in three beats ─────────────────────────────── */}
        <TransitionSeries.Sequence name="Clerk" durationInFrames={210}>
          <Slide
            title="At the counter, the clerk sees at a glance whether the package can be released."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence
          name="Flow 2a Portal landing"
          durationInFrames={300}
        >
          <Clip shot="2a" surface="Portal" file="flow-2a.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        <TransitionSeries.Sequence name="Checks" durationInFrames={180}>
          <Slide
            title="The vehicle's history is validated for signs of tampering or risk."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence
          name="Flow 2b Portal checks"
          durationInFrames={300}
        >
          <Clip shot="2b" surface="Portal" file="flow-2b.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        <TransitionSeries.Sequence name="Timeline" durationInFrames={180}>
          <Slide
            title="Transport Canada and CBSA border records complete the vehicle's timeline."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence
          name="Flow 2c Portal timeline"
          durationInFrames={300}
        >
          <Clip shot="2c" surface="Portal" file="flow-2c.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        <TransitionSeries.Sequence name="Authorization" durationInFrames={195}>
          <Slide
            title="Clerks see whether the registered owner has pre-approved the request, and issue accordingly."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence
          name="Flow 2d Portal authorization"
          durationInFrames={330}
        >
          <Clip shot="2d" surface="Portal" file="flow-2d.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        {/* ── The red case ──────────────────────────────────────────── */}
        <TransitionSeries.Sequence name="Failure" durationInFrames={195}>
          <Slide
            title="If a record check fails or approval is not given, the package cannot be issued."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence
          name="Flow 3 Portal red"
          durationInFrames={630}
        >
          <Clip shot="3" surface="Portal" file="flow-3.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        {/* ── Blockchain, last and quiet ────────────────────────────── */}
        <TransitionSeries.Sequence name="Blockchain" durationInFrames={180}>
          <Slide
            title="All of this is secured on the blockchain to prevent tampering."
            chrome={false}
          />
        </TransitionSeries.Sequence>
        {handoff}
        <TransitionSeries.Sequence name="Flow 4 Ledger" durationInFrames={300}>
          <Clip shot="4" surface="Portal" file="flow-4.mp4" />
        </TransitionSeries.Sequence>
        {handoff}

        <TransitionSeries.Sequence name="Close" durationInFrames={180}>
          <Slide
            title="A secure ledger of vehicle ownership."
            lockup
            chrome={false}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
