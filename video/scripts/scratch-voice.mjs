// Reads every line in src/lines.ts with the macOS `say` voice into
// public/audio/vo-scratch/<audience>/<id>.wav, so the cut can be checked
// against a rough voice before paying for ElevenLabs takes. Then prints each
// take's length against the room it has: until the next line starts, or its
// scene ends. `node scripts/scratch-voice.mjs` reads the Canada-first version,
// `--audience us` the US-first one, `--voice Daniel` picks another voice, and
// `--check` writes nothing and only times what the cut plays: after dropping
// in a recorded take, it shows whether the take fits.
// The recorded takes in public/audio/vo/ are never touched: the cut plays a
// recorded take where there is one and falls back to scratch (Voice.tsx). A
// shared line (one text for both cuts) plays the Canada take in the US cut, so
// `--audience us` writes only the US's own lines and times the shared ones
// from their Canada takes, recorded or scratch.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { LINES, mark, say } from "../src/lines.ts";

const FPS = 30;
const HANDOFF = 16;
const RATE = 155;
const flag = (name, fallback) =>
  process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const voice = flag("--voice", "Samantha");
// --check: time what the cut plays now, recorded or scratch, and write nothing.
const check = process.argv.includes("--check");
const audience = flag("--audience", "ca");
if (!["ca", "us"].includes(audience)) throw new Error(`--audience is ca or us, not ${audience}`);

const out = new URL(`../public/audio/vo-scratch/${audience}/`, import.meta.url).pathname;
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
      // `SHOTS[audience].x`, or `SHOTS.ca.x` for a shot one version plays alone.
      const key = chunk.match(/durationInFrames=\{SHOTS(?:\[audience\]|\.\w+)\.(\w+)\}/)?.[1];
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

/** The file the cut plays for a line, in Voice.tsx's order, or undefined. */
const playing = (line) => {
  const dirs = [audience, ...(typeof line.text === "string" ? ["ca"] : [])];
  return ["vo", "vo-scratch"]
    .flatMap((folder) =>
      dirs.flatMap((dir) =>
        ["wav", "mp3"].map(
          (ext) => new URL(`../public/audio/${folder}/${dir}/${line.id}.${ext}`, import.meta.url).pathname,
        ),
      ),
    )
    .find((path) => existsSync(path));
};

console.log("line".padEnd(22), "take".padStart(6), "room".padStart(6), " plays");
let over = 0;
let missing = 0;
for (const [scene, all] of Object.entries(LINES)) {
  // The lines this version plays, at its own marks.
  const lines = all
    .map((line) => ({ ...line, at: mark(line, audience) }))
    .filter((line) => line.at !== null);
  lines.forEach((line, i) => {
    // A shared line in the US cut plays the Canada take: write nothing into
    // the US folder, which would shadow it. With --check, write nothing at all.
    const shared = audience !== "ca" && typeof line.text === "string";
    if (!check && !shared) {
      const wav = `${out}${line.id}.wav`;
      const aiff = `${out}${line.id}.aiff`;
      execFileSync("say", ["-v", voice, "-r", String(RATE), "-o", aiff, spoken(say(line, audience))]);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", aiff, "-ar", "48000", wav]);
      rmSync(aiff);
    }

    const end = lines[i + 1]?.at ?? sceneFrames[scene] - HANDOFF;
    const room = (end - line.at) / FPS;
    const file = playing(line);
    if (!file) {
      missing++;
      console.log(line.id.padEnd(22), "–".padStart(6), room.toFixed(1).padStart(6), " nothing");
      return;
    }
    const take = seconds(file);
    const flag = take > room ? "  OVER" : "";
    if (flag) over++;
    // Recorded or scratch, and whose folder it came from.
    const source = `${file.includes("/vo-scratch/") ? "scratch" : "take"}${file.includes(`/${audience}/`) ? "" : " (ca)"}`;
    console.log(line.id.padEnd(22), take.toFixed(1).padStart(6), room.toFixed(1).padStart(6), ` ${source}${flag}`);
  });
}
console.log(
  [
    over ? `${over} take(s) run past the next line or the scene's end.` : "Every take fits.",
    missing ? `${missing} line(s) have nothing to play.` : "",
  ]
    .filter(Boolean)
    .join(" "),
);
