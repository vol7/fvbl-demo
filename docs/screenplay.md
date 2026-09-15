# FVBL demo — screenplay

Proof-of-concept video for RCMP and Ontario government stakeholders, via
Polycaro. Silent: no voiceover, no on-screen labels. Twelve cards carry the
structure; the screens carry the story. Target runtime about 3:00.

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
> FVBL

Hold 4.3 s, then the mission rises in behind it (one 10 s opening).

## Card 2 — Mission

> FVBL safeguards vehicle records with owner authentication before any
> information is released.

Hold 5 s. Purpose first, then straight into the story.

## Card 2b — Entry point

> Customers can request a UVIP pre-approval from the ServiceOntario portal.

Hold 6 s. Every actor change from here gets a card (2026-09-11 review).

## Flow 1a — ServiceOntario, the buyer (36 s) · `flow-1a.mp4` · KEEP

The 2026-09-09 take stays. Frank: a touch fast, not worth redoing. Its click
pace is the reference for everything else.

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 1.1 | ServiceOntario | Tiles already in view. Click **Get a Used Vehicle Information Package (UVIP)**. | UVIP intro: "I am… Selling my vehicle" / "Buying a vehicle" (Frank's wording, 2026-09-11). The kept flow-1a take shows the older labels for its first seconds. |
| 1.2 | ServiceOntario | Click **Buying a vehicle**. | "Ask the owner to authorize a UVIP", stepper on step 1. |
| 1.3 | ServiceOntario | Type the clean VIN, continue. | Vehicle resolves. Step 2 cross-fades in, prefilled (Fawaz Ahmed, licence, mobile ending 4410). |
| 1.4 | ServiceOntario | **Continue**, then **Send request to owner**. | "Review and send", then "Request sent to the owner". Hold 3 s. |

## Card 3 — Cut to the phone

> Registered owners get a request for approval.

Hold 5.5 s.

## Flow 1b — Phone, the registered owner (≈ 18 s) · `flow-1b.mp4` · RE-RECORD

Re-record: the text now says FVBL, and the old take was too fast. Slower on
the text message and on the confirm page.

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 1.5 | Phone | Nothing. | FVBL text arrives: requested online by Fawaz Ahmed, link, expires in 24 hours. Hold 5 s. Zoom. |
| 1.6 | Phone | Tap the link. | Confirm page: vehicle, plate, "Requested by Fawaz Ahmed", expiry, Approve / Deny. Hold 4 s. |
| 1.7 | Phone | Tap **Approve**. | Green check, "Authorization recorded", reference. Hold 5 s. Zoom on the check. |

## Card 4 — Clerk

> At the counter, the clerk sees at a glance whether the package can be
> released.

Hold 7 s. We turn to the clerk's side. From here the portal is three paused
beats (checks, timeline, authorization), each with its own card, instead of one
scroll (2026-09-11 review). Once a beat is introduced it is never re-explained.

## Flow 2a — Portal, the landing (≈ 10 s) · `flow-2a.mp4` · NEW

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 2.1 | Portal | Home. Start recording, then click the **CKXR 214** row. | Summary header: identity, verdict pill **Checks clear**, three tiles (All 8 checks passed · Authorized by registered owner · Blockchain certified), facts row, **Sources consulted** strip with seven agencies. Eight checks stagger in green below. Hold on the header 5 s. No zoom, the header is the point: the group-level "everything checks out". |

## Card 4b — Checks

> The vehicle's history is validated for signs of tampering or risk.

Hold 6 s.

## Flow 2b — Portal, record checks (≈ 10 s) · `flow-2b.mp4` · NEW

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 2.2 | Portal | Same page, **Record checks** tab already open. Scroll so the eight rows fill the frame. | Eight green rows with agency chips. Zoom on **Import and export record** (Transport Canada RIV · CBSA: "Entered Canada … no export on record") and **VIN decode match** (NHTSA vPIC · MTO). Hold 5 s. |

## Card 4c — Timeline

> Transport Canada and CBSA border records complete the vehicle's timeline.

Hold 6 s.

## Flow 2c — Portal, vehicle history (≈ 10 s) · `flow-2c.mp4` · NEW

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 2.3 | Portal | Click the **Vehicle history** tab. Hold, then click **Show all … events**. | Milestones newest first: ownership transfers, First registration (MTO office), Cleared customs (CBSA), Entered Canada (Transport Canada), each with an agency chip and a ledger mark. Expanded: renewals and odometer readings slot in. Hold 4 s on the expanded list. Zoom on the two border rows. |

## Card 4d — Authorization

> Clerks see whether the registered owner has pre-approved the request, and
> issue accordingly.

Hold 6.5 s.

## Flow 2d — Portal, authorization and issue (≈ 11 s) · `flow-2d.mp4` · NEW

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 2.4 | Portal | Scroll back to the top. Hover the **Owner authorization** tile, then the right rail. | Panel: **Authorized by registered owner**, "Requested online by Fawaz Ahmed", reference, approved time. Zoom on the panel. Hold 4 s. |
| 2.5 | Portal | Click **Issue Used Vehicle Information Package**. | Panel flips to "Package issued at …", verdict pill **Package issued**, the activity feed gains the issue event. Hold 4 s. |

## Card 5 — Failure

> If a record check fails or approval is not given, the package cannot be
> issued.

Hold 6.5 s.

## Flow 3 — Portal, the clerk, red (≈ 21 s) · `flow-3.mp4` · RE-RECORD

Re-record: new header and tabs, and about 50 percent slower than the old take.

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 3.1 | Portal | **Home** in the sidebar. Click the **BWTP 903** row. | Verdict pill **Cannot be issued**, record checks tile "3 high-risk flags". Checks stagger in: Insurer write-off, Duplicate identity, Collision record red at the top with High risk / Low risk badges. Panel: **Package cannot be issued**. Hold until all three rows are readable, about 7 s. Zoom on the rows. |
| 3.2 | Portal | Click **Escalate to law enforcement**. | "Escalated for review", case reference `FVBL-2026-09-…`, verdict pill **Escalated**. Longest hold of the video, 7 s. Zoom on the reference. |

Alternative take if the room is CBSA-minded: the exported Range Rover
(`CPLR 482`) instead. One red row, plus the border alert under the header that
tells the export-with-no-re-entry story in one sentence.

## Card 5b — Blockchain

> All of this is secured on the blockchain to prevent tampering.

Hold 6 s. Last and quiet: no dedicated page, just the marks already on screen.

## Flow 4 — Portal, the ledger beat (≈ 10 s) · `flow-4.mp4` · NEW

| # | Window | Action | On screen |
| --- | --- | --- | --- |
| 4.1 | Portal | Back on the **CKXR 214** record. Hover the **Ledger** tile, click it. | Tile: "Blockchain certified · n events · no tampering detected · verified 3 minutes ago". Vehicle history tab opens; every row carries "Blockchain certified" and a certificate. Pan down to the activity feed: the approval and the issue event carry one too. Hold 4 s. |

## Card 6 — Close

> **A secure ledger of vehicle ownership.**
> FVBL

Hold 6 s, fade to black.

---

## Runtime

Everything after the first section runs about 50 percent slower than the first
cut (2026-09-11 review). Clips are re-recorded at the pace of flow 1a; if it
feels slow to us, it is right for the room. Cards hold 5.5 to 7 s by length.

| Section | Target |
| --- | --- |
| Cards 1 and 2 | 10 s |
| Card 2b | 6 s |
| Flow 1a | 36 s (as recorded) |
| Card 3 | 5.5 s |
| Flow 1b | 18 s |
| Card 4 | 7 s |
| Flow 2a | 10 s |
| Card 4b | 6 s |
| Flow 2b | 10 s |
| Card 4c | 6 s |
| Flow 2c | 10 s |
| Card 4d | 6.5 s |
| Flow 2d | 11 s |
| Card 5 | 6.5 s |
| Flow 3 | 21 s |
| Card 5b | 6 s |
| Flow 4 | 10 s |
| Card 6 | 6 s |
| Total | about 3:00 |

## Left out on purpose

- Sign-in and the ServiceOntario scroll.
- The clerk-triggered request when nothing is on file. Built; a fallback, not
  a feature.
- The owner-initiated pre-approval with the licence photo. Built; backup take
  if Polycaro prefers the seller's angle.
- Deny and timeout. Mention if asked.

## Recording notes

- One CleanShot clip per flow, eight clips; flow 1a is already on disk. Flows
  2a to 2d and 4 are one continuous portal take, split afterwards.
- CleanShot zooms at eight moments only: the text arriving, the green check on
  the phone, the two border checks, the two border rows in the history, the
  authorized panel, the three red rows, the case reference.
- Keep the cursor slow. Pause a beat on the thing that changed before cutting.
- The check stagger is 0.7 s plus 8 × 0.08 s. Start the clip before clicking
  the row so the stagger is on tape.
- Between flow 2d and flow 3, Home in the sidebar is the cut point. Flow 4
  needs the CKXR 214 record with the package issued, so record it right after
  2d or force the state from the hub.
- Cards are rendered by Remotion, not recorded. Copy lives in
  `video/src/Demo.tsx`.

## Assembly

C1+C2 · C2b · 1a · C3 · 1b · C4 · 2a · C4b · 2b · C4c · 2c · C4d · 2d · C5 ·
3 · C5b · 4 · C6.
`video/src/Demo.tsx` encodes this order with a 16-frame `settle` hand-off
between every scene. Unrecorded shots carry their target length, so the
timeline previews at about 3:00 today. Drop the clips in, run `pnpm durations`,
paste the frame counts and the total, `pnpm render`.
