// Prints the natural length of every clip in public/clips as frames at 30 fps,
// then the timeline total implied by src/Demo.tsx. Run after recording, then
// paste the frame counts into Demo.tsx and the total into Root.tsx.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ALL_FORMATS, FilePathSource, Input } from "mediabunny";

const FPS = 30;
const dir = new URL("../public/clips/", import.meta.url).pathname;

// Shared takes, then each version's own takes in public/clips/<version>/.
const files = ["", "ca/", "us/"]
  .flatMap((sub) => {
    try {
      return readdirSync(join(dir, sub)).map((f) => sub + f);
    } catch {
      return [];
    }
  })
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
// The whip pans between the catches are 12 frames, not 16. `caWhipPan` leads
// into Canada's border catch, which the US cut doesn't play.
const whips = (demo.match(/\{whipPan\}/g) ?? []).length;
const caWhips = (demo.match(/\{caWhipPan\}/g) ?? []).length;
const fixed = sequences.reduce((a, b) => a + b, 0) - 16 * transitions - 12 * whips;
// The recorded shots' lengths, per version, from the SHOTS table.
const shots = demo.match(/export const SHOTS = \{([\s\S]*?)\n\}/)?.[1] ?? "";
console.log(`\nDemo.tsx: ${sequences.length} fixed sequences, ${transitions} settles, ${whips} whip pans (+${caWhips} in Canada's cut).`);
for (const [, version, body] of shots.matchAll(/(\w+): \{([^}]*)\}/g)) {
  const recorded = [...body.matchAll(/:\s*(\d+)/g)].reduce((a, m) => a + Number(m[1]), 0);
  const total = fixed + recorded - (version === "ca" ? 12 * caWhips : 0);
  console.log(`  ${version}: ${total} frames (${(total / FPS).toFixed(1)} s)`);
}
console.log("Set DURATION in src/Root.tsx to those values.");

// Files referenced in Demo.tsx that are not recorded yet.
const wanted = [...demo.matchAll(/file="([^"]+)"/g)].map((m) => m[1]);
const missing = [...new Set(wanted)].filter((f) => { try { statSync(join(dir, f)); return false; } catch { return true; } });
if (missing.length) console.log(`\nStill to record (${missing.length}):\n  ${missing.join("\n  ")}`);
