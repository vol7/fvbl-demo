# FVBL demo voiceover, v5

The voiceover for the v5 cut, ready to generate in ElevenLabs. The lines are
`video/src/lines.ts`; each one starts on the frame its action happens on
screen (the marks in `docs/screenplay.md`). If you change a line, change it in
all three places.

44 lines, about 520 words over 4:12 in the Canada cut. Four of them are
Canada only (2026-09-30): the four-car bridge and catch 4, at the border. The poster that opens the cut is silent.

**Two versions, one picture.** The cut goes out Canada-first or US-first.
Both play the same marks; what changes is the hero figure, which opens on the
viewer's own country, the lines that name an agency or a document, and the
US flow and catches (`docs/us-version.md`).

**Shared lines (2026-09-29).** 24 of the 40 lines describe what happens on
screen, not where, and read the same in both cuts. They are recorded once, in
`video/public/audio/vo/ca/`; the US cut plays those takes. The US footage is
recorded shot for shot to Canada's marks, so each shared line lands on the
same action. The US needs its own takes only for its 17 own lines, in
`video/public/audio/vo/us/`:

| Line | US-only because | Status |
| --- | --- | --- |
| 01, 02 | The US figure and the crime line | Written |
| 04 | "State records", not "government" | Draft |
| 09 | Ohio's title search, not ServiceOntario | Draft |
| 13, 14, 20 | The state, not MTO or the ministry | Draft |
| 16 | A US buyer sees the owner confirmed, not the car's history | Draft |
| 24 | "Title issued", not "Package issued" | Draft |
| 26, 29 | CBP, no re-entry to the US; state investigators | Draft |
| 30, 31, 32 | Catch 2 flipped: the VIN is active in Ontario | Draft |
| 33, 35 | Catch 3 flipped: a salvage title re-titled clean in another state | Draft |
| 37 | "States and provinces" | Written; could share Canada's order to save a take |

Every US-only line is now drafted for the Ohio flow and carries `US_DRAFT` in
`lines.ts` (2026-09-29): check each against its footage once it is recorded.
The US texts are in `lines.ts`; the entries below still show the Canada text
for most of them.

In both: "across the border", never "south of" it, and the voice never says
where the ledger is hosted. The US map draws the states in full and Canada
whole, with no hub; the Canada cut's inverse is next.

## Voice

- **One voice for the whole video**, speaking as "we", the FVBL team.
- **Neutral North American English**, in both versions. The audience is
  Canadian (MTO, CBSA, the RCMP, Transport Canada) or US federal contacts.
  Use the same voice for both, so the two cuts sound like one team.
- **Warm and professional.** Like someone showing a thing they built to people
  who will scrutinise it. Friendly, never salesy. No upswing at the end of
  sentences, no excitement on the stats.
- **Say what's on screen.** Each line describes what the viewer is looking at
  as it appears. Read them as short, separate thoughts, not one flowing
  narration. The gaps between files are the pauses.
- **About 155 words a minute.** Slightly slower on the catches.

## Scratch voice

Before spending ElevenLabs credits, `pnpm voice:scratch` reads every Canada
line with the macOS `say` voice into `video/public/audio/vo-scratch/ca/`, then
prints each take's length against its room; `pnpm voice:scratch --audience us`
does the US's own lines into `vo-scratch/us/` and times the shared ones from
their Canada takes. It never touches the recorded takes in `vo/`. The cut plays
a recorded take where there is one and the scratch take for every other line,
so `pnpm render:review:ca` (or `:us`) gives a rough cut with the voice on its
marks, even while only some lines are recorded. `pnpm voice:scratch --check`
writes nothing and times what the cut plays now, marking each line `take` or
`scratch`: run it after dropping in a take to see whether it fits.

## ElevenLabs

- Use the same voice, model and settings for every file, or the lines won't
  match when cut together. Write the settings down once you like them.
- Keep stability fairly high and style low. Consistency matters more than
  expression here.
- Generate each line as its own file, named by its id. Changing one line
  after feedback then means regenerating one file.
- Paste the quoted text under each line, not the text in `lines.ts`. It spells
  out the numbers and acronyms so they're read correctly.
- Generate a few takes of each file and keep the best one. Listen for the
  pronunciations below every time.
- Trim the silence at the start of each file: the cut starts it on its mark.
- Export as WAV (48 kHz) if your plan allows it, otherwise the highest-quality
  MP3. Save to `video/public/audio/vo/<ca|us>/<id>.wav` (or `.mp3`). A
  shared line needs a copy of its take in both folders. That folder is
  git-ignored. The cut plays whatever is there and skips what isn't.
- The v4 takes in `video/public/ElevenLabs_FVBL/` are for the old script and
  no longer play.

**US test run (2026-09-29).** Voice "Victoria - Warm, Trustworthy, and
Relatable" (`qSeXEcewz7tA0Q0qk9fH`), model `eleven_v4`, default settings, no
audio tags, generated through the ElevenLabs flow
`p1AKfNqN3SzhByo65kYx`. All 40 lines are in `vo/us/`, shared ones included,
since the Canada takes are still scratch. Each line had two takes. Both were
trimmed of silence below -50 dB and converted to 48 kHz mono WAV. The longer
take that fits its room plays, and the other is in `vo/us/alt/`. Victoria
reads slower than the scratch voice, so the hero's marks moved to fit her:
the turn card holds 30 frames longer, 04b starts 15 frames later with the
ledger animation, and 17 starts 8 frames earlier, since the phone clip ends
at the shot's end. Every take now fits its room.

**Canada, 2026-09-30.** The 2026-09-25 scratch that sat in `vo/ca/` is in
`vo/ca/old-scratch-2026-09-25/`, where the cut doesn't read it. `vo/ca/` now
holds Victoria's takes for the 14 lines both cuts share, plus
`23-clerk-reveal` and `37-map-connect`, whose Canada text reads the same as
the US one. Canada's other 27 lines, its own wording and the border catch,
were generated the same day in the same voice, model and settings, through
the ElevenLabs flow `nwvw9Wk54SJFhlh63RXd`: two takes each, trimmed below
-50 dB, 48 kHz mono, the longer take that fits in `vo/ca/` and the other in
`vo/ca/alt/`. Two Canada marks moved to fit Victoria, Canada only: 02 starts
8 frames later (01 runs 8.1 s) and 37 starts 4 frames later (36 runs 3.36 s).
The US bridge line, `25-bridge-sources`, had no take and got one on the same
flow. Every line in both cuts now plays a recorded take, and every take fits
(`pnpm voice:scratch --check`, and `--audience us`).

## Pronunciation

Settle these before generating anything, then use the same forms in every
file. If a word keeps coming out wrong, add it to an ElevenLabs pronunciation
dictionary rather than fixing it take by take.

| Word | Say it | Typed as | Note |
| --- | --- | --- | --- |
| FVBL | "F-V-B-L", four letters | F V B L | Letters, decided 2026-09-29. |
| NMVTIS | "N-M-V-T-I-S" | N M V T I S | **Decide:** some US agencies say "nim-VEE-tis". Ask the US contact. |
| MTO | "M-T-O" | M T O | Canada version |
| CBSA | "C-B-S-A" | C B S A | Canada version |
| ServiceOntario | "service Ontario" | Service Ontario | |
| CBP | "C-B-P" | C B P | US version |
| VIN | "vin", one syllable, rhymes with "win" | /vɪn/ (plural /vɪnz/) | IPA between slashes. `eleven_v4` spells "VIN" out as letters, 2026-09-29. |
| Carfax | "CAR-fax" | Carfax | |
| 372,000 | "three hundred seventy-two thousand" | three hundred seventy-two thousand | |
| 38.5 million | "thirty-eight and a half million" | Thirty-eight and a half million | US version |
| US | "U.S.", two letters | U.S. | Typed with periods so it isn't read as "us". |
| 2025 | "twenty twenty-five" | twenty twenty-five | |

## Lines

**Max** is how long the file can run before the next line starts (or the shot
ends), less a breath. If a take runs over, tighten the read first, then tell
whoever edits the cut which mark needs to move.

### Hero · 29.5 s

**`01-hero-stat`** · starts at 0.3 s · max 7.8 s

Canada:

> More than three hundred seventy-two thousand vehicles in Canada may carry a cloned /vɪn/. Each one uses a real car's identity.

US:

> Thirty-eight and a half million used cars change hands in the U.S. every year. Every sale relies on the /vɪn/.

No one publishes a US count of cloned VINs, so the US version opens on the
market cloning preys on (Cox Automotive's 2026 forecast, 38.5 million,
updated 2026-09-24). The screen shows 38,500,000; the voice matches it.

Even and grounded. No lift on the number.

**`02-hero-problem`** · starts at 8.3 s · max 5.5 s

Canada (the card reads "On paper, they look like the real thing."):

> Crime rings clone /vɪnz/ to sell stolen cars, here and across the border.

US (the card reads "Some of them carry a copied VIN."):

> Some of them carry a copied /vɪn/. Crime rings forge titles to match.

**`03-hero-mission`** · starts at 14.0 s · max 3.1 s

> F V B L is built to catch them at the counter.

The card reads the same. "Them" is the cloned or copied VINs on the card before.

**`04-hero-ledger`** · starts at 17.3 s · max 5.6 s

Canada:

> With the right agreements, it checks each car against government, insurance and border records.

US ("state": the states keep their own records):

> With the right agreements, it checks each car against state, insurance and border records.

Lean a little on "with the right agreements": it's the condition.

**`04b-hero-secure`** · starts at 23.2 s · max 5.6 s

> Its history goes on a secure ledger, where no one can change a record without it showing.

Calm and certain. "Without it showing" is the claim: tamper-evident, not
tamper-proof. Never "can't be hacked" or "untamperable".

### Dealer card · 4 s

**`04c-dealer-card`** · starts at 0.3 s · max 2.9 s

> First, let's look at a clean sale.

The hand-over from the intro to the clean flow. Both cuts. The catches get
their own hand-over later, over the bridge card.

### Dealer, flow 0 · 12 s

**`05-dealer-vin`** · starts at 0.3 s · max 2.5 s

> A dealer enters a new car's /vɪn/.

**`06-dealer-submit`** · starts at 3.0 s · max 3.0 s

Canada:

> They add the first owner and send it to the ministry.

US:

> They add the first owner and submit the first title.

**`07-dealer-text`** · starts at 6.2 s · max 2.3 s

> A text confirms it's really them.

The text is there to prove it's the dealer, so the line says so.

**`08-dealer-recorded`** · starts at 8.7 s · max 2.5 s

> This is the car's first entry on the ledger.

The lines run close together to keep registration short, which the client
asked for. There's about a quarter-second between each.

### Buyer, flow 1a · 23.8667 s

**`09-buyer-start`** · starts at 0.3 s · max 6.5 s

Canada:

> Now say you're buying a used car. F V B L can show that its history hasn't been tampered with.

US:

> Now say you're buying a used car. F V B L can confirm the seller is the real owner.

The buyer section opens on what FVBL gives the buyer, then shows how. In
Canada that is the car's history, and "show that… hasn't been tampered with"
keeps the tamper-evident claim, never "can't be changed". A US buyer never
sees the history (NMVTIS data can't go to the public), only title status and
"Owner confirmed", so the US line promises the owner check: protection
against title theft.

**`10-buyer-vin`** · starts at 7.0 s · max 5.5 s

Canada:

> On Service Ontario, you enter the car's /vɪn/.

US:

> On the state's title search, you enter the car's /vɪn/.

**`11-buyer-details`** · starts at 12.7 s · max 4.8 s

Canada:

> It finds the car. Then you add your own details.

US:

> It finds the title. Then you add your own details.

Ohio's title search shows the title's status, never the car or its history.

**`12-buyer-private`** · starts at 17.7 s · max 3.1 s

> You never need the owner's name or number.

**`13-buyer-send`** · starts at 21.0 s · max 2.1 s

Canada:

> M T O sends the request on.

US:

> The state sends it to the owner.

### Owner, flow 1b · 19.0333 s

**`14-owner-text`** · starts at 0.3 s · max 6.5 s

Canada:

> The owner gets a text from M T O. It says who's asking, and for which car.

US:

> The owner gets the title alert they signed up for. It says who's asking, and for which car.

**`15-owner-open`** · starts at 7.0 s · max 3.5 s

> They open the link and see the request.

**`16-owner-approve`** · starts at 10.7 s · max 5.5 s

Canada:

> If they approve, the buyer gets the car's history and none of their personal details.

US (draft):

> If they approve, the buyer sees that the owner confirmed, and nothing about who they are.

### Clerk, flow 2a · 11.5 s

**`18-clerk-lookup`** · starts at 0.3 s · max 4.5 s

> At the counter, the clerk looks up the car.

**`19-clerk-green`** · starts at 5.0 s · max 5.8 s

Canada:

> It's green. Every check passed, and the owner has approved.

US:

> It's green. Every check passed, and the owner confirmed the sale.

A small smile on "It's green."

### Clerk, flow 2b · 9 s

**`20-clerk-sources`** · starts at 0.3 s · max 7.9 s

Canada:

> With the right agreements, insurers, Carfax and border records sit next to the ministry's own.

US:

> With the right agreements, border, theft and out-of-state title records sit next to the state's own.

The US checks are C B P, N I C B, N M V T I S and other states on the ledger. No Carfax or insurer feed.

Keep the pace up. "With the right agreements" is the condition, so give it room.

### Clerk, flow 2c · 12 s

**`21-clerk-history`** · starts at 0.3 s · max 5.1 s

> Together, they make up the car's history.

**`22-clerk-certified`** · starts at 5.7 s · max 5.6 s

> Each event is certified on the ledger. If anyone changed it, the check would fail.

### Clerk, flow 2d · 14 s

**`23-clerk-reveal`** · starts at 0.3 s · max 7.5 s

> The owner's details stay hidden until the clerk needs them. F V B L logs each reveal to their badge.

**`24-clerk-issued`** · starts at 8.0 s · max 5.3 s

Canada:

> Everything checks out. Package issued.

US (draft):

> Everything checks out, so the clerk issues the title.

F V B L informs and the clerk decides: the US card has no issue button.

A beat after "checks out". Say "Package issued" (or "Title issued") plainly, as the payoff.

### Bridge card · 5 s

**`25-bridge-sources`** · starts at 0.5 s · max 7.0 s

> With these sources connected, here are three cars F V B L would flag.

Both cuts (2026-09-30), after the map, which now comes before the catches.
"These sources" are the records the map just showed connecting. It replaces
"Of course, that's when everything goes smoothly…", which closed the clean
sale. Needs a new Canada take; the US plays the same one.

A small drop in tone. The easy part is over.

**`25c-bridge-four`** · Canada only · starts at 0.5 s · max 7.0 s

> With these sources connected, here are four cars F V B L would flag.

Canada's cut has a fourth catch at the border (2026-09-30), so it gets its own
line and take. The US keeps `25-bridge-sources` and its three cars. Same
delivery.

### Catch 1, export, flow 3a · 27 s

**`26-export-flag`** · starts at 0.3 s · max 9.6 s

Canada:

> This SUV is clean in Ontario's own records. But with C B S A export records connected, F V B L sees it was reported leaving Canada.

US:

> This SUV is clean in the state's own records. But with C B P export records connected, F V B L sees it was reported leaving the U.S.

**`27-export-strip`** · starts at 10.2 s · max 4.6 s

> Its history ends at the border, with no record of it coming back.

**`28-export-question`** · starts at 15.0 s · max 6.3 s

> So either that record is wrong, or this car isn't the one the /vɪn/ belongs to.

Measured. This is the line the audience should remember.

**`29-export-refer`** · starts at 21.5 s · max 4.8 s

Canada:

> The clerk holds the package and refers the file to M T O investigators.

US:

> The clerk holds the title and refers the file to state investigators.

Calm and procedural.

### Catch 2, US title, flow 3b · 16.5 s

**`30-us-clean`** · starts at 0.3 s · max 3.5 s

Canada:

> This car is clean in Ontario too.

US:

> This car's title looks clean too.

**`31-us-nmvtis`** · starts at 4.0 s · max 6.3 s

Canada:

> With access to N M V T I S, the U.S. federal title database, the check also looks across the border.

Check the NMVTIS read every take.

US (draft; never "federal database" for this audience):

> With Canadian registration records connected, the check also looks across the border.

**`32-us-title`** · starts at 10.5 s · max 5.3 s

Canada:

> There's an active title for this /vɪn/ in Pennsylvania. The package is on hold.

US (draft):

> This /vɪn/ is active on an Ontario registration, so the clerk holds it for review.

### Catch 3, write-off, flow 3c · 17 s

**`33-writeoff-brand`** · starts at 0.3 s · max 2.8 s

Canada:

> Ontario already brands written-off cars.

US:

> States already brand salvage cars.

**`34-writeoff-loss`** · starts at 3.3 s · max 5.5 s

Canada:

> Insurer records show this one was written off last year.

US:

> This one was branded salvage in Kentucky in twenty twenty-four.

The screen shows the Kentucky salvage title from the brand record. The voice keeps the clean title in "another state", not Indiana, so it doesn't blame one.

**`35-writeoff-plate`** · starts at 9.0 s · max 7.3 s

Canada:

> Now its /vɪn/ is on a second Ontario plate. That's a write-off coming back under another identity.

US:

> Now this /vɪn/ has a clean title in another state. That's a salvage car passing as clean.

### Catch 4, the border, flow 3d · Canada only · 20 s

From the 2026-09-30 call. The CBSA officer's card for the RAM 1500, recorded
after its owner said no. No US version: the US cut skips the shot.

**`40-border-ledger`** · starts at 0.3 s · max 6.5 s

> With the right agreements, C B S A can check the same ledger before a car is loaded.

"With the right agreements" keeps CBSA from sounding like a partner. "The same
ledger" ties it to the clerk's catches just before it.

**`41-border-owner`** · starts at 7.2 s · max 8.0 s

> This truck's permit is real, and it isn't reported stolen. But its owner was asked by text, and said no.

A beat after "stolen". The paperwork is clean; only the owner's answer catches
it. "Said no" lands on the red cell.

**`42-border-container`** · starts at 15.5 s · max 3.5 s

> So officers know which container to open.

Lands on the container number. That's the point Fawaz made: out of a hundred,
this is the one.

### Map · 17.5 s

**`36-map-ledger`** · starts at 0.3 s · max 3.1 s

Each cut names only its own regions. The neighbour shows up on the map, not
in the voice (2026-09-30).

Canada:

> Every province and territory can connect to the same ledger.

US:

> Every state can connect to the same ledger.

Says nothing about where the ledger is hosted, on purpose. "Can connect"
keeps each province or state in charge of joining.

**`37-map-connect`** · starts at 3.7 s · max 7.2 s

Canada:

> With the right agreements, neighbouring countries can join too. Cars that cross the border keep their history.

US:

> With the right agreements, neighboring countries can join too. Cars that cross the border keep their history.

"Neighbouring countries" lands as the other country lights up on the map.
The second sentence is the cross-border problem: cars move in and out, and
their records follow them.

**`38-map-border`** · starts at 11.1 s · max 5.7 s

Canada:

> A flag raised in one province can reach every other, and across the border.

US:

> A flag raised in one state can reach every other, and across the border.

A little lighter, looking ahead. Then silence.

### Close · 6 s

**`39-close`** · starts at 0.3 s · max 4.9 s

> F V B L. A secure ledger of vehicle ownership.

Slow, with a pause after "F V B L". Then silence to the fade.

## Checklist

- [ ] FVBL and NMVTIS pronunciations decided
- [x] Voice, model and settings chosen and written down here (US test run)
- [ ] 39 files per version generated, each under its max, plus Canada's four
      (25c, 40, 41, 42)
- [ ] Every file listened to for the pronunciations
- [ ] Files in `video/public/audio/vo/ca/` and `vo/us/`, named by id

## Not in the voiceover

The title cards have no voice, except the bridge. The music carries them. The
caveats on screen ("Concept. Third-party, federal and cross-border sources
are illustrative…") aren't read aloud either. The conditions in the lines
themselves ("with the right agreements", "with access to") do that job.
