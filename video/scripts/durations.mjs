// Prints the natural length of every clip in public/clips as frames at 30 fps,
// then the timeline total implied by src/Demo.tsx. Run after recording, then
// paste the frame counts into Demo.tsx and the total into Root.tsx.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ALL_FORMATS, FilePathSource, Input } from "mediabunny";

const FPS = 30;
const dir = new URL("../public/clips/", import.meta.url).pathname;

const files = readdirSync(dir)
  .filter((f) => /\.(mp4|mov|webm)$/i.test(f))
  .sort();

if (files.length === 0) {
  console.log("No clips in public/clips yet.");
} else {
  console.log("clip".padEnd(32), "seconds".padStart(8), "frames".padStart(7));
  for (const f of files) {
    const input = new Input({
      formats: ALL_FORMATS,
      source: new FilePathSource(join(dir, f)),
    });
    const s = await input.computeDuration();
    console.log(f.padEnd(32), s.toFixed(2).padStart(8), String(Math.round(s * FPS)).padStart(7));
  }
}

const demo = readFileSync(new URL("../src/Demo.tsx", import.meta.url), "utf8");
const sequences = [...demo.matchAll(/<TransitionSeries\.Sequence[^>]*durationInFrames=\{(\d+)\}/g)].map((m) => Number(m[1]));
// Demo.tsx hoists the transition into a `handoff` constant; count its uses,
// falling back to inline <TransitionSeries.Transition> elements.
const handoffs = (demo.match(/\{handoff\}/g) ?? []).length;
const transitions = handoffs > 0 ? handoffs : (demo.match(/<TransitionSeries\.Transition\b/g) ?? []).length;
const total = sequences.reduce((a, b) => a + b, 0) - 16 * transitions;
console.log(`\nDemo.tsx: ${sequences.length} sequences, ${transitions} transitions → ${total} frames (${(total / FPS).toFixed(1)} s)`);
console.log("Set durationInFrames on the Demo composition in src/Root.tsx to that value.");

// Files referenced in Demo.tsx that are not recorded yet.
const wanted = [...demo.matchAll(/file="([^"]+)"/g)].map((m) => m[1]);
const missing = wanted.filter((f) => { try { statSync(join(dir, f)); return false; } catch { return true; } });
if (missing.length) console.log(`\nStill to record (${missing.length}):\n  ${missing.join("\n  ")}`);
