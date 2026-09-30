// Reads every line in src/lines.ts with the macOS `say` voice into
// public/audio/vo/<audience>/<id>.wav, so the cut can be checked against a
// rough voice before paying for ElevenLabs takes. Then prints each take's
// length against the room it has: until the next line starts, or its scene
// ends. `node scripts/scratch-voice.mjs` reads the Canada-first version,
// `--audience us` the US-first one, `--voice Daniel` picks another voice.
// The real takes overwrite these files. A shared line (one text for both
// cuts) plays the Canada take in the US cut, so `--audience us` writes only
// the US's own lines and times the shared ones from their Canada takes.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { LINES, mark, say } from "../src/lines.ts";

const FPS = 30;
const HANDOFF = 16;
const RATE = 155;
const flag = (name, fallback) =>
  process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const voice = flag("--voice", "Samantha");
const audience = flag("--audience", "ca");
if (!["ca", "us"].includes(audience)) throw new Error(`--audience is ca or us, not ${audience}`);

const out = new URL(`../public/audio/vo/${audience}/`, import.meta.url).pathname;
mkdirSync(out, { recursive: true });

/** The spoken forms, as docs/voiceover.md types them for ElevenLabs. */
const SPOKEN = [
  ["ServiceOntario", "Service Ontario"],
  ["NMVTIS", "N M V T I S"],
  ["FVBL", "F V B L"],
  ["CBSA", "C B S A"],
  ["CBP", "C B P"],
  ["MTO", "M T O"],
  ["DMV", "D M V"],
  ["372,000", "three hundred seventy-two thousand"],
  ["38.5 million", "thirty-eight and a half million"],
  ["2025", "twenty twenty-five"],
  [/\bUS\b/g, "U.S."],
];
const spoken = (text) => SPOKEN.reduce((t, [from, to]) => t.replaceAll(from, to), text);

/**
 * Each scene's length in this version, from the sequence in Demo.tsx that
 * voices it: a literal, or its entry in the SHOTS table.
 */
const demo = readFileSync(new URL("../src/Demo.tsx", import.meta.url), "utf8");
const shots = demo.match(new RegExp(`\\n  ${audience}: \\{([^}]*)\\}`))?.[1] ?? "";
const shot = (key) => Number(shots.match(new RegExp(`\\b${key}: (\\d+)`))?.[1]);
const sceneFrames = Object.fromEntries(
  demo
    .split("<TransitionSeries.Sequence")
    .map((chunk) => {
      const literal = chunk.match(/durationInFrames=\{(\d+)\}/)?.[1];
      const key = chunk.match(/durationInFrames=\{SHOTS\[audience\]\.(\w+)\}/)?.[1];
      return [chunk.match(/voice\(LINES\.(\w+)\)/)?.[1], literal ? Number(literal) : shot(key)];
    })
    .filter(([scene]) => scene),
);

const seconds = (file) =>
  Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
    ]).toString(),
  );

console.log("line".padEnd(22), "take".padStart(6), "room".padStart(6));
let over = 0;
for (const [scene, all] of Object.entries(LINES)) {
  // The lines this version plays, at its own marks.
  const lines = all
    .map((line) => ({ ...line, at: mark(line, audience) }))
    .filter((line) => line.at !== null);
  lines.forEach((line, i) => {
    const shared = audience !== "ca" && typeof line.text === "string";
    const caTake = new URL(`../public/audio/vo/ca/${line.id}.wav`, import.meta.url).pathname;
    // A shared line in the US cut: time its Canada take, and write nothing
    // into the US folder, which would shadow it.
    const dir = shared ? `${tmpdir()}/` : out;
    const wav = shared && existsSync(caTake) ? caTake : `${dir}${line.id}.wav`;
    if (wav !== caTake) {
      const aiff = `${dir}${line.id}.aiff`;
      execFileSync("say", ["-v", voice, "-r", String(RATE), "-o", aiff, spoken(say(line, audience))]);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", aiff, "-ar", "48000", wav]);
      rmSync(aiff);
    }

    const end = lines[i + 1]?.at ?? sceneFrames[scene] - HANDOFF;
    const room = (end - line.at) / FPS;
    const take = seconds(wav);
    const flag = take > room ? "  OVER" : "";
    if (flag) over++;
    const from = shared ? (wav === caTake ? "  (ca take)" : "  (shared, scratch)") : "";
    console.log(line.id.padEnd(22), take.toFixed(1).padStart(6), room.toFixed(1).padStart(6) + flag + from);
  });
}
console.log(over ? `\n${over} take(s) run past the next line or the scene's end.` : "\nEvery take fits.");
