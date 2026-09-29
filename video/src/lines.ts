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
 * with one text is read the same in both. A line that names an agency or a
 * country has one text per version: MTO for Canada, the DMV for the US. Both
 * texts must fit the same room. Never "south of" the border; the ledger's
 * location is never stated.
 */
export type Line = {
  id: string;
  at: number;
  text: string | Record<Audience, string>;
};

/** What the line says in this version. */
export function say(line: Line, audience: Audience): string {
  return typeof line.text === "string" ? line.text : line.text[audience];
}

export const LINES = {
  hero: [
    {
      id: "01-hero-stat",
      at: 10,
      text: {
        ca: "More than 372,000 vehicles in Canada may carry a cloned VIN. Each one borrows a real car's identity.",
        us: "38.5 million used cars change hands in the US every year. Every sale trusts the VIN.",
      },
    },
    {
      id: "02-hero-problem",
      at: 250,
      text: {
        ca: "The same trick crosses the border.",
        us: "Crime rings clone VINs and forge titles so stolen cars pass as clean.",
      },
    },
    {
      id: "03-hero-mission",
      at: 390,
      text: "FVBL is built to catch it at the counter.",
    },
    {
      id: "04-hero-ledger",
      at: 530,
      text: "With the right agreements, it checks a car against government, insurance and border records, and keeps its history on a secure ledger.",
    },
  ],
  dealer: [
    { id: "05-dealer-vin", at: 10, text: "A dealer enters a new car's VIN." },
    {
      id: "06-dealer-submit",
      at: 105,
      text: "They confirm the first owner and send it in.",
    },
    { id: "07-dealer-text", at: 215, text: "Then they confirm it by text." },
    { id: "08-dealer-recorded", at: 290, text: "Registration recorded." },
  ],
  buyer: [
    {
      id: "09-buyer-start",
      at: 10,
      text: {
        ca: "Now say you're buying a used car. You start on ServiceOntario.",
        us: "Now say you're buying a used car. Here, you start on ServiceOntario, Ontario's DMV.",
      },
    },
    {
      id: "10-buyer-vin",
      at: 210,
      text: "You're the buyer, so you enter the car's VIN.",
    },
    {
      id: "11-buyer-details",
      at: 380,
      text: "It finds the car. Then you add your own details.",
    },
    {
      id: "12-buyer-private",
      at: 530,
      text: "You never need the owner's name or number.",
    },
    {
      id: "13-buyer-send",
      at: 630,
      text: {
        ca: "MTO sends the request on.",
        us: "The DMV sends it on.",
      },
    },
  ],
  owner: [
    {
      id: "14-owner-text",
      at: 10,
      text: {
        ca: "The owner gets a text from MTO. It says who's asking, and for which car.",
        us: "The owner gets a text from the DMV. It says who's asking, and for which car.",
      },
    },
    {
      id: "15-owner-open",
      at: 210,
      text: "They open the link and see the request.",
    },
    {
      id: "16-owner-approve",
      at: 320,
      text: "If they approve, the buyer gets the car's history and none of their personal details.",
    },
    { id: "17-owner-recorded", at: 498, text: "FVBL records it." },
  ],
  clerkLanding: [
    {
      id: "18-clerk-lookup",
      at: 10,
      text: "At the counter, the clerk looks up the car.",
    },
    {
      id: "19-clerk-green",
      at: 150,
      text: "It's green. Every check passed, and the owner has approved.",
    },
  ],
  clerkChecks: [
    {
      id: "20-clerk-sources",
      at: 10,
      text: {
        ca: "With the right agreements, insurers, Carfax and border records sit next to the ministry's own.",
        us: "With the right agreements, insurers, Carfax and border records sit next to the DMV's own.",
      },
    },
  ],
  clerkHistory: [
    {
      id: "21-clerk-history",
      at: 10,
      text: "Together, they make up the car's history.",
    },
    {
      id: "22-clerk-certified",
      at: 170,
      text: "Each event is certified on the ledger. If anyone changed it, the check would fail.",
    },
  ],
  clerkIssue: [
    {
      id: "23-clerk-reveal",
      at: 10,
      text: "The owner's details stay hidden until the clerk needs them. FVBL logs each reveal to their badge.",
    },
    {
      id: "24-clerk-issued",
      at: 300,
      text: "Everything checks out. Package issued.",
    },
  ],
  bridge: [
    {
      id: "25-bridge",
      at: 14,
      text: "Here are three cars that today's counter checks would clear.",
    },
  ],
  export: [
    {
      id: "26-export-flag",
      at: 10,
      text: {
        ca: "This SUV is clean in Ontario's own records. But with CBSA export records connected, FVBL sees it was reported leaving Canada.",
        us: "This SUV is clean in the DMV's own records. But with Canadian border records connected, FVBL sees it was reported leaving Canada.",
      },
    },
    {
      id: "27-export-strip",
      at: 305,
      text: "Its history ends at the border, with no record of it coming back.",
    },
    {
      id: "28-export-question",
      at: 480,
      text: "So either that record is wrong, or this car isn't the one the VIN belongs to.",
    },
    {
      id: "29-export-refer",
      at: 690,
      text: {
        ca: "The clerk holds the package and refers the file to MTO investigators.",
        us: "The clerk holds the package and refers the file to the DMV's investigators.",
      },
    },
  ],
  usTitle: [
    {
      id: "30-us-clean",
      at: 10,
      text: {
        ca: "This car is clean in Ontario too.",
        us: "This car's DMV record is clean too.",
      },
    },
    {
      id: "31-us-nmvtis",
      at: 120,
      text: "With access to NMVTIS, the US federal title database, the check also looks across the border.",
    },
    {
      id: "32-us-title",
      at: 354,
      text: "There's an active title for this VIN in Pennsylvania. The package is on hold.",
    },
  ],
  writeOff: [
    {
      id: "33-writeoff-brand",
      at: 10,
      text: {
        ca: "Ontario already brands written-off cars.",
        us: "The DMV already brands written-off cars.",
      },
    },
    {
      id: "34-writeoff-loss",
      at: 100,
      text: "Insurer records show this one was written off last year.",
    },
    {
      id: "35-writeoff-plate",
      at: 270,
      text: {
        ca: "Now its VIN is on a second Ontario plate. That's a write-off coming back under another identity.",
        us: "Now its VIN is on a second plate. That's a write-off coming back under another identity.",
      },
    },
  ],
  map: [
    {
      id: "36-map-ledger",
      at: 10,
      text: "Both countries connect to the ledger.",
    },
    {
      id: "37-map-connect",
      at: 110,
      text: {
        ca: "With border, transport and insurance records connected, provinces and states can use the same ledger.",
        us: "With border, transport and insurance records connected, states and provinces can use the same ledger.",
      },
    },
    {
      id: "38-map-border",
      at: 332,
      text: "A flag raised on one side of the border can show up on the other.",
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
