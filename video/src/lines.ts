import type { Audience } from "./audience";

/**
 * The voiceover, one line per on-screen action, keyed by scene. `at` is the
 * frame within the scene where the line starts, set to the moment its action
 * happens: the kept 1a take was timed from the recording, the takes still to
 * record are directed to hit these marks (docs/screenplay.md). Each line is a
 * separate file, `public/audio/vo/<audience>/<id>.wav`, so one change means
 * one new take. The spoken forms for ElevenLabs are in docs/voiceover.md.
 *
 * There are two versions, Canada-first and US-first, on the same marks. A line
 * with one text is read the same in both, and the US cut plays its Canada
 * take (Voice.tsx), so the US footage is recorded shot for shot to Canada's
 * marks. A line that names an agency, a document or a country has one text
 * per version. Both texts must fit the same room. Never "south of" the
 * border; the ledger's location is never stated.
 *
 * `US_DRAFT` marks the US texts written for the Ohio flow (docs/us-version.md)
 * ahead of its footage: check each against the recorded shot.
 *
 * The US takes recorded on 2026-09-30 run to their own timing, so the lines
 * over them carry a mark per version: `{ ca, us }`. `null` leaves the line out
 * of that version.
 */
export type Line = {
  id: string;
  at: number | Record<Audience, number | null>;
  text: string | Record<Audience, string>;
};

/** What the line says in this version. */
export function say(line: Line, audience: Audience): string {
  return typeof line.text === "string" ? line.text : line.text[audience];
}

/** Where the line starts in this version, or null when this version skips it. */
export function mark(line: Line, audience: Audience): number | null {
  return typeof line.at === "number" ? line.at : line.at[audience];
}

export const LINES = {
  hero: [
    {
      id: "01-hero-stat",
      at: 10,
      text: {
        ca: "More than 372,000 vehicles in Canada may carry a cloned VIN. Each one uses a real car's identity.",
        us: "38.5 million used cars change hands in the US every year. Every sale relies on the VIN.",
      },
    },
    {
      id: "02-hero-problem",
      // Canada 8 frames later: Victoria's 01 runs 8.1 s (2026-09-30).
      at: { ca: 258, us: 250 },
      text: {
        ca: "Crime rings clone VINs to sell stolen cars, here and across the border.",
        us: "Some of them carry a copied VIN. Crime rings forge titles to match.",
      },
    },
    {
      id: "03-hero-mission",
      at: 420,
      text: "FVBL is built to catch them at the counter.",
    },
    {
      id: "04-hero-ledger",
      at: 520,
      text: {
        ca: "With the right agreements, it checks each car against government, insurance and border records.",
        us: "With the right agreements, it checks each car against state, insurance and border records.",
      },
    },
    {
      id: "04b-hero-secure",
      at: 695,
      text: "Its history goes on a secure ledger, where no one can change a record without it showing.",
    },
  ],
  // Over the first card: hands over from the intro to the clean flow.
  dealerCard: [
    { id: "04c-dealer-card", at: 10, text: "First, let's look at a clean sale." },
  ],
  dealer: [
    { id: "05-dealer-vin", at: { ca: 10, us: 36 }, text: "A dealer enters a new car's VIN." },
    {
      id: "06-dealer-submit",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 90, us: 150 },
      text: {
        ca: "They add the first owner and send it to the ministry.",
        us: "They add the first owner and submit the first title.",
      },
    },
    { id: "07-dealer-text", at: { ca: 186, us: 408 }, text: "A text confirms it's really them." },
    {
      id: "08-dealer-recorded",
      at: { ca: 262, us: 621 },
      text: "This is the car's first entry on the ledger.",
    },
  ],
  buyer: [
    {
      id: "09-buyer-start",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 10, us: 6 },
      text: {
        ca: "Now say you're buying a used car. FVBL can show that its history hasn't been tampered with.",
        us: "Now say you're buying a used car. FVBL can confirm the seller is the real owner.",
      },
    },
    {
      id: "10-buyer-vin",
      at: { ca: 210, us: 183 },
      // US_DRAFT: written for the Ohio flow; check against its footage.
      text: {
        ca: "On ServiceOntario, you enter the car's VIN.",
        us: "On the state's title search, you enter the car's VIN.",
      },
    },
    {
      id: "11-buyer-details",
      at: { ca: 380, us: 297 },
      // US_DRAFT: Ohio's title search shows title status only, not the car.
      text: {
        ca: "It finds the car. Then you add your own details.",
        us: "It finds the title. Then you add your own details.",
      },
    },
    {
      id: "12-buyer-private",
      at: { ca: 530, us: 441 },
      text: "You never need the owner's name or number.",
    },
    {
      id: "13-buyer-send",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 630, us: 539 },
      text: {
        ca: "MTO sends the request on.",
        us: "The state sends it to the owner.",
      },
    },
  ],
  owner: [
    {
      id: "14-owner-text",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 10, us: 15 },
      text: {
        ca: "The owner gets a text from MTO. It says who's asking, and for which car.",
        us: "The owner gets the title alert they signed up for. It says who's asking, and for which car.",
      },
    },
    {
      id: "15-owner-open",
      at: { ca: 210, us: 198 },
      text: "They open the link and see the request.",
    },
    {
      id: "16-owner-approve",
      // Just before the tap on Approve; the shot then holds on the
      // confirmation with no line over it (2026-09-30: "FVBL records it." cut).
      at: { ca: 320, us: 288 },
      // US_DRAFT: a US buyer only sees that the owner confirmed.
      text: {
        ca: "If they approve, the buyer gets the car's history and none of their personal details.",
        us: "If they approve, the buyer sees that the owner confirmed, and nothing about who they are.",
      },
    },
  ],
  clerkLanding: [
    {
      id: "18-clerk-lookup",
      at: { ca: 10, us: 75 },
      text: "At the counter, the clerk looks up the car.",
    },
    {
      id: "19-clerk-green",
      at: { ca: 150, us: 237 },
      // US_DRAFT: the US card reads "Owner confirmed".
      text: {
        ca: "It's green. Every check passed, and the owner has approved.",
        us: "It's green. Every check passed, and the owner confirmed the sale.",
      },
    },
  ],
  clerkChecks: [
    {
      id: "20-clerk-sources",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 10, us: 9 },
      text: {
        ca: "With the right agreements, insurers, Carfax and border records sit next to the ministry's own.",
        us: "With the right agreements, border, theft and out-of-state title records sit next to the state's own.",
      },
    },
  ],
  clerkHistory: [
    {
      id: "21-clerk-history",
      at: { ca: 10, us: 33 },
      text: "Together, they make up the car's history.",
    },
    {
      id: "22-clerk-certified",
      at: { ca: 170, us: 209 },
      text: "Each event is certified on the ledger. If anyone changed it, the check would fail.",
    },
  ],
  clerkIssue: [
    {
      id: "23-clerk-reveal",
      // The US take skips the reveal: 2d is only the return to the green card.
      at: { ca: 10, us: null },
      text: "The owner's details stay hidden until the clerk needs them. FVBL logs each reveal to their badge.",
    },
    {
      id: "24-clerk-issued",
      at: { ca: 240, us: 9 },
      // US_DRAFT: FVBL informs; the county clerk issues the title.
      text: {
        ca: "Everything checks out. Package issued.",
        us: "Everything checks out, so the clerk issues the title.",
      },
    },
  ],
  // Before the bridge: the sharing that each catch then relies on.
  map: [
    // Each cut names only its own regions; the map shows the neighbour joining.
    {
      id: "36-map-ledger",
      at: 10,
      text: {
        ca: "Every province and territory can connect to the same ledger.",
        us: "Every state can connect to the same ledger.",
      },
    },
    {
      id: "37-map-connect",
      // Canada 4 frames later: Victoria's 36 runs 3.36 s (2026-09-30).
      at: { ca: 114, us: 110 },
      text: {
        ca: "With the right agreements, neighbouring countries can join too. Cars that cross the border keep their history.",
        us: "With the right agreements, neighboring countries can join too. Cars that cross the border keep their history.",
      },
    },
    {
      id: "38-map-border",
      at: 332,
      text: {
        ca: "A flag raised in one province can reach every other, and across the border.",
        us: "A flag raised in one state can reach every other, and across the border.",
      },
    },
  ],
  bridge: [
    {
      // After the map (2026-09-30): "these sources" are the records it just
      // showed connecting. A new id, so the old take's words don't play.
      // The US cut only: Canada has a fourth catch at the border.
      id: "25-bridge-sources",
      at: { ca: null, us: 14 },
      text: "With these sources connected, here are three cars FVBL would flag.",
    },
    {
      // Canada's, with catch 3d at the border (2026-09-30 call). Its own id,
      // so the US keeps playing the three-car take.
      id: "25c-bridge-four",
      at: { ca: 14, us: null },
      text: "With these sources connected, here are four cars FVBL would flag.",
    },
  ],
  export: [
    {
      id: "26-export-flag",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 10, us: 123 },
      text: {
        ca: "This SUV is clean in Ontario's own records. But with CBSA export records connected, FVBL sees it was reported leaving Canada.",
        us: "This SUV is clean in the state's own records. But with CBP export records connected, FVBL sees it was reported leaving the US.",
      },
    },
    {
      id: "27-export-strip",
      at: { ca: 305, us: 411 },
      text: "Its history ends at the border, with no record of it coming back.",
    },
    {
      id: "28-export-question",
      at: { ca: 450, us: 570 },
      text: "So either that record is wrong, or this car isn't the one the VIN belongs to.",
    },
    {
      id: "29-export-refer",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 645, us: 768 },
      text: {
        ca: "The clerk holds the package and refers the file to MTO investigators.",
        us: "The clerk holds the title and refers the file to state investigators.",
      },
    },
  ],
  usTitle: [
    {
      id: "30-us-clean",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 10, us: 9 },
      text: {
        ca: "This car is clean in Ontario too.",
        us: "This car's title looks clean too.",
      },
    },
    {
      id: "31-us-nmvtis",
      at: { ca: 120, us: 113 },
      // US_DRAFT: catch 2 flips: the VIN is active in Ontario.
      text: {
        ca: "With access to NMVTIS, the US federal title database, the check also looks across the border.",
        us: "With Canadian registration records connected, the check also looks across the border.",
      },
    },
    {
      id: "32-us-title",
      at: { ca: 315, us: 284 },
      // US_DRAFT.
      text: {
        ca: "There's an active title for this VIN in Pennsylvania. The package is on hold.",
        us: "This VIN is active on an Ontario registration, so the clerk holds it for review.",
      },
    },
  ],
  writeOff: [
    {
      id: "33-writeoff-brand",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 10, us: 9 },
      text: {
        ca: "Ontario already brands written-off cars.",
        us: "States already brand salvage cars.",
      },
    },
    {
      id: "34-writeoff-loss",
      at: { ca: 100, us: 107 },
      // US_DRAFT: the brand record shows the Kentucky salvage title.
      text: {
        ca: "Insurer records show this one was written off last year.",
        us: "This one was branded salvage in Kentucky in 2024.",
      },
    },
    {
      id: "35-writeoff-plate",
      // US_DRAFT: written for the Ohio flow; check against its footage.
      at: { ca: 270, us: 303 },
      text: {
        ca: "Now its VIN is on a second Ontario plate. That's a write-off coming back under another identity.",
        us: "Now this VIN has a clean title in another state. That's a salvage car passing as clean.",
      },
    },
  ],
  // Canada only (2026-09-30 call with Policaro): the CBSA officer's card for the
  // RAM 1500, recorded after its owner said no (Force state "Export: owner said
  // no"). A catch like the others: one car, one red card.
  border: [
    {
      id: "40-border-ledger",
      // On the list of declared vehicles, then the click into the RAM's card.
      at: { ca: 10, us: null },
      text: "With the right agreements, CBSA can check the same ledger before a car is loaded.",
    },
    {
      id: "41-border-owner",
      // On the card: the permit and stolen cells, then "Said no".
      at: { ca: 215, us: null },
      text: "This truck's permit is real, and it isn't reported stolen. But its owner was asked by text, and said no.",
    },
    {
      id: "42-border-container",
      // On the container number, as the officer holds it for examination.
      at: { ca: 465, us: null },
      text: "So officers know which container to open.",
    },
  ],
  close: [
    {
      id: "39-close",
      at: 10,
      text: "FVBL. A secure ledger of vehicle ownership.",
    },
  ],
} satisfies Record<string, Line[]>;

/** Speaking pace for the estimates, 155 words a minute, in frames per word. */
const FRAMES_PER_WORD = (30 * 60) / 155;

/** Roughly how long a line runs, for captions and the timing check. */
export function estimate(text: string): number {
  // Initialisms are read letter by letter, so each letter counts as a word.
  const words = text
    .split(/\s+/)
    .reduce(
      (n, w) =>
        n + (/^[A-Z]{2,}\W*$/.test(w) ? w.replace(/\W/g, "").length * 0.6 : 1),
      0,
    );
  return Math.round(words * FRAMES_PER_WORD);
}
