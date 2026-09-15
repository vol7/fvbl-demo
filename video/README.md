# FVBL demo video

Remotion project that assembles the CleanShot recordings and the title cards
into one 1920×1080, 30 fps video. The shot list is `docs/screenplay.md` at the
repo root; the cut is `src/Demo.tsx`.

## Workflow

1. Record each shot with CleanShot 5 (trim, zoom, background in Studio Mode)
   and export it as MP4 to `public/clips/` using the file name shown on the
   slate for that shot, e.g. `1-2-vehicle.mp4`. Any size works: clips are
   fitted inside the frame on a dark matte, so 16:9 exports fill it and a
   phone recording sits centred.
2. `pnpm durations` prints each clip's length in frames and lists the shots
   still missing. Paste the frame counts into the matching
   `<TransitionSeries.Sequence durationInFrames={…}>` in `src/Demo.tsx`, and
   the printed total into the Demo composition's `durationInFrames` in `src/Root.tsx`.
3. `pnpm dev` opens Remotion Studio (http://localhost:3000/Demo). Drag a
   sequence's right edge to trim it; Studio writes the number back to the
   file. The `Cards` folder previews each card on its own.
4. `pnpm render` writes `out/fvbl-demo.mp4`.

Shots that have no file yet render a grey slate with the shot number, so the
whole timeline can be previewed before anything is recorded.

## Editing the cards

Card copy lives inline in `src/Demo.tsx`. `BrandCard` is the portal's sign-in
brand panel at full frame; `index` adds the card number top-right and is left
off the open and close. `PaperCard` is a light alternative, not in the cut.
Styles and keyframes are inline literals so Remotion Studio can edit them.
Every card cross-fades over 12 frames; clips cut straight into each other. To
add a transition between two clips, insert a `<TransitionSeries.Transition>`
between their sequences and subtract 12 from the composition total.

## Notes

- Remotion is pinned to 4.0.522. This machine's pnpm rejects packages under a
  day old, so `pnpm upgrade` may need to wait a day after a release.
- `public/clips/*.mp4` is git-ignored.
- Remotion is free for teams of up to three; larger companies need a licence.
