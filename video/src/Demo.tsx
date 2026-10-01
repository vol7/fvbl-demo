import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Easing } from "remotion";
import { AudienceContext, type Audience } from "./audience";
import { Clip, ReviewContext } from "./Clip";
import { MapPeers } from "./MapPeers";
import { Opening } from "./Opening";
import { Poster } from "./Poster";
import { LINES, type Line } from "./lines";
import { Soundtrack } from "./Soundtrack";
import { Voice } from "./Voice";
import { settle } from "./settle";
import { whip } from "./whip";
import { Backdrop, Slide } from "./Slide";

/**
 * The v5 cut, per the 2026-09-18 review. Screenplay: docs/screenplay.md.
 *
 * The hero, the happy path from the dealer's first registration to the issued
 * package, the map, one bridge card, three catches, the close. The voice
 * follows the screen: one line per action, each starting on the frame its
 * action happens (`lines.ts`). Title cards open each act of the happy path;
 * the three catches run as one sequence after the bridge, with no card or
 * label of their own (2026-09-30), and whip pans between them.
 *
 * Every other hand-off is `settle` (16 frames); a whip pan is 12. Clip
 * lengths are screenplay targets until the takes are recorded; `pnpm
 * durations` prints the real ones. Composition total in Root.tsx = sum of
 * sequences minus the length of every transition.
 */

/**
 * The recorded shots' lengths in frames, per version. The US takes
 * (2026-09-30) run to their own recording, so each version has its own cut;
 * Canada's are the screenplay targets its takes were directed to. `pnpm
 * durations` adds these to the fixed sequences for each version's total.
 */
export const SHOTS = {
  ca: { flow0: 360, flow1a: 716, flow1b: 571, flow2a: 345, flow2b: 270, flow2c: 360, flow2d: 420, flow3a: 810, flow3b: 495, flow3c: 510, flow3d: 600 },
  us: { flow0: 732, flow1a: 640, flow1b: 513, flow2a: 420, flow2b: 279, flow2c: 381, flow2d: 191, flow3a: 930, flow3b: 495, flow3c: 510 },
} satisfies Record<Audience, Record<string, number>>;

const handoff = (
  <TransitionSeries.Transition
    presentation={settle()}
    timing={linearTiming({
      durationInFrames: 16,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    })}
  />
);

/**
 * Between one catch and the next: a whip pan, so the switch to a new car
 * reads at once (2026-09-30), where the settle would blur them together.
 */
const whipPan = (
  <TransitionSeries.Transition
    presentation={whip()}
    timing={linearTiming({
      durationInFrames: 12,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    })}
  />
);

/**
 * Into the Canada cut's fourth catch, the border (3d). The same whip pan; its
 * own name so `pnpm durations` counts it for Canada only.
 */
const caWhipPan = whipPan;

/**
 * Once, on the shot where the sources first answer (2b). The voice keeps its
 * conditional wording throughout, and the close card repeats the point, so
 * the other shots carry no note (2026-09-29: six notes read as overbearing).
 */
const SOURCES_CAVEAT =
  "Concept. The data sources shown are illustrative, and no data-sharing agreements are in place.";

/** The bridge card: Canada's cut has a fourth catch, at the border. */
const BRIDGE = {
  ca: "Four cars FVBL would flag.",
  us: "Three cars FVBL would flag.",
} satisfies Record<Audience, string>;

/** The hero's lockup line, the same in both versions. */
const HERO_SHARED = {
  hero: "A secure ledger of vehicle ownership.",
};

/**
 * The act cards, per version: each is a plain sentence, and names what that
 * country's flow does (a first title and an owner confirming in the US;
 * registration and consent in Ontario).
 */
const CARDS = {
  ca: {
    dealer: ["Registration", "Every new car starts on the ledger."],
    buyer: ["The request", "A buyer asks to see the car's history."],
    owner: ["Consent", "The owner approves by text."],
  },
  us: {
    dealer: ["First title", "Every new car starts on the ledger."],
    buyer: ["The request", "A buyer asks the owner to confirm."],
    owner: ["Confirmation", "The owner confirms by text."],
  },
} satisfies Record<Audience, unknown>;

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
 * agency, which a count of what they miss would. The turn card says some of
 * those cars carry a copied VIN; the voice under it names the crime, not a
 * gap.
 */
export const HEROES = {
  ca: {
    ...HERO_SHARED,
    stat: 372000,
    statLabel: "vehicles in Canada may carry a cloned VIN.",
    statFollow: "Each one uses a real car's identity.",
    source: "Source: CARFAX Canada, 2025 Year in Rear View",
    sources: ["Government records", "Insurance records", "Border records"],
    turn: "On paper, they look like the real thing.",
  },
  us: {
    ...HERO_SHARED,
    stat: 38_500_000,
    statLabel: "used cars change hands in the US every year.",
    statFollow: "Every sale relies on the VIN.",
    source: "Source: Cox Automotive, 2026 used-vehicle forecast",
    // State, not "government": the states keep their own records.
    sources: ["State records", "Insurance records", "Border records"],
    turn: "Some of them carry a copied VIN.",
  },
} satisfies Record<Audience, unknown>;

export type DemoProps = { audience: Audience; showScript: boolean };

export const Demo: React.FC<DemoProps> = ({ audience, showScript }) => {
  const voice = (lines: Line[]) => (
    <Voice lines={lines} showScript={showScript} />
  );

  return (
    <AudienceContext.Provider value={audience}>
      <ReviewContext.Provider value={showScript}>
        <AbsoluteFill name="Stage">
          <Backdrop />
          <Soundtrack />
          <TransitionSeries name="FVBL demo">
            <TransitionSeries.Sequence name="Poster" durationInFrames={75}>
              <Poster />
            </TransitionSeries.Sequence>
            {handoff}
            <TransitionSeries.Sequence name="Opening" durationInFrames={885}>
              <Opening {...HEROES[audience]} />
              {voice(LINES.hero)}
            </TransitionSeries.Sequence>
            {handoff}

            {/* ── The dealer ────────────────────────────────────────────── */}
            <TransitionSeries.Sequence name="Dealer" durationInFrames={120}>
              <Slide
                eyebrow={CARDS[audience].dealer[0]}
                title={CARDS[audience].dealer[1]}
                chrome={false}
              />
              {voice(LINES.dealerCard)}
            </TransitionSeries.Sequence>
            {handoff}
            <TransitionSeries.Sequence
              name="Flow 0 Dealer"
              durationInFrames={SHOTS[audience].flow0}
            >
              <Clip shot="0" surface="Dealer portal" file="flow-0.mp4" />
              {voice(LINES.dealer)}
            </TransitionSeries.Sequence>
            {handoff}

            {/* ── The buyer ─────────────────────────────────────────────── */}
            <TransitionSeries.Sequence name="Buyer" durationInFrames={120}>
              <Slide
                eyebrow={CARDS[audience].buyer[0]}
                title={CARDS[audience].buyer[1]}
                chrome={false}
              />
            </TransitionSeries.Sequence>
            {handoff}
            <TransitionSeries.Sequence
              name="Flow 1a ServiceOntario"
              durationInFrames={SHOTS[audience].flow1a}
            >
              <Clip
                shot="1a"
                surface="ServiceOntario"
                file="flow-1a.mp4"
                // Canada's kept take is the saved ontario.ca page, played
                // fast; the Ohio title search is the demo app, at 1x.
                playbackRate={audience === "ca" ? 1.5 : 1}
                watermark={
                  audience === "ca"
                    ? "Concept mock-up. Not an Ontario government page."
                    : undefined
                }
              />
              {voice(LINES.buyer)}
            </TransitionSeries.Sequence>
            {handoff}

            {/* ── The owner ─────────────────────────────────────────────── */}
            <TransitionSeries.Sequence name="Owner" durationInFrames={120}>
              <Slide
                eyebrow={CARDS[audience].owner[0]}
                title={CARDS[audience].owner[1]}
                chrome={false}
              />
            </TransitionSeries.Sequence>
            {handoff}
            <TransitionSeries.Sequence
              name="Flow 1b Phone"
              durationInFrames={SHOTS[audience].flow1b}
            >
              <Clip shot="1b" surface="Phone" file="flow-1b.mp4" />
              {voice(LINES.owner)}
            </TransitionSeries.Sequence>
            {handoff}

            {/* ── The clerk ─────────────────────────────────────────────── */}
            <TransitionSeries.Sequence name="Clerk" durationInFrames={120}>
              <Slide
                eyebrow="At the counter"
                title="The clerk sees every check on one screen."
                chrome={false}
              />
            </TransitionSeries.Sequence>
            {handoff}
            <TransitionSeries.Sequence
              name="Flow 2a Portal landing"
              durationInFrames={SHOTS[audience].flow2a}
            >
              <Clip shot="2a" surface="Portal" file="flow-2a.mp4" />
              {voice(LINES.clerkLanding)}
            </TransitionSeries.Sequence>
            {/* No transition: 2a to 2d are one take, and the next part starts where this one ends. */}
            <TransitionSeries.Sequence
              name="Flow 2b Portal checks"
              durationInFrames={SHOTS[audience].flow2b}
            >
              <Clip
                shot="2b"
                surface="Portal"
                file="flow-2b.mp4"
                caveat={SOURCES_CAVEAT}
              />
              {voice(LINES.clerkChecks)}
            </TransitionSeries.Sequence>
            {/* No transition: 2a to 2d are one take, and the next part starts where this one ends. */}
            <TransitionSeries.Sequence
              name="Flow 2c Portal history"
              durationInFrames={SHOTS[audience].flow2c}
            >
              <Clip shot="2c" surface="Portal" file="flow-2c.mp4" />
              {voice(LINES.clerkHistory)}
            </TransitionSeries.Sequence>
            {/* No transition: 2a to 2d are one take, and the next part starts where this one ends. */}
            <TransitionSeries.Sequence
              name="Flow 2d Portal reveal and issue"
              durationInFrames={SHOTS[audience].flow2d}
            >
              <Clip shot="2d" surface="Portal" file="flow-2d.mp4" />
              {voice(LINES.clerkIssue)}
            </TransitionSeries.Sequence>
            {handoff}

            {/* ── The network ───────────────────────────────────────────── */}
            {/* Before the catches (2026-09-30): the sharing it shows is what
              lets each catch happen, so the catches pay it off. */}
            <TransitionSeries.Sequence name="Map" durationInFrames={525}>
              {/* Each cut's own map, with no hub, and the neighbour drawn
                whole (the US 2026-09-29, Canada 2026-09-30). */}
              <MapPeers variant="join" country={audience} />
              {voice(LINES.map)}
            </TransitionSeries.Sequence>
            {handoff}

            {/* ── The catches ───────────────────────────────────────────── */}
            <TransitionSeries.Sequence name="Bridge" durationInFrames={240}>
              <Slide
                eyebrow="The catches"
                title={BRIDGE[audience]}
                chrome={false}
              />
              {voice(LINES.bridge)}
            </TransitionSeries.Sequence>
            {handoff}
            <TransitionSeries.Sequence
              name="Flow 3a Export"
              durationInFrames={SHOTS[audience].flow3a}
            >
              <Clip shot="3a" surface="Portal" file="flow-3a.mp4" />
              {voice(LINES.export)}
            </TransitionSeries.Sequence>
            {whipPan}
            <TransitionSeries.Sequence
              name="Flow 3b US title"
              durationInFrames={SHOTS[audience].flow3b}
            >
              <Clip shot="3b" surface="Portal" file="flow-3b.mp4" />
              {voice(LINES.usTitle)}
            </TransitionSeries.Sequence>
            {whipPan}
            <TransitionSeries.Sequence
              name="Flow 3c Write-off"
              durationInFrames={SHOTS[audience].flow3c}
            >
              <Clip shot="3c" surface="Portal" file="flow-3c.mp4" />
              {voice(LINES.writeOff)}
            </TransitionSeries.Sequence>
            {/* Canada only (2026-09-30 call): the CBSA officer's card for a
              truck its owner never agreed to ship. The US cut goes straight
              from 3c to the close. */}
            {audience === "ca" ? (
              <>
                {caWhipPan}
                <TransitionSeries.Sequence
                  name="Flow 3d Border"
                  durationInFrames={SHOTS.ca.flow3d}
                >
                  <Clip shot="3d" surface="CBSA officer" file="flow-3d.mp4" />
                  {voice(LINES.border)}
                </TransitionSeries.Sequence>
              </>
            ) : null}
            {handoff}

            {/* ── Close ─────────────────────────────────────────────────── */}
            <TransitionSeries.Sequence name="Close" durationInFrames={180}>
              <Slide
                title="A secure ledger of vehicle ownership."
                lockup
                chrome={false}
                note="Concept demonstration. All data is fictional, and no data-sharing agreements are in place."
              />
              {voice(LINES.close)}
            </TransitionSeries.Sequence>
          </TransitionSeries>
        </AbsoluteFill>
      </ReviewContext.Provider>
    </AudienceContext.Provider>
  );
};
