// Reads every line in src/lines.ts with the macOS `say` voice into
// public/audio/vo/<audience>/<id>.wav, so the cut can be checked against a
// rough voice before paying for ElevenLabs takes. Then prints each take's
// length against the room it has: until the next line starts, or its scene
// ends. `node scripts/scratch-voice.mjs` reads the Canada-first version,
// `--audience us` the US-first one, `--voice Daniel` picks another voice.
// The real takes overwrite these files.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { LINES, say } from "../src/lines.ts";

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
  ["MTO", "M T O"],
  ["DMV", "D M V"],
  ["372,000", "three hundred seventy-two thousand"],
  ["38.5 million", "thirty-eight and a half million"],
  ["2025", "twenty twenty-five"],
  [/\bUS\b/g, "U.S."],
];
const spoken = (text) => SPOKEN.reduce((t, [from, to]) => t.replaceAll(from, to), text);

/** Each scene's length, from the sequence in Demo.tsx that voices it. */
const demo = readFileSync(new URL("../src/Demo.tsx", import.meta.url), "utf8");
const sceneFrames = Object.fromEntries(
  demo
    .split("<TransitionSeries.Sequence")
    .map((chunk) => [
      chunk.match(/voice\(LINES\.(\w+)\)/)?.[1],
      Number(chunk.match(/durationInFrames=\{(\d+)\}/)?.[1]),
    ])
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
for (const [scene, lines] of Object.entries(LINES)) {
  lines.forEach((line, i) => {
    const aiff = `${out}${line.id}.aiff`;
    const wav = `${out}${line.id}.wav`;
    execFileSync("say", ["-v", voice, "-r", String(RATE), "-o", aiff, spoken(say(line, audience))]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", aiff, "-ar", "48000", wav]);
    rmSync(aiff);

    const end = lines[i + 1]?.at ?? sceneFrames[scene] - HANDOFF;
    const room = (end - line.at) / FPS;
    const take = seconds(wav);
    const flag = take > room ? "  OVER" : "";
    if (flag) over++;
    console.log(line.id.padEnd(22), take.toFixed(1).padStart(6), room.toFixed(1).padStart(6) + flag);
  });
}
console.log(over ? `\n${over} take(s) run past the next line or the scene's end.` : "\nEvery take fits.");
