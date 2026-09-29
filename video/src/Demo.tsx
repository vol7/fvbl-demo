import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Easing } from "remotion";
import { AudienceContext, type Audience } from "./audience";
import { Clip } from "./Clip";
import { MapScene } from "./MapScene";
import { Opening } from "./Opening";
import { LINES, type Line } from "./lines";
import { Soundtrack } from "./Soundtrack";
import { Voice } from "./Voice";
import { settle } from "./settle";
import { Backdrop, Slide } from "./Slide";

/**
 * The v5 cut, per the 2026-09-18 review. Screenplay: docs/screenplay.md.
 *
 * The hero, the happy path from the dealer's first registration to the issued
 * package, one bridge card, three catches, the map, the close. The voice
 * follows the screen: one line per action, each starting on the frame its
 * action happens (`lines.ts`). Title cards open each act of the happy path;
 * the catches name themselves with a corner label instead, so the three run
 * as one sequence after the bridge.
 *
 * Every hand-off is `settle` (16 frames). Clip lengths are screenplay targets
 * until the takes are recorded; `pnpm durations` prints the real ones.
 * Composition total in Root.tsx = sum of sequences minus 16 per handoff.
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

/** On every shot that shows an insurer, Carfax, federal or cross-border source. */
const SOURCES_CAVEAT =
  "Concept. Third-party, federal and cross-border sources are illustrative. No data-sharing agreements are in place.";

/** The hero's last two beats, the same in both versions. */
const HERO_SHARED = {
  mission: "Built to catch it at the registration counter.",
  hero: "A secure ledger of vehicle ownership.",
};

/**
 * The hero, per version: each opens on a figure from its own country.
 *
 * Canada's is CARFAX Canada's estimate of vehicles in Canada carrying
 * potentially cloned VINs, from its 2025 Year in Rear View (2025-11-25):
 * "more than 372,000". FVBL checks identity at registration, not theft, so
 * the hero leads with cloning rather than theft figures.
 *
 * No one publishes a US count of cloned VINs, so the US version leads with
 * the size of what cloning preys on: Cox Automotive's forecast of 38.5
 * million used-vehicle sales in 2026 (updated 2026-09-24). It blames no
 * agency, which a count of what they miss would. The turn card says the VIN
 * can lie; the voice under it names the crime, not a gap.
 */
export const HEROES = {
  ca: {
    ...HERO_SHARED,
    stat: 372000,
    statLabel: "vehicles in Canada may carry a cloned VIN.",
    statFollow: "Each one borrows a real car's identity.",
    source: "Source: CARFAX Canada, 2025 Year in Rear View",
    turn: "The same trick crosses the border.",
  },
  us: {
    ...HERO_SHARED,
    stat: 38_500_000,
    statLabel: "used cars change hands in the US every year.",
    statFollow: "Every sale trusts the VIN.",
    source: "Source: Cox Automotive, 2026 used-vehicle forecast",
    turn: "Not every VIN tells the truth.",
  },
} satisfies Record<Audience, unknown>;

export type DemoProps = { audience: Audience; showScript: boolean };

export const Demo: React.FC<DemoProps> = ({ audience, showScript }) => {
  const voice = (lines: Line[]) => (
    <Voice lines={lines} showScript={showScript} />
  );

  return (
    <AudienceContext.Provider value={audience}>
      <AbsoluteFill name="Stage">
        <Backdrop />
        <Soundtrack />
        <TransitionSeries name="FVBL demo">
          <TransitionSeries.Sequence name="Opening" durationInFrames={810}>
            <Opening {...HEROES[audience]} />
            {voice(LINES.hero)}
          </TransitionSeries.Sequence>
          {handoff}

          {/* ── The dealer ────────────────────────────────────────────── */}
          <TransitionSeries.Sequence name="Dealer" durationInFrames={75}>
            <Slide
              eyebrow="Registration"
              title="Day one, on the ledger."
              chrome={false}
            />
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 0 Dealer"
            durationInFrames={360}
          >
            <Clip shot="0" surface="Dealer portal" file="flow-0.mp4" />
            {voice(LINES.dealer)}
          </TransitionSeries.Sequence>
          {handoff}

          {/* ── The buyer ─────────────────────────────────────────────── */}
          <TransitionSeries.Sequence name="Buyer" durationInFrames={90}>
            <Slide
              eyebrow="The request"
              title="The buyer asks."
              chrome={false}
            />
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 1a ServiceOntario"
            durationInFrames={716}
          >
            <Clip
              shot="1a"
              surface="ServiceOntario"
              file="flow-1a.mp4"
              playbackRate={1.5}
              watermark="Concept mock-up. Not an Ontario government page."
            />
            {voice(LINES.buyer)}
          </TransitionSeries.Sequence>
          {handoff}

          {/* ── The owner ─────────────────────────────────────────────── */}
          <TransitionSeries.Sequence name="Owner" durationInFrames={75}>
            <Slide
              eyebrow="Consent"
              title="The owner says yes."
              chrome={false}
            />
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 1b Phone"
            durationInFrames={571}
          >
            <Clip shot="1b" surface="Phone" file="flow-1b.mp4" />
            {voice(LINES.owner)}
          </TransitionSeries.Sequence>
          {handoff}

          {/* ── The clerk ─────────────────────────────────────────────── */}
          <TransitionSeries.Sequence name="Clerk" durationInFrames={90}>
            <Slide
              eyebrow="At the counter"
              title="Every check. One screen."
              chrome={false}
            />
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 2a Portal landing"
            durationInFrames={390}
          >
            <Clip
              shot="2a"
              surface="Portal"
              file="flow-2a.mp4"
              caveat={SOURCES_CAVEAT}
            />
            {voice(LINES.clerkLanding)}
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 2b Portal checks"
            durationInFrames={270}
          >
            <Clip
              shot="2b"
              surface="Portal"
              file="flow-2b.mp4"
              caveat={SOURCES_CAVEAT}
            />
            {voice(LINES.clerkChecks)}
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 2c Portal history"
            durationInFrames={360}
          >
            <Clip shot="2c" surface="Portal" file="flow-2c.mp4" />
            {voice(LINES.clerkHistory)}
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 2d Portal reveal and issue"
            durationInFrames={480}
          >
            <Clip shot="2d" surface="Portal" file="flow-2d.mp4" />
            {voice(LINES.clerkIssue)}
          </TransitionSeries.Sequence>
          {handoff}

          {/* ── The catches ───────────────────────────────────────────── */}
          <TransitionSeries.Sequence name="Bridge" durationInFrames={135}>
            <Slide
              eyebrow="Three catches"
              title="When a VIN doesn't add up."
              chrome={false}
            />
            {voice(LINES.bridge)}
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 3a Export"
            durationInFrames={900}
          >
            <Clip
              shot="3a"
              surface="Portal"
              file="flow-3a.mp4"
              caveat={SOURCES_CAVEAT}
              label={{
                eyebrow: "Catch 1 of 3",
                title: "Exported. No re-entry.",
              }}
            />
            {voice(LINES.export)}
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 3b US title"
            durationInFrames={555}
          >
            <Clip
              shot="3b"
              surface="Portal"
              file="flow-3b.mp4"
              caveat={SOURCES_CAVEAT}
              label={{
                eyebrow: "Catch 2 of 3",
                title: "One VIN. Two countries.",
              }}
            />
            {voice(LINES.usTitle)}
          </TransitionSeries.Sequence>
          {handoff}
          <TransitionSeries.Sequence
            name="Flow 3c Write-off"
            durationInFrames={510}
          >
            <Clip
              shot="3c"
              surface="Portal"
              file="flow-3c.mp4"
              caveat={SOURCES_CAVEAT}
              label={{
                eyebrow: "Catch 3 of 3",
                title: "Written off. On a second plate.",
              }}
            />
            {voice(LINES.writeOff)}
          </TransitionSeries.Sequence>
          {handoff}

          {/* ── Close ─────────────────────────────────────────────────── */}
          <TransitionSeries.Sequence name="Map" durationInFrames={525}>
            <MapScene note={SOURCES_CAVEAT} />
            {voice(LINES.map)}
          </TransitionSeries.Sequence>
          {handoff}

          <TransitionSeries.Sequence name="Close" durationInFrames={180}>
            <Slide
              title="A secure ledger of vehicle ownership."
              lockup
              chrome={false}
              note="Concept demonstration. All data is fictional."
            />
            {voice(LINES.close)}
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>
    </AudienceContext.Provider>
  );
};
