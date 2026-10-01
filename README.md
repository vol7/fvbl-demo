# FVBL demo prototype

Clickable prototype of FVBL: a dealer's first registration of a new vehicle, a
ServiceOntario pre-approval flow, the clerk portal, and the phone that confirms
both. Built for a screen-recorded demo video
and for a live walkthrough. It plays two countries: Canada (Ontario) and the US
(Ohio), one app under a region prefix (see [Regions](#regions)). No backend, no persistence beyond the browser,
invented data. Specs and plans live in `docs/superpowers/`.

## Run

    pnpm install
    pnpm dev           # http://localhost:5173

## Recording

Open **http://localhost:5173/** and pick a country. That opens its hub,
**`/ca`** or **`/us`** (not part of the product; `/demo` redirects to `/ca`). The
hub opens each surface in its own window and shows the live session:

| Surface | Canada | US | Record at |
| --- | --- | --- | --- |
| Dealer portal | `/ca/dealer` (sign-in → `/ca/dealer/register`) | `/us/dealer` | 1440×900 |
| Public page | `/serviceontario` → `/ca/uvip` | `/us/ohio` (Ohio title search) | 1440×900 |
| Clerk portal | `/ca/portal` (sign-in → `/ca/portal/home`) | `/us/portal` | 1440×900 |
| Border officer (CBSA) | `/ca/border` (sign-in → `/ca/border/exports`) | none | 1440×900 |
| Phone (owner or dealership) | `/ca/phone` (thread) → `/ca/phone/confirm` | `/us/phone` | 390×844 |

All windows of one country share one session. `localStorage` is the single source of truth,
keyed by VIN, and windows only ping each other to re-read it, so browsing never
changes state and several vehicles can hold state at once. The phone follows the
most recent request, and becomes the dealership's phone when that request is a
dealer's first registration. Use the hub's **Reset session** between takes, or **Force
state** to jump straight to one beat. Illegal transitions are logged to the
console in dev as `[fvbl] ignored …`.

## Regions

Every surface lives under `/ca/...` or `/us/...`. The first segment picks a
region pack in `src/regions/<ca|us>/`: vehicles, people, office, record checks,
stories, policy and every string that differs. Shared components read it with
`useRegion()`; `lib` functions take it as their first argument. A guard test
fails if Canadian wording (MTO, Ontario, licence, colour…) leaks into shared
code.

- **Legacy routes redirect to `/ca`.** `/portal`, `/dealer`, `/phone` and `/uvip`
  go to the same path under `/ca`, query string kept, so older links and the
  saved ServiceOntario page keep working.
- **Each region has its own session**, `fvbl-demo:session:v2:ca` and
  `…:us`, with its own sync channel. Resetting a US take never touches a
  Canadian setup. A session saved before regions moves to Canada once.
- **The rules differ.** In Canada the package needs the owner's authorization.
  In the US the owner's confirmation is evidence, not a gate: the clerk can
  issue a title without one, and only "Not me" or a failed check holds it for
  review. FVBL informs; the clerk decides (`docs/us-version.md`).

The shot list is `docs/screenplay.md`. Title cards and the final cut are a
Remotion project in `video/` (see `video/README.md`): drop CleanShot exports
into `video/public/clips/` and render.

## ServiceOntario page

`public/serviceontario/` is a browser save of https://www.ontario.ca/page/serviceontario
(Sept 9, 2026) with all scripts removed, the theme's fonts and images mirrored
under `theme/`, and two additions: a "Get a Used Vehicle Information Package
(UVIP)" card leading Popular services, and a matching link in the Vehicles
column. Both point at `/uvip`. A small Vite middleware serves it at
`/serviceontario/` instead of the React app. The UVIP form pages reuse the
theme's fonts and colours so the hand-off feels continuous.

## Demo VINs

| Scenario | VIN | What happens |
| --- | --- | --- |
| 1 · Clean vehicle | `4JGFB8KBXPA812634` | All checks pass. Request owner authorization; approve or deny from the phone. |
| 2 · Cloned VIN | `5TDEBRCH9SS041927` | Write-off, duplicate identity and collision fail. Request disabled; refer for investigation. |
| 3 · Buyer pre-request | `4JGFB8KBXPA812634` | On ServiceOntario choose "Buying a vehicle", send the request; owner taps the SMS link and approves; clerk lookup shows the authorization on file. The owner can also pre-approve directly ("Selling my vehicle"). |
| 4 · Exported vehicle | `SALWR2SEXNA209311` | Clean MTO record, but CBSA logged a vehicle carrying this VIN leaving in March 2025 with no re-entry. The identity is in conflict: either the car at the counter is a clone, or the exported one was. One high-risk check fails and holds the package for review. ServiceOntario refuses the pre-approval. |
| 5 · US title conflict | `JTJTABGX9R4027418` | Clean Ontario record and border history (imported new from Japan), but NMVTIS, the US federal title database, shows the same VIN with an active Pennsylvania title. One high-risk check fails. One federal query covers every state. |
| 7 · Export · owner didn't authorize | `1C6SRFHT4RN318405` | 2024 RAM 1500 Limited, plate `CPWT 318`, sold on a deposit and shipped under the seller's name. On the hub, **Declare the RAM 1500 for export**: it joins the CBSA officer's list, awaiting its owner, and the owner gets an MTO text with the loading cut-off as the deadline. The permit is genuine and it isn't reported stolen; the owner taps **No, I didn't** (and gets a reference for police) and the officer's card turns red: **Doesn't clear**, with the container to open. **Yes, I authorized it** clears it. Once the owner has answered, the clerk's record shows it on the history. The list already holds two cars with bad permits: another car's permit (an Acura MDX) and a number on no Ontario registration (a RAV4). |
| 6 · New vehicle · dealer first registration | `4JGFF5KE3SB412009` | The birth of the VIN. In the dealer portal the VIN decodes but has no registration on file; tick the NVIS check mark, submit to the ministry; the dealership's phone gets the text and confirms. The clerk portal's Unregistered VIN card resolves live into a record with two history rows, the first captioned "Ledger opened". |

The five registered VINs are the first rows under "Recent lookups" so you can
click instead of typing; the new one joins them once the dealer's submission is
confirmed. The video covers scenario 3 and scenario 2, and in the Canada cut
the result of scenario 7 as a fourth catch; the others are there for the live
walkthrough.

### US demo VINs

| Scenario | VIN | What happens |
| --- | --- | --- |
| 1 · Owner confirms the sale | `4JGFB8KB4PA305518` | 2023 Mercedes-AMG GLE 53, Ohio plate `JKR 4821`. On the Ohio title search the buyer sees "Title active in Ohio" and taps **Ask the owner to confirm**; the owner's title alert opens the confirm page; **Approve**. At the county title office the checks clear, including **Owner confirmed the sale** with its certificate, and the clerk issues the title. |
| 2 · "Not me" | `4JGFB8KB4PA305518` | Same request, but the owner taps **Not me**. The buyer's page turns red; the clerk sees **Hold for review**. Protection against title theft. |
| 3 · Exported, no re-entry | `1GNSKRKD3RR173602` | 2024 Chevrolet Tahoe. CBP recorded an export through Laredo with no re-entry. The border check fails; the clerk refers it to state investigators. |
| 4 · One VIN, two countries | `2HKRS6H89NH408215` | 2022 Honda CR-V built in Ontario. A Georgia title is presented in Ohio for a VIN the ledger shows on an active Ontario registration. |
| 5 · Salvage re-titled clean | `1FTFW1E89MFA52937` | 2021 Ford F-150. Branded salvage in Kentucky, then titled clean in Indiana. The NMVTIS check and the title brand history both fail. |
| 6 · New vehicle · dealer first title | `4JGFB5KB9TA051846` | 2026 Mercedes-Benz GLE 450. The dealer submits the first title from the manufacturer's certificate of origin, with the first owner's title alerts on; the dealership's phone confirms; the clerk's Unregistered VIN card resolves live. |

Every red card ends "Your office decides whether to issue." A missing
confirmation is neutral; it never holds a title.

## The vehicle page

A VIN with no registration on file (scenario 5 before the dealer submits) gets an
**Unregistered VIN** card instead: it decodes, nothing is checked, and a pending
dealer submission is mentioned. The card resolves into the full page the moment
the dealership confirms.

The page sits in an inset frame: the sidebar is on the canvas (office, VIN
search with ⌘K, navigation) and the page is the
one raised surface. The clerk lands on the vehicle's identity (plate, title,
colour and body, VIN), then the **decision card**, then tabs, with a details
rail on the right.

The decision card answers "can this package be issued?" in one place: a status
label ("Checks clear", "Awaiting owner", "Authorized to issue", "Package issued",
"Hold, do not issue", "Referred, do not issue", "Owner denied", "Request
expired"), a headline, one or two sentences, a reference when there is one, and
the one action the clerk takes next (request, issue, refer). The verdict is
there as soon as the page opens; there is no simulated loading. The strip under it names what the platform checked: record checks, owner
authorization (with its certificate once approved), and the last recorded event
on the vehicle's own history. The first and last cells open their tab.

When a check fails, the card tells the worst flag's story (`src/lib/story.ts`),
names the agencies that reported it and the other flags after it. Identity
conflicts (an export with no re-entry, an active US title, a duplicate
registration) name the conflict, not a verdict on the person at the counter:
either vehicle may be the clone, or a record may be incomplete (an unrecorded
re-entry, a US title not cancelled at import). For the export and the US title,
the card adds that the Ontario record alone would have shown the vehicle as
clear. A red card is a hold for review, not a verdict. **Refer for
investigation** sends the file to MTO Investigations, lists what went with it,
says who they notify after review (the OPP and CBSA for federal conflicts, the
OPP otherwise), and tells the clerk not to share the reason with the customer.

Tabs (the tab is in the URL as `?tab=history` or `?tab=ownership`); panels slide
toward their place in the tab order:

- **Record checks** (default). The nine sources as answered pills, then nine
  checks in three groups: "High risk" in reds, "Low risk" in ambers, then
  "Passed". Each row reads check, result in bold ("No export reported"), the
  evidence under it, and its agencies on the right. Two checks are
  federal: "Import and export record" (Transport Canada RIV and CBSA) and "VIN
  decode match" (NHTSA vPIC against the MTO record). "US title record" asks
  NMVTIS once for every state.
- **Vehicle history.** A lifecycle strip first (`src/lib/lifecycle.ts`): built,
  border crossings, registration, renewals folded together, transfers, and the
  records that flag the vehicle (write-off, a second plate, a US title). An open
  export ends on a dashed "No re-entry" stop. Under it, every event newest
  first, grouped by year, milestones in an icon tile, renewals and readings
  lighter, ending on "Built in …" from the VIN decode, which carries no
  certificate.
- **Ownership.** The same chronology told per owner (`src/lib/owners.ts`), newest
  first: period, how the vehicle was acquired, office, odometer at the start, and
  what happened on that owner's watch. Only the current owner can be revealed;
  previous owners are never shown.

The rail holds the record's details (owner name and phone behind a show/hide
bar, "FVBL logs each reveal against your badge"), the ledger line, and the
activity feed.

Every history event and every live authorization event carries a **Blockchain
certified** mark. Clicking it opens the certificate: event, source, when it was
recorded, the short certificate with a copy button, and "Matches the record".
Certificates are derived from the data on every render, so all windows agree; the
digest in `src/lib/ledger.ts` is a deterministic stand-in, not a real hash.

## What each surface does

Canada's surfaces below; the US ones follow the same shape (see [US demo VINs](#us-demo-vins) and `docs/us-version.md`).

- **Dealer portal** (`/ca/dealer` → `/ca/dealer/register`). FVBL's dealer side, a
  sibling of the clerk portal: decode a VIN, confirm the New Vehicle Information
  Statement with one check mark, review, **Submit to ministry**. The page then
  witnesses the session: awaiting confirmation, then *Registration recorded* with
  an `FVBL-R-…` reference and a certificate for the ledger's first entry. It
  shares the clerk portal's inset frame and status cards; the client is sending
  reference for the real dealer portal, and that reskin lands in
  `src/components/dealer/DealerShell.tsx`.
- **ServiceOntario** (`/serviceontario/` → `/ca/uvip`). The owner verifies with a
  licence number and a photo and puts a 30-day authorization on file, or a buyer
  enters their name, licence and mobile and the owner is texted. The public side
  never shows the plate; the VIN is the identifier and the registered owner is
  masked.
- **Phone** (`/ca/phone`). The owner's SMS carries the vehicle, the plate (safe on
  the owner's side), the requester's name and a 16-character link. The link opens
  a one-page approve/decline; the browser back chevron is the only way back.
  During a first registration the same surface is the dealership's phone: the
  text reads the submission back and the link opens **Confirm a first
  registration?** with the NVIS and first owner.
- **Border officer** (`/ca/border` → `/ca/border/exports`). Canada only, from
  the 2026-09-30 call with Policaro. CBSA can't open every container, so the
  officer lands on the vehicles declared for export, the ones that don't clear
  first, and opens one card per car: the clerk's decision card and strip, with
  only what the decision needs. That's whether the declared permit matches the
  one on file for the VIN, a stolen report (CPIC), the registered owner against
  the exporter, the owner's answer, and the container with where it sits in the
  terminal. None of the clerk's record: no insurer, odometer or history data, no
  previous owners. A car doesn't clear on a permit on no Ontario registration, a
  permit on file for another vehicle, a stolen report, or a registered owner who
  said no (or didn't answer by the loading cut-off). Every declared vehicle's
  owner is texted by MTO at the mobile on the registration, never one from the
  declaration; a car shipped on a bill of sale alone is still matched to its
  owner by the VIN. **Hold for examination** holds the container with an
  `EX-…` reference. FVBL informs; the officer decides. The clerk never sees the
  container or the examination: once the owner has answered, the vehicle's
  history gains one event ("Export not authorized", with the port). The vessel,
  exporters, owners, container and permit numbers are invented; the permit
  number format and the loading cut-off (two days after the declaration) are
  stand-ins until the client confirms them. Fawaz described the process as
  police-internal, under NDA.
- **Clerk portal** (`/ca/portal`). Summary header, tabs, then the package panel: applicant
  name, licence and mobile, request owner authorization, and once authorized,
  issue the package. Failed checks hold it and refer it for investigation.

## Demo people

| Role | Name | Licence | Mobile |
| --- | --- | --- | --- |
| Registered owner (GLE) | Daniel Okafor | `D6101-40706-60905`, matches the specimen card shown in the photo step | ending 0917 |
| Buyer / applicant | Marcus Beaulieu | `B2947-51083-64712` | ending 4410 |
| Registered owner (Highlander) | Priya Raghunathan | — | ending 5528 |
| Registered owner (Range Rover) | Amara Chen | — | ending 2286 |
| Dealer (new GLE 450) | Mercedes-Benz Downtown · Sofia Marchetti, dealer principal · No. 47-1182 · NVIS 2026-MB-0187342 | — | ending 2204 |
| First registered owner (new GLE 450) | Léa Tremblay | `T4418-22067-90315` | ending 7731 |
| Registered owner (RAM 1500, the export) | Hannah Kowalski, also the exporter on the declaration | — | ending 3162 |
| Border services officer | Karine Ouellet, CBSA · Port of Montréal, badge 18842 | — | — |

### US demo people

| Role | Name | License | Mobile |
| --- | --- | --- | --- |
| Registered owner (GLE 53) | Rachel Novak | `RN482917` | ending 0138 |
| Buyer | Tyler Brooks (the owner sees "Tyler B.") | `TB730164` | ending 0172 |
| Registered owner (Tahoe) | Marcus Hale | — | ending 0147 |
| Registered owner (CR-V) | Devon Price | — | ending 0116 |
| Registered owner (F-150) | Kyle Brennan | — | ending 0164 |
| Dealer (new GLE 450) | Scioto Ridge Motorcars · Maria Delgado, dealer principal · No. OH-D 20417 · MCO 2026-0418826 | — | ending 0155 |
| First owner (new GLE 450) | Jordan Whitfield, title alerts on | `JW551208` | ending 0193 |
| Title clerk | Denise Harmon, Franklin County Title Office · Columbus, Counter 3 | — | — |

All invented. Never use a real client or contact name here. The dealership's
name was checked against Ohio dealers so it matches none of them.

## Demo controls

Press `Shift+D` on a vehicle page to open the hidden panel: owner approves,
owner denies, simulate 24h timeout, reset session. Approve and deny act on
whatever the phone is showing, so they confirm or decline a dealer submission
too, and the owner's answer about an export. Each hub (`/ca`, `/us`) always shows
the same buttons plus **Force state** for its own session. Canada's includes
**Dealer submitted** and **Vehicle registered** for the day-one beat, and for
the border **Export declared**, **Export confirmed**, **Export: owner said no**
(catch 3d's setup) and **Containers held**. Canada's hub also has **Declare the
RAM 1500 for export**, and so do the border pages' `Shift+D` panel. The US list follows the cut:
**Dealer submitted**, **Title recorded**, **Buyer asked**, **Owner confirmed**,
**Owner said "Not me"**, **No reply**, **Title issued**, **Held for review**,
**Referred**.

## Hosting

`vercel.json` and `public/_redirects` route `/serviceontario` to the static page
and everything else to the app, so a one-shot deploy on Vercel or Netlify
behaves like `pnpm dev`. Session sync is per browser profile, so open every
surface from the same browser and not from an incognito window.

**`DEPLOY.md` is the runbook** — build, the two routing rules, a post-deploy
checklist, and why the saved ServiceOntario page uses absolute asset paths.
Read it before the first public deploy: the saved copy of ontario.ca needs
password protection on the host, which is the one step neither config file can
do for you.

## Scripts

    pnpm test          # vitest
    pnpm build         # tsc + vite build
    pnpm lint
    pnpm typecheck
