# FVBL demo screenplay, v5

This is the concept video for the Ontario government, the RCMP, CBSA and
Transport Canada and, next, a US federal contact, sent through Policaro. v5
goes back to the order agreed on the 2026-09-18 "VIN review" with Francesco,
Gus and Fawaz: registration, the happy path, then the catches, then the map.
v4 is in git history.

The cut is `video/src/Demo.tsx`. It runs 3:47 (6820 frames). The open
questions for Policaro are in `docs/2026-09-23-policaro-review.md`.

What changed from v4:

- **No cold open.** On 2026-09-18 the client preferred the checks first and
  the fraud last ("here's the checks and balances, but here's what happens
  when something does not follow the process"), and seven seconds of an
  unexplained UI told the viewer nothing. The video now opens on the cloned-VIN
  figure.
- **The hero is about cloned VINs, not theft.** FVBL checks a car's identity
  at registration; it doesn't stop theft. The opening figure is CARFAX
  Canada's estimate of vehicles carrying potentially cloned VINs, and the
  next beat takes it across the border.
- **One bridge into the catches.** "When a VIN doesn't add up." replaces the
  "Back to that SUV." card and the three catch cards. Each catch names itself
  with a corner label, so the three play as one run.
- **The voice follows the screen.** One line per on-screen action, each
  starting on the frame its action happens, and each naming what the viewer
  sees. The voice also covers the bridge. Lines live in `video/src/lines.ts`,
  one file per line, so one change means one new take.
- **The dealer beat is shorter.** 12 s of flow 0, down from 14 s. The client
  asked for under 10 seconds of registration; the card makes up the rest.
- **The map is shared, not Canadian.** The ledger sits off the coast, in
  neither country. Both countries light together, and the last beat sends a
  flag each way through the ledger. No "Roadmap" or "In this demo" tags: the
  voice carries the condition.
- **Two versions, Canada-first and US-first (2026-09-28).** Same shots, same
  marks. The hero opens on the viewer's own country's figure, and the voice
  names that side's agencies: MTO and CBSA in Canada, the DMV in the US
  ("ServiceOntario, Ontario's DMV"). Lines that name no agency are shared.
  Where a VO cell below has two lines, the first is Canada's and the second
  is the US's. Each version has its own takes and final mix, and a clip in
  `video/public/clips/<ca|us>/` replaces the shared one for that version.
  The cards, the caveat ("cross-border sources") and the map are neutral in
  both, and nothing says where the ledger is hosted.

Kept from v4: the conditional wording for every third-party, federal and US
source, the sources caveat on the shots that show them, "Hold, do not issue"
and the referral through MTO Investigations, catch 3 leading with the cloned
identity, and no ask card.

## Setup

Do this once.

1. Run `pnpm dev` and open the hub at `http://localhost:5173/` in a window you
   will not record.
2. From the hub, open four windows. The dealer portal, ServiceOntario and the
   clerk portal are 1440×900, and the phone is 390×844. Record upscaled in
   CleanShot so the exports come out at 1920×1080.
3. Click **Reset session** on the hub once, before flow 0. Do not reset again,
   because flow 2 needs the authorization that flow 1 creates.
4. Hide the dock and menu bar, turn off notifications and close other tabs.
5. Export each clip to `video/public/clips/` with the file name on its slate.

| Role in the cut | Vehicle | Plate | VIN |
| --- | --- | --- | --- |
| Birth of the VIN | 2026 Mercedes-Benz GLE 450 | none yet | `4JGFF5KE9SB412009` |
| Happy path | 2023 Mercedes-AMG GLE 63 S | CKXR 214 | `4JGFB8KB5PA812634` |
| Catch 1, export | 2022 Land Rover Range Rover Sport | CPLR 482 | `SALWR2SE4NA209311` |
| Catch 2, US title | 2024 Lexus GX 550 | CTRV 657 | `JTJTABGX9R4027418` |
| Catch 3, write-off | 2025 Toyota Highlander | BWTP 903 | `5TDEBRCH7SS041927` |

## Look and sound

The feel is a SaaS launch video at walkthrough length: product shots up close,
short headline cards, music throughout. The claims are unchanged, and stay
conditional.

**Recording (CleanShot).**

- Background: a solid `#081527`, the video's navy, not the blue-teal gradient
  the 2026-09-15 takes used. The window then sits on the same ground as the
  cards and the cut never changes colour.
- Zoom on every reveal the voice names: the decision card, the nine checks,
  the certificate, the owner rail, the red hold, each catch's failing row.
  Hold the zoom for the line, then ease back out. Full-window shots only for
  orientation, a second at most.
- Hit the marks. Each shot below lists its actions with the second, within
  the shot, where the voice names them. Record the take to reach each action
  by its mark, or trim and speed-ramp it in CleanShot until it does. The voice
  lines start on those marks in `video/src/lines.ts`.
- Cursor smoothing on, the cursor hidden when idle, no click rings.
- No waiting on screen. Paste VINs instead of typing them, and cut out
  loading. Flow 1a plays at 1.5× today; re-record it at 1× without the pauses.

**Cards.** An eyebrow and a headline of two to five words, rising in word by
word. `\n` in a title forces the line break. Cards open the four acts of the
happy path and the catches. The three catches have no cards of their own: each
clip names itself with a corner label ("Catch 1 of 3", "Exported. No
re-entry."), so they run as one sequence.

**Music.** One track under the whole cut: modern, restrained, no vocals, with
enough pulse to cut the cards on. Licensed for this use. Two files, both
optional, both git-ignored:

- `video/public/audio/music.mp3`, the track alone. The cut plays it as a flat
  bed with a fade in and out, for the review render.
- `video/public/audio/soundtrack-ca.wav` and `soundtrack-us.wav`, the final
  mix of each version: voice and music cut
  against the locked picture in a DAW, the music up on the cards, the map and
  the close, down under the voice. When it is there, it replaces the bed.

No whooshes or UI sounds: they tip it from launch video into advert.

## Voiceover

- One voice narrates the whole video, speaking as "we", the FVBL team. Warm
  and plain, like someone showing people a thing they built. Contractions,
  "you", "say", "now", "so".
- **It says what's on screen, when it's on screen.** Every line belongs to one
  action in its shot and starts on that action's mark. A line names what the
  viewer is looking at ("It's green.", "Its history ends at the border."),
  then says why it matters. No line runs ahead of the picture.
- Short lines, one idea each. Around 155 words a minute. Pauses come from the
  gaps between lines, not from slowing down.
- No em dashes, no "not X, but Y", no stacked triples for rhythm, no filler
  ("It's important to note"). Plain verbs. Say "car", not "SUV", anywhere but
  the Range Rover.
- Nothing is claimed as live and no agency is named as a partner. Federal,
  third-party and US sources are always conditional ("with the right
  agreements", "with border export records connected", "with access to NMVTIS").
- The voice reads the bridge card, not the other cards. They are short (2.5 to
  3 s) so the silence doesn't read as dead air.
- Record the voice last, against the locked picture. `pnpm render:review:ca`
  (or `:us`)
  renders the cut with each line as a caption, on its mark, to check the
  script against the picture first.

The figure in the hero is from CARFAX Canada's 2025 Year in Rear View,
released 2025-11-25: "more than 372,000 potentially cloned VINs in Canada", up
from 141,260 the year before. It is an estimate of *potential* clones, so the
screen and the voice both say "may". No public non-Carfax count exists:
Équité Association and police describe re-VINing but don't publish a number.
The call on 2026-09-18 said not to approach Carfax yet; citing a published
figure isn't approaching them, but it puts their name on the first frame, so
it is on the Policaro list.

---

## Hero · 27 s · `video/src/Opening.tsx`

Four beats, each with its line 10 frames in:

| Mark | On screen | VO |
| --- | --- | --- |
| 0.3 s | **372,000**, counting up, "vehicles in Canada may carry a cloned VIN." then "Each one borrows a real car's identity." Source along the bottom. The US version shows **38,500,000**, "used cars change hands in the US every year.", then "Every sale trusts the VIN." (Cox Automotive, 2026 forecast). | *More than 372,000 vehicles in Canada may carry a cloned VIN. Each one borrows a real car's identity.*<br>US: *38.5 million used cars change hands in the US every year. Every sale trusts the VIN.* |
| 8.3 s | "The same trick crosses the border." US: "Not every VIN tells the truth." | *The same trick crosses the border.*<br>US: *Crime rings clone VINs and forge titles so stolen cars pass as clean.* |
| 13 s | "Built to catch it at the registration counter." | *FVBL is built to catch it at the counter.* |
| 17.7 s | The FVBL lockup, "A secure ledger of vehicle ownership." | *With the right agreements, it checks a car against government, insurance and border records, and keeps its history on a secure ledger.* |

## Act 1 · the happy path

### Card · 2.5 s

> *Registration.* **Day one, on the ledger.**

### Flow 0 · dealer, first registration · 12 s · `flow-0.mp4` · new

| # | Mark | Window | Action | VO |
| --- | --- | --- | --- | --- |
| 0.1 | 0.3 s | Dealer | On `/dealer/register`, paste the new VIN. It decodes as a 2026 Mercedes-Benz GLE 450, no registration on file. | *A dealer enters a new car's VIN.* |
| 0.2 | 3.5 s | Dealer | Tick the NVIS check mark, **Continue**, check the first owner, **Submit to ministry**. Awaiting confirmation. | *They confirm the first owner and send it in.* |
| 0.3 | 7.2 s | Phone | Tap the link in the MTO text, then **Confirm**. | *Then they confirm it by text.* |
| 0.4 | 9.7 s | Dealer | *Registration recorded*, the `FVBL-R-…` reference, the certificate. Hold to the end. | *Registration recorded.* |

### Card · 3 s

> *The request.* **The buyer asks.**

### Flow 1a · ServiceOntario, the buyer · 24 s · `flow-1a.mp4` · keep

The 2026-09-09 take, played at 1.5×. Top-right badge: "Concept mock-up. Not an
Ontario government page." The page is a saved copy of ontario.ca. The marks
are where the kept take already reaches each step.

| Mark | On screen | VO |
| --- | --- | --- |
| 0.3 s | The ServiceOntario home, then the UVIP card. | *Now say you're buying a used car. You start on ServiceOntario.*<br>US: *Now say you're buying a used car. Here, you start on ServiceOntario, Ontario's DMV.* |
| 7 s | "Buying this vehicle", then the VIN field. | *You're the buyer, so you enter the car's VIN.* |
| 12.7 s | The vehicle found, then the buyer's details. | *It finds the car. Then you add your own details.* |
| 17.7 s | The review, with the owner's details masked. | *You never need the owner's name or number.* |
| 21 s | Request sent. | *MTO sends the request on.*<br>US: *The DMV sends it on.* |

### Card · 2.5 s

> *Consent.* **The owner says yes.**

### Flow 1b · phone, the owner · 19 s · `flow-1b.mp4` · re-record

Re-record: the 2026-09-15 take still shows "FVBL:" as the sender, and the
voice says the text is from MTO.

| # | Mark | Action | VO |
| --- | --- | --- | --- |
| 1.4 | 0.3 s | Nothing. The MTO text: who is asking, for which car, the link, 24 hours. Zoom on it. | *The owner gets a text from MTO. It says who's asking, and for which car.*<br>US: *The owner gets a text from the DMV. It says who's asking, and for which car.* |
| 1.5 | 7 s | Tap the link. The vehicle, the plate, "Requested by …", Approve and Deny. | *They open the link and see the request.* |
| 1.6 | 10.7 s | Tap **Approve** at about 12 s. Green check, "Authorization recorded", the reference. | *If they approve, the buyer gets the car's history and none of their personal details.* |
| | 16.6 s | Hold on "Authorization recorded". | *FVBL records it.* |

### Card · 3 s

> *At the counter.* **Every check. One screen.**

### Flow 2 · portal, the happy path · 50 s · `flow-2a…2d.mp4` · re-record

One continuous take, split into four clips. 2a and 2b carry the sources
caveat in the top-left corner. The 2026-09-15 takes stand in: they start on
the sign-in page and show eight checks, not nine.

| # | Clip | Mark | Action | VO |
| --- | --- | --- | --- | --- |
| 2.1 | 2a · 13 s | 0.3 s | On Home, click **CKXR 214** at about 2 s. | *At the counter, the clerk looks up the car.* |
| | | 5 s | The page is open, green: **Authorized to issue**, "All 9 passed". Zoom on the decision card. | *It's green. Every check passed, and the owner has approved.* |
| 2.2 | 2b · 9 s | 0.3 s | Scroll to the nine rows. "All 9 sources answered". | *With the right agreements, insurers, Carfax and border records sit next to the ministry's own.*<br>US: *…sit next to the DMV's own.* |
| 2.3 | 2c · 12 s | 0.3 s | **Vehicle history** tab. The lifecycle strip. | *Together, they make up the car's history.* |
| | | 5.7 s | Open a row's **Blockchain certified** mark. The certificate: source, recorded, "Matches the record". | *Each event is certified on the ledger. If anyone changed it, the check would fail.* |
| 2.4 | 2d · 16 s | 0.3 s | In the rail, **Show** the owner's details. "FVBL logs each reveal against your badge". | *The owner's details stay hidden until the clerk needs them. FVBL logs each reveal to their badge.* |
| | | 10 s | Back to the top, **Issue package**. **Package issued** and the certified event in the feed. Hold 4 s. | *Everything checks out. Package issued.* |

## Act 2 · the catches

### Bridge · 4.5 s

> *Three catches.* **When a VIN doesn't add up.**

VO at 0.5 s: *Here are three cars that today's counter checks would clear.* "Counter" matters: a Carfax report could flag two of the three, but nothing puts it in front of the clerk or holds the package.

### Flow 3a · export with no re-entry · 30 s · `flow-3a.mp4` · new

Corner label "Catch 1 of 3 · Exported. No re-entry." Sources caveat in the
corner.

| # | Mark | Action | VO |
| --- | --- | --- | --- |
| 3.1 | 0.3 s | On Home, click **CPLR 482** by 1 s. Red: **Hold, do not issue**, "This VIN was reported exported and has no re-entry on record", and the footnote that the MTO record alone would have shown it as clear. Hold to 10 s. | *This SUV is clean in Ontario's own records. But with CBSA export records connected, FVBL sees it was reported leaving Canada.*<br>US: *This SUV is clean in the DMV's own records. But with Canadian border records connected, FVBL sees it was reported leaving Canada.* |
| 3.2 | 10.2 s | **Vehicle history** tab. The strip ends on the dashed **No re-entry** stop. Zoom on it. | *Its history ends at the border, with no record of it coming back.* |
| | 16 s | Back to the top, on the red card. No clicks. | *So either that record is wrong, or this car isn't the one the VIN belongs to.* |
| 3.3 | 23 s | **Refer for investigation**. **Referred, do not issue**, "Referred to MTO Investigations", "MTO Investigations notifies the OPP and CBSA after review", the case reference, and the instruction not to share the reason with the customer. Hold to the end. | *The clerk holds the package and refers the file to MTO investigators.*<br>US: *…to the DMV's investigators.* |

### Flow 3b · US title conflict · 18.5 s · `flow-3b.mp4` · new

Corner label "Catch 2 of 3 · One VIN. Two countries." Not "the same VIN":
straight after catch 1, that reads as the Range Rover. Sources caveat.

| # | Mark | Action | VO |
| --- | --- | --- | --- |
| 3.4 | 0.3 s | On Home, click **CTRV 657**. Red: **Hold, do not issue**. | *This car is clean in Ontario too.*<br>US: *This car's DMV record is clean too.* |
| | 4 s | Zoom on the **US title record** row by 5 s: the active Pennsylvania title from NMVTIS. | *With access to NMVTIS, the US federal title database, the check also looks across the border.* |
| | 11.8 s | Ease out to the red card. Hold. No referral. | *There's an active title for this VIN in Pennsylvania. The package is on hold.* |

### Flow 3c · write-off · 17 s · `flow-3c.mp4` · re-record, was flow 3

Corner label "Catch 3 of 3 · Written off. On a second plate." Sources caveat:
the rows name IBC and Carfax.

| # | Mark | Action | VO |
| --- | --- | --- | --- |
| 3.5 | 0.3 s | On Home, click **BWTP 903**. Red. | *Ontario already brands written-off cars.*<br>US: *The DMV already brands written-off cars.* |
| | 3.3 s | Zoom on **Insurer write-off**: "This vehicle was declared a total loss", "Reported by IBC and Carfax". | *Insurer records show this one was written off last year.* |
| | 9 s | Zoom on **Duplicate identity**: "Also on Ontario plate CRHM 118". Hold. No referral. | *Now its VIN is on a second Ontario plate. That's a write-off coming back under another identity.*<br>US: *Now its VIN is on a second plate. …* |

## Close

### Map · 17.5 s · `video/src/MapScene.tsx`

The real map: Canada's provinces and territories and the US states, with the
Great Lakes and Canada's big lakes as water. The ledger is the FVBL mark,
calling back the title cards, off the Atlantic coast in neither country,
labelled "One shared ledger". Outlines are Natural Earth (public domain), generated into
`video/src/map-shapes.ts` by `node scripts/map-shapes.mjs`. The sources
caveat sits in the bottom-right corner.

| Mark | On screen | VO |
| --- | --- | --- |
| 0.3 s | Faint borders, the Great Lakes as water. Every state and province lights in teal together, rippling out from the border. One arc runs from each capital, Ottawa and Washington, to the ledger, drawn as the FVBL mark. | *Both countries connect to the ledger.* |
| 3.7 s | Every region's records streak into the ledger from 6.3 s. | *With border, transport and insurance records connected, provinces and states can use the same ledger.*<br>US: *…states and provinces can use the same ledger.* |
| 11.1 s | A flag leaves Ontario and one leaves Ohio. Both reach the ledger and go out to every region, each landing on the other, which lights up. | *A flag raised on one side of the border can show up on the other.* |

### Close · 6 s

> **A secure ledger of vehicle ownership.** FVBL
> Concept demonstration. All data is fictional.

VO at 0.3 s: *FVBL. A secure ledger of vehicle ownership.* Fade out in
silence.

---

## Runtime

| Section | Frames | Seconds |
| --- | --- | --- |
| Hero | 810 | 27 |
| Dealer, card and flow 0 | 435 | 14.5 |
| Buyer, card and flow 1a | 806 | 27 |
| Owner, card and flow 1b | 646 | 21.5 |
| Clerk, card and flow 2 | 1590 | 53 |
| Bridge | 135 | 4.5 |
| Catches, flows 3a to 3c | 1965 | 65.5 |
| Map | 525 | 17.5 |
| Close | 180 | 6 |
| Handoffs, 17 × 16 | −272 | −9 |
| Total | 6820 | 3:47 |

If a take runs long, trim flow 1a and flow 2 first. Never trim the catches,
and never cut a shot below its lines: a line's mark moves with its action.

## Left out on purpose

- The clerk-triggered request, the owner-initiated pre-approval, deny and
  timeout. Built; mention if asked.
- Referral on catches 2 and 3. Shown once.
- An ask card. It depends on what Policaro wants to ask for.
- Revenue and fees.

## Assembly

Hero, dealer card, 0, buyer card, 1a, owner card, 1b, clerk card, 2a, 2b, 2c,
2d, bridge, 3a, 3b, 3c, map, close.

Record, drop the clips in `video/public/clips/`, run `pnpm durations`, paste
the frame counts into `Demo.tsx` and the total into `DURATION` in
`Root.tsx`. If a take reaches an action later or earlier than its mark, move
that line's `at` in `lines.ts` to match; both versions share it.
`pnpm render:review:ca` or `:us` for the captioned review cut,
`pnpm render:ca` or `pnpm render:us` for the finals once the voice is laid.
