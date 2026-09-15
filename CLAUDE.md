# CLAUDE.md

Project orientation lives in `README.md` (surfaces, routes, demo VINs, recording
setup). Specs and plans are in `docs/superpowers/`. This file holds only what the
code and README do not say.

## The FVBL mark is placeholder artwork

`src/components/FvblMark.tsx`, `public/favicon.svg` and `video/src/Mark.tsx` carry
a stand-in logo: a shield with a four-pointed star and four leaf cut-outs, filled
with a dark-to-light blue gradient in the app and white on the video's navy title
cards. It was supplied for the demo only.

- It is **PLACEHOLDER CONTENT** and **CANNOT be commercially distributed as-is**.
  Do not ship it, publish it, or put it in client-facing material beyond the demo
  video and live walkthrough.
- Do not remove or soften the placeholder notices at the top of those three files.
- The app component, the favicon and the video copy share one path, kept in sync
  by hand. If you change one, change all three.
- The mark appears in the clerk sidebar, the dealer sidebar, the phone confirm
  header, the phone thread's app icon and the sign-in page. Use `FvblMark` there
  rather than pasting the path again. `tone="current"` is for dark grounds.
- The "Blockchain certified" indicator (`LedgerMark.tsx`) deliberately keeps its
  generic check-shield icon. It is a certificate marker, not the brand.
- When the licensed FVBL mark arrives, replace the path and gradient in all three
  files and delete this section.
