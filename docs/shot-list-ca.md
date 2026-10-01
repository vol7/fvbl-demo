# Canada shot list

Eleven clips from the Ontario app for the Canada cut. Times are seconds into
each clip. Each action runs until the next one starts, on the marks in
`video/src/lines.ts`. The voice column is what plays over it. The full
screenplay, with the reasons behind each beat, is `docs/screenplay.md`.

## Setup

- App: `http://localhost:5173/ca` (the hub). It opens each surface in its own
  window.
- Desktop windows at **1440×900**, the phone at **390×844**.
- **Reset session** in the hub once, before shot 1. Don't reset again until
  shot 7 is done: the clerk's green card needs the authorization shots 2 and 3
  create. The catches read their own records and need no setup, except shot 11.
- Save each clip to `video/public/clips/<file>`. A US clip of the same name
  lives in `clips/us/`, so the Canada file is the shared one.
- Check in Studio (`Demo-CA`) after each clip: the voice should land on each
  action.
- The clerk's Home lists five demo plates now: the RAM 1500 (`CPWT 318`) joined
  on 2026-09-30. Re-recorded Home shots show it.

| # | File | Status |
| --- | --- | --- |
| 1 | `flow-0.mp4` | New |
| 2 | `flow-1a.mp4` | Keep (the 2026-09-09 take) |
| 3 | `flow-1b.mp4` | Re-record: the old take's sender reads "FVBL:", not MTO |
| 4–7 | `flow-2a` to `flow-2d.mp4` | Re-record: the 2026-09-15 takes start on the sign-in page and show eight checks, not nine |
| 8 | `flow-3a.mp4` | New |
| 9 | `flow-3b.mp4` | New |
| 10 | `flow-3c.mp4` | New (was `flow-3.mp4`) |
| 11 | `flow-3d.mp4` | New, Canada only |

## 1 · Dealer, first registration · `flow-0.mp4` · 12 s

`/ca/dealer` → sign in → **Register a new vehicle**, VIN `4JGFF5KE3SB412009`
(2026 Mercedes-Benz GLE 450).

The tightest shot: about a quarter-second between lines.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 3.0 | Paste the VIN. It decodes, "No registration on file." | A dealer enters a new car's VIN. |
| 3.0 | 6.2 | Tick the NVIS box, **Continue**, check the first owner (Léa Tremblay), **Submit to ministry**. "Submitted to the ministry". | They add the first owner and send it to the ministry. |
| 6.2 | 8.7 | Dealership phone: tap the link in the MTO text, **Confirm**. | A text confirms it's really them. |
| 8.7 | 12.0 | "Registration recorded", the `FVBL-R-…` reference, the certificate. Hold. | This is the car's first entry on the ledger. |

## 2 · Buyer, ServiceOntario · `flow-1a.mp4` · 24 s in the cut

`/serviceontario/` → the UVIP card, VIN `4JGFB8KBXPA812634` (2023 Mercedes-AMG
GLE 63 S, plate `CKXR 214`).

Plays at **1.5×**, with "Concept mock-up. Not an Ontario government page." in
the corner. The kept take already hits these marks. If you re-record, record
about **36 s** at a relaxed pace; recording times in brackets.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 7.0 (10.5) | The ServiceOntario home, then the UVIP card. | Now say you're buying a used car. FVBL can show that its history hasn't been tampered with. |
| 7.0 (10.5) | 12.7 (19) | **Buying a vehicle**, then the VIN field. Paste the VIN. | On ServiceOntario, you enter the car's VIN. |
| 12.7 (19) | 17.7 (26.5) | The vehicle found, then the buyer's details (Marcus Beaulieu, his licence and mobile). | It finds the car. Then you add your own details. |
| 17.7 (26.5) | 21.0 (31.5) | The review, with the owner's details masked. Hold. | You never need the owner's name or number. |
| 21.0 (31.5) | 24 (36) | **Send request to owner**, request sent. Hold. | MTO sends the request on. |

## 3 · Owner's phone · `flow-1b.mp4` · 19 s

`/ca/phone` at 390×844, after the request in shot 2.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 7.0 | The MTO text: who is asking, for which car, the link, 24 hours. Hold still. | The owner gets a text from MTO. It says who's asking, and for which car. |
| 7.0 | 10.7 | Tap the link: the car, the plate, "Requested by …", **Approve** / **Decline**. | They open the link and see the request. |
| 10.7 | 16.3 | Tap **Approve** at about 12 s: green check, "Authorization recorded", the reference. | If they approve, the buyer gets the car's history and none of their personal details. |
| 16.3 | 19.0 | Hold on "Authorization recorded". | None. The hold gives the shot air. |

## 4–7 · Clerk, happy path · `flow-2a` to `flow-2d.mp4` · 46.5 s

`/ca/portal`, already signed in, on Home. Plate `CKXR 214`, after shot 3's
approval.

**One continuous take of 46.5 s**, then split: 2a 0–11.5 s, 2b 11.5–20.5 s,
2c 20.5–32.5 s, 2d 32.5–46.5 s. Times below are within each clip. 2b carries
the cut's only sources note, top left.

| Clip | From | Until | Action | Voice |
| --- | --- | --- | --- | --- |
| 2a | 0.3 | 5.0 | On Home, click **CKXR 214** by about 2 s. | At the counter, the clerk looks up the car. |
| 2a | 5.0 | 11.5 | Green, **Authorized to issue**, "All 9 passed". Zoom on the card. | It's green. Every check passed, and the owner has approved. |
| 2b | 0.3 | 9 | Scroll to the nine rows, "All 9 sources answered". Hold. | With the right agreements, insurers, Carfax and border records sit next to the ministry's own. |
| 2c | 0.3 | 5.7 | **Vehicle history** tab, the lifecycle strip. | Together, they make up the car's history. |
| 2c | 5.7 | 12 | Open a row's **Blockchain certified** mark: source, recorded, "Matches the record". | Each event is certified on the ledger. If anyone changed it, the check would fail. |
| 2d | 0.3 | 8.0 | In the side panel, **Show** the owner's details ("FVBL logs each reveal against your badge"). | The owner's details stay hidden until the clerk needs them. FVBL logs each reveal to their badge. |
| 2d | 8.0 | 14 | Back to the top, **Issue package**: **Package issued** and the certified event in the feed. Hold 4 s. | Everything checks out. Package issued. |

## 8 · Catch 1, exported · `flow-3a.mp4` · 27 s

`/ca/portal` Home, Land Rover Range Rover Sport, plate `CPLR 482`, VIN
`SALWR2SEXNA209311`.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 10.2 | Click **CPLR 482** by 1 s. Red: **Hold, do not issue**, "This VIN was reported exported and has no re-entry on record", and "The MTO record alone would have shown this vehicle as clear." Hold. | This SUV is clean in Ontario's own records. But with CBSA export records connected, FVBL sees it was reported leaving Canada. |
| 10.2 | 15.0 | **Vehicle history** tab. Zoom on the strip ending at the dashed **No re-entry** stop. | Its history ends at the border, with no record of it coming back. |
| 15.0 | 21.5 | Back to the top, on the red card. No clicks. | So either that record is wrong, or this car isn't the one the VIN belongs to. |
| 21.5 | 27 | **Refer for investigation**: **Referred, do not issue**, "Referred to MTO Investigations", who they notify after review (the OPP and CBSA), the case reference, and not to share the reason with the customer. Hold. | The clerk holds the package and refers the file to MTO investigators. |

## 9 · Catch 2, US title · `flow-3b.mp4` · 16.5 s

`/ca/portal` Home, Lexus GX 550, plate `CTRV 657`, VIN `JTJTABGX9R4027418`.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 4.0 | Click **CTRV 657**. Red, **Hold, do not issue**. | This car is clean in Ontario too. |
| 4.0 | 10.5 | Zoom on the **US title record** row by about 5 s: the active Pennsylvania title, from NMVTIS. | With access to NMVTIS, the US federal title database, the check also looks across the border. |
| 10.5 | 16.5 | Ease out to the red card. Hold. No referral. | There's an active title for this VIN in Pennsylvania. The package is on hold. |

## 10 · Catch 3, write-off · `flow-3c.mp4` · 17 s

`/ca/portal` Home, Toyota Highlander, plate `BWTP 903`, VIN
`5TDEBRCH9SS041927`.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 3.3 | Click **BWTP 903**. Red. | Ontario already brands written-off cars. |
| 3.3 | 9.0 | Zoom on **Insurer write-off**: declared a total loss, reported by IBC and Carfax. | Insurer records show this one was written off last year. |
| 9.0 | 17 | Zoom on **Duplicate identity**: "Also on Ontario plate CRHM 118". Hold. No referral. | Now its VIN is on a second Ontario plate. That's a write-off coming back under another identity. |

## 11 · Catch 4, the border · `flow-3d.mp4` · 20 s · Canada only

The CBSA officer's window: `/ca/border` → sign in → **Declared for export**.
RAM 1500 Limited, plate `CPWT 318`, VIN `1C6SRFHT4RN318405`, container
`HBLU 420517 4`.

Record it last. Setup: on the hub, **Force state → Export: owner said no**. It
replaces the whole session, so the clerk's shots above must be done first.
Don't press the phone or the hub during the take. The takes for this shot
(`40-border-ledger`, `41-border-owner`, `42-border-container`) aren't recorded
yet: `pnpm voice:scratch` gives them a scratch voice (in `vo-scratch/`, leaving
the recorded takes alone), and the cut plays it until the real takes land.

| From | Until | Action | Voice |
| --- | --- | --- | --- |
| 0.3 | 7.2 | The list: the RAM on top, red, **Doesn't clear**, "Owner said no", the two bad permits under it and the cleared cars below. Click the RAM by 2 s. Its card: **Doesn't clear**. | With the right agreements, CBSA can check the same ledger before a car is loaded. |
| 7.2 | 15.5 | Zoom on **The registered owner did not authorize this export.**, then the strip: permit **Matches**, stolen report **None**, registered owner **Said no** in red. | This truck's permit is real, and it isn't reported stolen. But its owner was asked by text, and said no. |
| 15.5 | 20 | Zoom on the container, **HBLU 420517 4**, "Block 4C · row 15 · tier 1". Click **Hold for examination** at about 16.5 s: **Held for examination** and its `EX-…` reference. Hold. | So officers know which container to open. |

The bridge card before the catches reads "Four cars FVBL would flag." in this
cut, with its own take (`25c-bridge-four`), also still to record.

**Confidential.** The CBSA process in this shot was shared under NDA on the
2026-09-30 call. Don't post the Canada cut anywhere public.
