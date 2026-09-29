# FVBL demo voiceover, v5

The voiceover for the v5 cut, ready to generate in ElevenLabs. The lines are
`video/src/lines.ts`; each one starts on the frame its action happens on
screen (the marks in `docs/screenplay.md`). If you change a line, change it in
all three places.

39 lines, about 430 words over 3:47.

**Two versions, one picture.** The cut goes out Canada-first or US-first.
Both play the same shots on the same marks; what changes is the hero figure,
which opens on the viewer's own country, and the agency names in the voice.
The Canada version says MTO, the ministry and CBSA. The US version says the
DMV and introduces ServiceOntario as "Ontario's DMV". Lines that name no
agency are shared and read the same in both. Each version has its own takes,
in `video/public/audio/vo/ca/` and `video/public/audio/vo/us/`.

In both: "across the border", never "south of" it, and the voice never says
where the ledger is hosted. The map lights both countries together.

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
line with the macOS `say` voice into `video/public/audio/vo/ca/`, then prints
each take's length against its room; `pnpm voice:scratch --audience us` does
the US lines into `vo/us/`. The cut plays those files, so
`pnpm render:review:ca` (or `:us`) gives a rough cut with the voice on its
marks. The real takes overwrite them.

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

## Pronunciation

Settle these before generating anything, then use the same forms in every
file. If a word keeps coming out wrong, add it to an ElevenLabs pronunciation
dictionary rather than fixing it take by take.

| Word | Say it | Typed as | Note |
| --- | --- | --- | --- |
| FVBL | "F-V-B-L", four letters | F V B L | **Decide:** letters, or does the team say it as a word? |
| NMVTIS | "N-M-V-T-I-S" | N M V T I S | **Decide:** some US agencies say "nim-VEE-tis". Ask the US contact. |
| MTO | "M-T-O" | M T O | Canada version |
| CBSA | "C-B-S-A" | C B S A | Canada version |
| ServiceOntario | "service Ontario" | Service Ontario | |
| DMV | "D-M-V" | D M V | US version |
| VIN | "vin", one syllable, rhymes with "win" | VIN | Check it isn't spelled out. |
| Carfax | "CAR-fax" | Carfax | |
| 372,000 | "three hundred seventy-two thousand" | three hundred seventy-two thousand | |
| US | "U.S.", two letters | U.S. | Typed with periods so it isn't read as "us". |
| 2025 | "twenty twenty-five" | twenty twenty-five | |

## Lines

**Max** is how long the file can run before the next line starts (or the shot
ends), less a breath. If a take runs over, tighten the read first, then tell
whoever edits the cut which mark needs to move.

### Hero · 27 s

**`01-hero-stat`** · starts at 0.3 s · max 7.8 s

Canada:

> More than three hundred seventy-two thousand vehicles in Canada may carry a cloned VIN. Each one borrows a real car's identity.

US:

> Thirty-eight and a half million used cars change hands in the U.S. every year. Every sale trusts the VIN.

No one publishes a US count of cloned VINs, so the US version opens on the
market cloning preys on (Cox Automotive's 2026 forecast, 38.5 million,
updated 2026-09-24). The screen shows 38,500,000; the voice matches it.

Even and grounded. No lift on the number.

**`02-hero-problem`** · starts at 8.3 s · max 4.7 s

Canada:

> The same trick crosses the border.

US (the card reads "Not every VIN tells the truth."):

> Crime rings clone VINs and forge titles so stolen cars pass as clean.

**`03-hero-mission`** · starts at 13.0 s · max 4.7 s

> F V B L is built to catch it at the counter.

**`04-hero-ledger`** · starts at 17.7 s · max 8.6 s

> With the right agreements, it checks a car against government, insurance and border records, and keeps its history on a secure ledger.

The longest line. Lean a little on "with the right agreements": it's the condition.

### Dealer, flow 0 · 12 s

**`05-dealer-vin`** · starts at 0.3 s · max 3.0 s

> A dealer enters a new car's VIN.

**`06-dealer-submit`** · starts at 3.5 s · max 3.5 s

> They confirm the first owner and send it in.

**`07-dealer-text`** · starts at 7.2 s · max 2.3 s

> Then they confirm it by text.

**`08-dealer-recorded`** · starts at 9.7 s · max 1.6 s

> Registration recorded.

### Buyer, flow 1a · 23.8667 s

**`09-buyer-start`** · starts at 0.3 s · max 6.5 s

Canada:

> Now say you're buying a used car. You start on Service Ontario.

US:

> Now say you're buying a used car. Here, you start on Service Ontario, Ontario's D M V.

Relaxed. This is where the story starts.

**`10-buyer-vin`** · starts at 7.0 s · max 5.5 s

> You're the buyer, so you enter the car's VIN.

**`11-buyer-details`** · starts at 12.7 s · max 4.8 s

> It finds the car. Then you add your own details.

**`12-buyer-private`** · starts at 17.7 s · max 3.1 s

> You never need the owner's name or number.

**`13-buyer-send`** · starts at 21.0 s · max 2.1 s

Canada:

> M T O sends the request on.

US:

> The D M V sends it on.

### Owner, flow 1b · 19.0333 s

**`14-owner-text`** · starts at 0.3 s · max 6.5 s

Canada:

> The owner gets a text from M T O. It says who's asking, and for which car.

US:

> The owner gets a text from the D M V. It says who's asking, and for which car.

**`15-owner-open`** · starts at 7.0 s · max 3.5 s

> They open the link and see the request.

**`16-owner-approve`** · starts at 10.7 s · max 5.7 s

> If they approve, the buyer gets the car's history and none of their personal details.

**`17-owner-recorded`** · starts at 16.6 s · max 1.7 s

> F V B L records it.

### Clerk, flow 2a · 13 s

**`18-clerk-lookup`** · starts at 0.3 s · max 4.5 s

> At the counter, the clerk looks up the car.

**`19-clerk-green`** · starts at 5.0 s · max 7.3 s

> It's green. Every check passed, and the owner has approved.

A small smile on "It's green."

### Clerk, flow 2b · 9 s

**`20-clerk-sources`** · starts at 0.3 s · max 7.9 s

Canada:

> With the right agreements, insurers, Carfax and border records sit next to the ministry's own.

US:

> With the right agreements, insurers, Carfax and border records sit next to the D M V's own.

Keep the pace up. "With the right agreements" is the condition, so give it room.

### Clerk, flow 2c · 12 s

**`21-clerk-history`** · starts at 0.3 s · max 5.1 s

> Together, they make up the car's history.

**`22-clerk-certified`** · starts at 5.7 s · max 5.6 s

> Each event is certified on the ledger. If anyone changed it, the check would fail.

### Clerk, flow 2d · 16 s

**`23-clerk-reveal`** · starts at 0.3 s · max 9.5 s

> The owner's details stay hidden until the clerk needs them. F V B L logs each reveal to their badge.

**`24-clerk-issued`** · starts at 10.0 s · max 5.3 s

> Everything checks out. Package issued.

A beat after "checks out". Say "Package issued" plainly, as the payoff.

### Bridge card · 4.5 s

**`25-bridge`** · starts at 0.5 s · max 3.3 s

> Here are three cars that today's counter checks would clear.

A small drop in tone. The easy part is over.

### Catch 1, export, flow 3a · 30 s

**`26-export-flag`** · starts at 0.3 s · max 9.6 s

Canada:

> This SUV is clean in Ontario's own records. But with C B S A export records connected, F V B L sees it was reported leaving Canada.

US:

> This SUV is clean in the D M V's own records. But with Canadian border records connected, F V B L sees it was reported leaving Canada.

**`27-export-strip`** · starts at 10.2 s · max 5.6 s

> Its history ends at the border, with no record of it coming back.

**`28-export-question`** · starts at 16.0 s · max 6.8 s

> So either that record is wrong, or this car isn't the one the VIN belongs to.

Measured. This is the line the audience should remember.

**`29-export-refer`** · starts at 23.0 s · max 6.3 s

Canada:

> The clerk holds the package and refers the file to M T O investigators.

US:

> The clerk holds the package and refers the file to the D M V's investigators.

Calm and procedural.

### Catch 2, US title, flow 3b · 18.5 s

**`30-us-clean`** · starts at 0.3 s · max 3.5 s

Canada:

> This car is clean in Ontario too.

US:

> This car's D M V record is clean too.

**`31-us-nmvtis`** · starts at 4.0 s · max 7.9 s

> With access to N M V T I S, the U.S. federal title database, the check also looks across the border.

Check the NMVTIS read every take.

**`32-us-title`** · starts at 11.8 s · max 5.9 s

> There's an active title for this VIN in Pennsylvania. The package is on hold.

### Catch 3, write-off, flow 3c · 17 s

**`33-writeoff-brand`** · starts at 0.3 s · max 2.8 s

Canada:

> Ontario already brands written-off cars.

US:

> The D M V already brands written-off cars.

**`34-writeoff-loss`** · starts at 3.3 s · max 5.4 s

> Insurer records show this one was written off last year.

**`35-writeoff-plate`** · starts at 9.0 s · max 7.3 s

Canada:

> Now its VIN is on a second Ontario plate. That's a write-off coming back under another identity.

US:

> Now its VIN is on a second plate. That's a write-off coming back under another identity.

### Map · 17.5 s

**`36-map-ledger`** · starts at 0.3 s · max 3.1 s

> Both countries connect to the ledger.

Says nothing about where the ledger is hosted, on purpose.

**`37-map-connect`** · starts at 3.7 s · max 7.2 s

Canada:

> With border, transport and insurance records connected, provinces and states can use the same ledger.

US:

> With border, transport and insurance records connected, states and provinces can use the same ledger.

**`38-map-border`** · starts at 11.1 s · max 5.7 s

> A flag raised on one side of the border can show up on the other.

A little lighter, looking ahead. Then silence.

### Close · 6 s

**`39-close`** · starts at 0.3 s · max 4.9 s

> F V B L. A secure ledger of vehicle ownership.

Slow, with a pause after "F V B L". Then silence to the fade.

## Checklist

- [ ] FVBL and NMVTIS pronunciations decided
- [ ] Voice, model and settings chosen and written down here
- [ ] 39 files per version generated, each under its max
- [ ] Every file listened to for the pronunciations
- [ ] Files in `video/public/audio/vo/ca/` and `vo/us/`, named by id

## Not in the voiceover

The title cards have no voice, except the bridge. The music carries them. The
caveats on screen ("Concept. Third-party, federal and cross-border sources
are illustrative…") aren't read aloud either. The conditions in the lines
themselves ("with the right agreements", "with access to") do that job.
