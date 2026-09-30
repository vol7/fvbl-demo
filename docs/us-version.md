# The US version of the demo video

The brief for the US-first cut, from the 2026-09-28/29 working sessions.
Linear: DES-50 (US video), DES-51 (Canada video). Read this before picking
up the US work in a fresh conversation.

## Where things stand

The video has two versions on one picture: Canada-first (`Demo-CA`) and
US-first (`Demo-US`). The switch is `video/src/audience.ts`.

Shared by both, and done:

- The title cards, the timing (marks in `video/src/lines.ts`) and the map.
- The map's voice. Line 36 is "Both countries connect to the ledger." and
  says nothing about where the ledger is hosted, on purpose: the hosting
  question stays open for either government.
- The mission card says "the registration counter", the caveat says
  "cross-border sources". Nothing says "south of the border".

Per version:

- The map. The US cut plays `MapPeers` (variant `join`): the usual US map
  with Canada drawn whole along the top, no hub and no capitals. States join
  one by one, streaking records into the FVBL mark beside the map; Ohio's
  flag goes in and back out to every region. The Canada cut still plays the
  joint map (`MapScene`); its inverse, provinces in full and the US drawn
  whole, is next. Shapes per version in `map-shapes.ts` (`MAP_CA`, `MAP_US`).
- The hero figure (`HEROES` in `video/src/Demo.tsx`) and hero lines 01–02.
- Lines that name an agency: MTO, the ministry and CBSA for Canada; the DMV
  for the US (`say()` in `lines.ts`).
- Takes in `video/public/audio/vo/<ca|us>/`, the mix in
  `video/public/audio/soundtrack-<ca|us>.wav`, and optionally clips in
  `video/public/clips/<ca|us>/`, which replace the shared clip of the same
  name.
- Commands: `pnpm render:ca`, `pnpm render:us`, `pnpm render:review:ca|us`,
  `pnpm voice:scratch --audience us`.

**Today the US version still plays the Ontario footage.** Its lines 09–35
were written for that footage ("ServiceOntario, Ontario's DMV", "a second
plate"). The US flow below replaces it.

## The US opening (done)

No one publishes a US count of cloned VINs. The FBI has said it has no solid
numbers; the "225,000 a year" figure that circulates traces to a 2005
article with no source; "10,460 reports in 2024" is the UK's DVLA.

We decided not to open on that gap. "No one can say how many cloned VINs are
on US roads because registration is split across 50 states" tells the
agencies we are pitching that their system fails. The US opening leads with
the size of what cloning preys on instead:

> **38,500,000** used cars change hands in the US every year.
> Every sale relies on the VIN.
>
> (card) Some of them carry a copied VIN.
> (voice) Some of them carry a copied VIN. Crime rings forge titles to match.

Source on screen: "Cox Automotive, 2026 used-vehicle forecast" (38.5 million
total used-vehicle sales in 2026, updated 2026-09-24; slightly below 2025).
The screen shows the full number and the voice says "38.5 million", so the
two match. The second card says some of those cars carry a copied VIN
(plain wording, 2026-09-29; it was "Not every VIN tells the truth."). It
blames no one. The voice under it keeps the
crime for a law-and-order audience, and "forge titles" sets up catch 3.
The turn beat is 30 frames longer than it was for this line, in both cuts.

Figures considered and set aside:

| Figure | Source | Why not |
| --- | --- | --- |
| Up to 482,000 water-damaged cars on US roads, start of 2025 | CARFAX, 2025-08-06 | Damage, not cloning. Good backup; ties to catch 3. |
| 2.45 million cars with rolled-back odometers | CARFAX, 2025-12-16 | Mileage fraud; FVBL doesn't check mileage. |
| 659,880 vehicles stolen in 2025 | NICB 2025 Vehicle Theft Report | Theft, not identity. The hero avoids theft figures on purpose. |
| 1,000+ cloned cars sold in 20 states | FBI, Operation Dual Identity | Strongest crime story, but 2009. |
| A ring that cloned 250+ cars worth $8M | AAMVA, via PennDOT's NMVTIS fact sheet (April 2025) | Undated case. |

## Politics and framing

The US audience is federal contacts under a Republican administration, sent
through Policaro. What lands: fighting organized crime, border security,
protecting buyers and legitimate commerce, and states keeping control of
their own records. Avoid "federal database", "surveillance", "mandate" and
"climate" (say "hurricanes" if weather comes up). Never frame a DMV as
failing: they are the customer.

### FVBL informs; the clerk decides

Decided 2026-09-29. In the US cut FVBL never gates the title. Issuing or
refusing a title is a state power, and the grounds for it are in state law.
A system that can stop it is exactly the "mandate" reading we avoid, and it
would be stronger than NMVTIS itself: 28 CFR 25.54 requires the check before
titling, but the state decides what to do with the answer. Three more
reasons:

- **Canadian data would veto an American title.** In catch 2 an Ontario
  registration flags an Ohio title. As information from a partner that's a
  good story; as a veto it's a sovereignty problem.
- **False positives land on the honest buyer.** Our own cards say a conflict
  may be an unrecorded re-entry or a title not cancelled at import. A hard
  block turns that into a stalled legitimate sale.
- **Accountability and uptime.** A system that can refuse a title needs an
  appeal process, and an outage would stop titling at every counter.

On screen and in the voice:

- **Green is "Checks clear"**, meaning no conflicts found, never "FVBL
  approved". **Issue title** is the clerk's button, and the voice says the
  clerk issues it.
- **Red is "Hold for review"**, the clerk using authority they already have.
  The main action is **Refer to investigators**. One line says the office
  decides. Never "blocked", "denied" or "FVBL will not allow".
- **The owner's confirmation stays evidence, not a lock.** It's neutral when
  absent and red only on "Not me".
- **Frame FVBL by its reach, not by gaps in Ohio's system.** Don't say "the
  Ohio record alone would have shown this vehicle as clear" (the Canadian
  card's footnote). Say the record is held in another jurisdiction.
- Voice pattern: "The clerk sees what no single state record shows." The
  ledger gives the counter an answer other jurisdictions can trust; the clerk
  does the rest.

This is also the better pitch: a tool that informs the state's own people
is an easy yes, and one that takes a decision away from them is not.

## Which state: Ohio

Recommended, pending checks:

- Ohio's vehicle agency answers to a Republican governor, without the
  pandering read of Texas or Florida. California is out.
- Mainstream Midwest, an auto-manufacturing state, and it faces Ontario
  across Lake Erie, so the cross-border story holds.
- It isn't Pennsylvania, which the Canada cut uses for the US title conflict.

Runner-up: Michigan. The best story (the Detroit–Windsor crossing, the auto
industry), but its registration is run by an elected Secretary of State, as
of mid-2026 a Democrat running for governor in November 2026. A mock of that
office in a pitch during the campaign is avoidable risk.

If Policaro's US contact has a home state, that beats all of this. Keep the
mock generic whatever the state: no seals, no officials' names, watermarked
"Concept mock-up. Not a government page."

The map's US flag starts in Ohio: `OHIO` in `MapPeers.tsx`, and `crossing` in `scripts/map-shapes.mjs`.

## The US flow: title alerts and the owner's confirmation

Decided 2026-09-29, after a red-team pass on the first "verify the seller"
draft. The Ontario flow doesn't translate: the UVIP (Used Vehicle
Information Package) is an Ontario legal requirement with no Ohio
equivalent, and there is no "package" to issue. In Ohio the thing that
makes a car yours is a new title, issued by one of the 88 county Clerk of
Courts title offices; the seller's assignment on the paper title is
notarized. So the US cut gates the title.

### What changed our mind on the first draft

- **In Ohio's prosecuted cases, the ring is the owner of record.** The
  Cuyahoga County ring (2021–23, 39 indicted) re-VINned stolen cars, took
  stolen Georgia and forged South Carolina titles to Ohio title counters,
  got genuine Ohio titles, and only then sold. By the driveway, the ring
  holds a real Ohio title and would approve its own sale. The owner's
  confirmation protects a real owner against a forged assignment in their
  name (title theft). **The ring is caught at the counter**, where
  out-of-state paper becomes an Ohio title: Ohio's own title search "does not
  reveal whether a vehicle was titled in another state previously". That is
  the ledger's job.
- **Ohio already has a public VIN title search** (Ohio BMV, title status
  only, no owner) and a private-party e-transfer (the Ohio Title Portal,
  still needing a notarized paper title). Private "verify my seller"
  services exist (KeySavvy, Cars.com Verified Checkout). The mock adds one
  step to Ohio's existing search; it doesn't invent a new site.
- **The buyer can't see the car's history on a state page.** The same page
  says agencies "are prohibited from sharing the NMVTIS information with the
  Public". The buyer sees Ohio title status and "Owner confirmed", nothing
  more.
- **Don't claim the text collects DPPA consent.** Under the Driver's Privacy
  Protection Act, "express consent" means written consent with a signature
  (18 U.S.C. 2725(5)); a tap may not meet it. A state contacting its own
  registrant is likely covered as a government function (2721(b)(1)), and a
  yes/no match arguably isn't personal information. On screen, say "the
  owner decides". The legal basis is a question for the US contact's counsel.
- **Don't imply the counters or NMVTIS fall short.** Federal rules (28 CFR
  25.54) already require an NMVTIS check before a title is issued, and Ohio's
  title records are already statewide. FVBL sits "alongside the NMVTIS check
  the clerk already runs"; its reach is across state lines and the border,
  not across counties.

### The flow

| Shot | Canada | US |
| --- | --- | --- |
| **0 · Dealer** | Dealer registers a new car, confirms by text | Dealer submits the first-title application from the manufacturer's certificate of origin and confirms by text. The new owner turns on **title alerts** for their phone. The car is on the ledger from day one. |
| **1a · The buyer asks** | Buyer requests a UVIP on ServiceOntario | At the seller's driveway, before paying, the buyer looks up the VIN on a mock of Ohio's title search: "Title active in Ohio". They tap **Ask the owner to confirm**. No owner name or number. |
| **1b · The owner says yes** | Owner opens the MTO text, approves | The owner's phone gets an Ohio title alert: a buyer asked to confirm the sale of their 2023 GLE. They open the link, see the car and the request, and tap **Approve** (or **Not me**). The buyer's page shows "Owner confirmed". |
| **2 · At the counter** | Clerk sees green, **Issue package** | A county title clerk looks up the VIN. Checks clear, including **Owner confirmed the sale** (with its ledger certificate), the NMVTIS check, and **No active title in another state or Canada**. The clerk presses **Issue title**: it's their decision, FVBL informs it. On a catch the card reads **Hold for review** and the clerk refers it. |

**Keep the phone flow** (link, request screen, Approve/Deny) rather than a
reply-YES text: it shows the confirmation far better on screen. It is the
scam-text pattern Ohio BMV warned about in June 2025 (it never texts asking
for personal information), so the mock earns trust in other ways:

- **Opt-in.** The owner signs up when the title is issued (flow 0), like the
  opt-in Property Fraud Alert texts Ohio county recorders already run.
- **It asks for nothing.** No login, no ID, no payment: the owner only
  approves or declines.
- **It names what the owner signed up for**: "Ohio title alert", the car,
  the last four of the VIN.
- **The sender is the state**, not FVBL. Which state body sends it is open:
  titles are the county clerks', alerts might be the BMV's.

**A missing confirmation is neutral.** At the counter "Owner confirmed" is a
green check when present and absent otherwise; only "Not me" turns it red.
Anything stricter reads as a mandate and slows legitimate sales.

**"Not me"** is a 3–4 s phone insert, not a fourth catch: the owner taps it,
the buyer's page turns red. Pitch it as protection against title theft, not
as the anti-ring mechanism.

**What the ledger does**, and where to show the certificate:

1. The owner's confirmation is tamper-evident: a clerk in any county or state
   can rely on it. Certificate on the "Owner confirmed" check, not on the
   text.
2. Records other jurisdictions can trust: another state's title, an Ontario
   registration, a CBP export record, seen at an Ohio counter.

States write their own records; the ledger proves what happened and when.
A plain state system could send the text; the ledger is what lets another
jurisdiction trust the answer.

## The catches, flipped

| Catch | Canada cut | US cut |
| --- | --- | --- |
| 1 · Exported, no re-entry | CBSA export record, no re-entry to Canada | CBP export record, no re-entry to the US. A border-security story. |
| 2 · One VIN, two countries | Active Pennsylvania title in NMVTIS | Ohio's real pattern: an out-of-state title presented at an Ohio counter, for a VIN the ledger shows active on an Ontario registration. Canada is the partner that catches it. |
| 3 · Written off, second plate | Insurer write-off, VIN on a second Ontario plate | A salvage title re-titled clean in a second state, caught alongside the NMVTIS check, not in place of it. |

Keep the conditional wording for every federal, third-party and
cross-border source ("with access to", "with the right agreements").

## To verify before building

- Current officeholders in Ohio. Our knowledge ends mid-2026 and November
  2026 is an election; the BMV registrar is appointed, so the risk is small.
- Whether Ohio holds owners' mobile numbers (BMV has email for renewal
  notices; nothing found on verified mobiles). The opt-in in flow 0 assumes
  it doesn't.
- Who would send the title alert: the BMV or the county clerks.
- The legal basis for the owner's confirmation under DPPA. Ask the US
  contact.
- The NMVTIS pronunciation US agencies use ("N-M-V-T-I-S" or "nim-VEE-tis").
- What an Ohio title clerk can legally do today with a title they suspect is
  fraudulent (hold it, refer it) and who they refer it to. Until confirmed,
  the mock says "state investigators" and names no unit.

## To build

App (`src/`), planned in
`docs/superpowers/plans/2026-09-29-us-version.md`:

- Flow 0: first title from the certificate of origin; the title-alert opt-in.
- A mock of Ohio's title search with **Ask the owner to confirm**, in place
  of the ServiceOntario UVIP page. The host page is a generic state site
  (in the spirit of America.gov: display serif, navy, pill search; no
  agency's look, no seal, no "official website" banner); Ohio is in the
  content only. The ask is an FVBL embed
  under the state's result, in FVBL's own style with "Powered by FVBL": the
  pitch is one module a state drops in, not a site rebuild (2026-09-30).
- The owner's title alert and request screen (the phone flow, new wording),
  with Approve and **Not me**; the buyer's "Owner confirmed" and red states.
- Ohio demo vehicles: plates and VINs for the happy path and each catch.
- Clerk portal: county title office; **Issue title** for "Issue package",
  always the clerk's action (see "FVBL informs; the clerk decides"); the
  "Owner confirmed the sale" and "No active title in another state or
  Canada" checks; **Hold for review** and referral to state investigators.
- The three flipped catches above.

Video (`video/`):

- Record the US footage into `public/clips/us/`, same file names.
- Rewrite US lines 05–35 in `lines.ts` for that footage. Keep the marks
  where possible; one line per on-screen action; no AI tells (see the
  memory notes on voiceover).
- A US shot list in `docs/screenplay.md`; the US lines in `docs/voiceover.md`.
- US takes in `public/audio/vo/us/`, same voice and settings as Canada;
  mix to `public/audio/soundtrack-us.wav`; `pnpm render:us`.

## Sources

- Cox Automotive Q3 2026 forecast update (2026-09-24):
  https://www.coxautoinc.com/press-releases/q3-september-2026-cox-automotive-new-vehicle-sales-forecast-press-release/
- Cox Automotive 2025 used-vehicle forecast, via NIADA (superseded):
  https://niada.com/dashboard/used-vehicle-sales-surpassing-2025-forecast/
- CARFAX, flood-damaged vehicles (2025-08-06):
  https://www.prnewswire.com/news-releases/carfax-up-to-45-000-vehicles-flood-damaged-in-mid-year-storms-302523277.html
- CARFAX, odometer rollbacks (2025-12-16):
  https://www.theautochannel.com/news/2025/12/16/1613541-carfax-odometer-rollbacks-see-dramatic-jump-14-to-2-45.html
- NICB, 2025 vehicle thefts:
  https://www.nicb.org/news/news-releases/us-vehicle-thefts-experience-historic-decline
- FBI, Operation Dual Identity (2009):
  https://archives.fbi.gov/archives/tampa/press-releases/2009/ta032509.htm
- PennDOT NMVTIS fact sheet, source AAMVA (April 2025):
  https://www.pa.gov/content/dam/copapwp-pagov/en/penndot/documents/public/dvspubsforms/bmv/bmv-fact-sheets/fs-nmvtis.pdf
- Cuyahoga County Prosecutor, 39 indicted for title fraud (2023):
  https://www.ccprosecutor.us/39-indicted-title-fraud-selling-stolen-cars/
- Hamilton County title-fraud ring (2019), via The Drive:
  https://www.thedrive.com/news/27856/ohio-prosecutors-charge-17-people-in-elaborate-car-theft-scheme-involving-falsified-titles
- Ohio BMV title search:
  https://bmvonline.dps.ohio.gov/bmvonline/titles/titlesearch
- Ohio Title Portal (private-party e-transfer), Butler County Clerk:
  https://clerkofcourts.bcohio.gov/title_division/ohio_transactions.php
- Ohio BMV text-scam warning (June 2025):
  https://ohio.gov/wps/portal/gov/site/home/news-and-events/all-news/bmv-text-message-scam-june25
- Franklin County Recorder, Property Fraud Alert:
  https://recorder.franklincountyohio.gov/Services/Property-Alert
- KeySavvy, Verify my seller: https://www.keysavvy.com/verify-my-seller
- Cars.com Verified Checkout: https://www.cars.com/sell/verified-checkout/
- DPPA, 18 U.S.C. 2721 and 2725:
  https://www.law.cornell.edu/uscode/text/18/2721 ·
  https://www.law.cornell.edu/uscode/text/18/2725
- NMVTIS check before titling, 28 CFR 25.54:
  https://www.law.cornell.edu/cfr/text/28/25.54
- NICB, VIN clones and multistate theft rings:
  https://www.nicb.org/news/blog/nicb-news-vin-clones-car-crashes-and-multistate-theft-rings
