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
   the printed total into `DURATION` in `src/Root.tsx`.
3. `pnpm dev` opens Remotion Studio (http://localhost:3000/Demo-CA). Drag a
   sequence's right edge to trim it; Studio writes the number back to the
   file. The `Slides` folder previews the map, the hero and a card on their own.
4. `pnpm render:review:ca` (or `:us`) writes `out/fvbl-demo-ca-review.mp4`,
   the cut with each voiceover line as a caption, for reviewing the script
   before the voice is recorded. `pnpm render:ca` and `pnpm render:us` write
   the finals, without captions.

## Two versions

The cut has a Canada-first and a US-first version (`src/audience.ts`), as
the compositions `Demo-CA` and `Demo-US` (plus `-Review`). They share every
card and the order of shots. Per version: the hero figure (`HEROES` in
`src/Demo.tsx`), the lines that name an agency (`src/lines.ts`), the takes in
`public/audio/vo/<ca|us>/`, the final mix `public/audio/soundtrack-<ca|us>.wav`,
and optionally a clip in `public/clips/<ca|us>/`, which replaces the shared
clip of the same name. A shared line (one text in `lines.ts`) plays its Canada
take in both cuts, so `vo/us/` holds only the US's own lines.

The US takes (2026-09-30) run to their own timing, so each recorded shot has a
length per version (`SHOTS` in `src/Demo.tsx`), each line over them a mark per
version (`at: { ca, us }`, where `null` drops the line from that version), and
`DURATION` in `src/Root.tsx` a total per version. `pnpm voice:scratch --audience us`
reads the US lines and times the shared ones from their Canada takes. It
overwrites the takes in `vo/us/`, so don't run it over recorded ones.

Shots that have no file yet render a grey slate with the shot number, so the
whole timeline can be previewed before anything is recorded.

## Editing the cards

Card copy lives inline in `src/Demo.tsx`: `<Slide eyebrow title>`, where a
`\n` in the title forces a line break. Titles of 32 characters or fewer set
as headlines, longer ones as sentences. The hero's copy is `HERO` in the same
file; its beat timings are `BEATS` in `src/Opening.tsx`. Styles and
keyframes are inline literals so Remotion Studio can edit them. Every hand-off
is the 16-frame `settle` transition; see the header of `src/Demo.tsx`.

## Music and voice

`src/Soundtrack.tsx` plays `public/audio/soundtrack-<ca|us>.wav` (the final
mix of voice and music for that version) if it is there, otherwise `public/audio/music.mp3` as a low
bed with a fade in and out, otherwise nothing. See "Look and sound" in
`docs/screenplay.md`.

To audition candidate beds, drop up to four MP3s in `public/audio/compare/`:
while it has files, each plays as its own layer in place of `music.mp3`, to
be muted one by one in the Studio timeline. Studio saves those mutes into
`src/Soundtrack.tsx` as `hidden` props. Remove them and empty the folder
before a render.

## Notes

- Remotion is pinned to 4.0.522. This machine's pnpm rejects packages under a
  day old, so `pnpm upgrade` may need to wait a day after a release.
- `public/clips/*.mp4` and `public/audio/*` are git-ignored.
- Remotion is free for teams of up to three; larger companies need a licence.
