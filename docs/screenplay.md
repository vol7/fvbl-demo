# OVIL demo — screenplay

Proof-of-concept video for RCMP and Ontario government stakeholders, via
Polycaro. Silent: no voiceover, no on-screen labels. Six cards carry the
structure; the screens carry the story. Target runtime about 1:30.

Two flows, straight from the 2026-09-08 sync: the user-facing pre-approval
request on ServiceOntario, and the MTO clerk lookup ending on a big green or a
big red. Nothing is shown twice. The clerk-triggered request and the
owner-initiated pre-approval are built but not in the cut; they are a sentence
in the room and a 30-second appendix if Polycaro asks.

## Setup (once)

1. `pnpm dev`, open `http://localhost:5173/demo` in a window you will not record.
2. From the hub open the three surfaces in their own windows: ServiceOntario
   at 1440×900, owner phone at 390×844, clerk portal at 1440×900. Record
   upscaled in CleanShot so exports come out at 1920×1080.
3. Hub → **Reset session** once, before flow 1. No reset between flows: flow 2
   depends on the authorization flow 1 creates.
4. Hide the dock and menu bar, disable notifications, close other tabs.
5. Cards and assembly are the Remotion project in `video/`; see
   `video/README.md`. Export each clip to `video/public/clips/` with the file
   name shown on that shot's slate.

Clean VIN `4JGFB8KB5PA812634` (2023 Mercedes-AMG GLE 63 S, plate CKXR 214).
Cloned VIN `5TDEBRCH7SS041927` (2025 Toyota Highlander, plate BWTP 903). Both
are rows under "Recent lookups" on the portal.

---

## Card 1 — Hero

> **A secure ledger of vehicle ownership.**
> OVIL

Hold 4 s.

## Card 2 — Mission

> OVIL safeguards vehicle records with owner authentication before any
> information is released.

Hold 4 s.

## Card 2b — Entry point

> Customers can request a UVIP pre-approval from the ServiceOntario portal.

Hold 5 s. Every actor change from here gets a card (2026-09-11 review).

## Flow 1a — ServiceOntario, the buyer (≈ 20 s)

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 1.1 | ServiceOntario | Tiles already in view. Click **Get a Used Vehicle Information Package (UVIP)**. | UVIP intro: "The registered owner" / "Buying this vehicle". |
| 1.2 | ServiceOntario | Click **Buying this vehicle**. | "Ask the owner to authorize a UVIP", stepper on step 1. |
| 1.3 | ServiceOntario | Type the clean VIN, continue. | Vehicle resolves. Step 2 cross-fades in, prefilled (Fawaz Ahmed, licence, mobile ending 4410). |
| 1.4 | ServiceOntario | **Continue**, then **Send request to owner**. | "Review and send", then "Request sent to the owner". Hold 3 s. |

## Card 3 — Cut to the phone

> Registered owners get a request for approval.

Hold 5 s.

## Flow 1b — Phone, the registered owner (≈ 15 s)

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 1.5 | Phone | Nothing. | OVIL text arrives: requested online by Fawaz Ahmed, link, expires in 24 hours. Hold 4 s. Zoom. |
| 1.6 | Phone | Tap the link. | Confirm page: vehicle, plate, "Requested by Fawaz Ahmed", expiry, Approve / Deny. Hold 2 s. |
| 1.7 | Phone | Tap **Approve**. | Green check, "Authorization recorded", reference. Hold 4 s. Zoom on the check. |

## Card 4 — Process

> At the counter, the clerk sees the vehicle checked against historical
> records and the owner's approval confirmed.

Hold 6 s. Not "government records": we are talking to the government.

## Flow 2a — Portal, the clerk, green (≈ 15 s)

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 2.1 | Portal | Home. Click the CKXR 214 row. Start recording before the click. | Header: "Checks clear", three tiles (All 8 checks passed · Not yet requested · Blockchain certified), sources strip. Eight checks stagger in green under the Record checks tab. Panel: **Authorized by registered owner**, "Requested online by Fawaz Ahmed", reference. No request button. Hold 6 s. Zoom on the panel. |

Blockchain beat, per the 2026-09-11 sync: not inside the flow. After the last
flow, one interstitial ("All of this is secured on the blockchain to prevent
tampering."), then a short clip: the Ledger tile in the header ("no tampering
detected · verified 3 minutes ago"), the Vehicle history tab with its
"Blockchain certified" rows, and the certified events in the activity feed.

## Card 5 — Failure

> If a record check fails or approval is not given, the package cannot be
> issued.

Hold 6 s.

## Flow 2b — Portal, the clerk, red (≈ 20 s)

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 2.2 | Portal | **Home** in the sidebar. Click the BWTP 903 row. | Checks stagger in. Insurer write-off, duplicate identity, collision record are red at the top with "High risk" / "Low risk" badges. "3 of 8 checks failed · high risk". Panel: "Package cannot be issued", request disabled. Hold until all three rows are readable, about 6 s. Zoom on the rows. |
| 2.3 | Portal | Click **Escalate to Insurance Hub / Law Enforcement**. | "Escalated for review", case reference `OVIL-2026-09-…`. Longest hold of the video, 6 s. Zoom on the reference. |

## Card 5b — Blockchain

> All of this is secured on the blockchain to prevent tampering.

Hold 6 s.

## Flow 3 — Portal, the ledger beat (≈ 8 s)

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 3.1 | Portal | Back on the CKXR 214 record. Hover the **Ledger** tile, click it. | Tile: "Blockchain certified · no tampering detected · verified 3 minutes ago". Vehicle history tab opens; every row carries "Blockchain certified" and a certificate. Pan down to the activity feed: the approval and issue events carry one too. Hold 4 s. |

## Card 6 — Close

> **A secure ledger of vehicle ownership.**
> OVIL

Hold 5 s, fade to black.

---

## Runtime

Everything after the first section runs about 50 percent slower than the first
cut (2026-09-11 review). Clips are re-recorded at the pace of flow 1a; if it
feels slow to us, it is right for the room.

| Section | Target |
| --- | --- |
| Cards 1 and 2 | 8 s |
| Card 2b | 5 s |
| Flow 1a | 20 s |
| Card 3 | 5 s |
| Flow 1b | 20 s |
| Card 4 | 6 s |
| Flow 2a | 25 s |
| Card 5 | 6 s |
| Flow 2b | 25 s |
| Card 5b | 6 s |
| Flow 3 | 8 s |
| Card 6 | 5 s |
| Total | about 2:20 |

## Left out on purpose

- Sign-in and the ServiceOntario scroll.
- The clerk-triggered request when nothing is on file. Built; a fallback, not
  a feature.
- The owner-initiated pre-approval with the licence photo. Built; backup take
  if Polycaro prefers the seller's angle.
- Deny and timeout. Mention if asked.

## Recording notes

- One CleanShot clip per numbered shot. Ten clips.
- CleanShot zooms at five moments only: the text arriving, the green check on
  the phone, the authorized panel, the three red rows, the case reference.
- Keep the cursor slow. Pause a beat on the thing that changed before cutting.
- The check stagger is 0.7 s plus 8 × 0.08 s. Start the clip before clicking
  the row so the stagger is on tape.
- Flow 2 can be one continuous take on the portal, split afterwards.
- Cards are rendered by Remotion, not recorded. Copy lives in
  `video/src/Demo.tsx`.

## Assembly

C1 · C2 · 1.1–1.4 · C3 · 1.5–1.7 · C4 · 2.1 · C5 · 2.2–2.3 · C6.
`video/src/Demo.tsx` encodes this order with a 12-frame cross-fade on every
card and straight cuts between clips. Drop the clips in, run `pnpm durations`,
paste the frame counts, `pnpm render`.
