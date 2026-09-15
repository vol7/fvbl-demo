# FVBL demo prototype

Clickable prototype of FVBL: a dealer's first registration of a new vehicle, a
ServiceOntario pre-approval flow, the clerk portal, and the phone that confirms
both. Built for a screen-recorded demo video
and for a live walkthrough. No backend, no persistence beyond the browser,
invented data. Specs and plans live in `docs/superpowers/`.

## Run

    pnpm install
    pnpm dev           # http://localhost:5173

## Recording

Open **http://localhost:5173/** (the hub, not part of the product; `/demo`
redirects here). It opens each surface in its own window and shows the live
session:

| Surface | Route | Record at |
| --- | --- | --- |
| Dealer portal | `/dealer` (sign-in → `/dealer/register`) | 1440×900 |
| ServiceOntario (public) | `/serviceontario` → `/uvip` | 1440×900 |
| Clerk portal | `/portal` (sign-in → `/portal/home`) | 1440×900 |
| Phone (owner or dealership) | `/phone` (thread) → `/phone/confirm` | 390×844 |

All windows share one session. `localStorage` is the single source of truth,
keyed by VIN, and windows only ping each other to re-read it, so browsing never
changes state and several vehicles can hold state at once. The phone follows the
most recent request, and becomes the dealership's phone when that request is a
dealer's first registration. Use the hub's **Reset session** between takes, or **Force
state** to jump straight to one beat. Illegal transitions are logged to the
console in dev as `[fvbl] ignored …`.

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
| 1 · Clean vehicle | `4JGFB8KB5PA812634` | All checks pass. Request owner authorization; approve or deny from the phone. |
| 2 · Cloned VIN | `5TDEBRCH7SS041927` | Write-off, duplicate identity and collision fail. Request disabled; escalate. |
| 3 · Buyer pre-request | `4JGFB8KB5PA812634` | On ServiceOntario choose "Buying a vehicle", send the request; owner taps the SMS link and approves; clerk lookup shows the authorization on file. The owner can also pre-approve directly ("Selling my vehicle"). |
| 4 · Exported vehicle | `SALWR2SE4NA209311` | Clean MTO record, but CBSA logged a vehicle carrying this VIN leaving in March 2025 with no re-entry. The identity is in conflict: either the car at the counter is a clone, or the exported one was. One high-risk check fails and holds the package for investigation. ServiceOntario refuses the pre-approval. |
| 5 · New vehicle · dealer first registration | `4JGFF5KE9SB412009` | The birth of the VIN. In the dealer portal the VIN decodes but has no registration on file; tick the NVIS check mark, submit to the ministry; the dealership's phone gets the text and confirms. The clerk portal's Unregistered VIN card resolves live into a record with two history rows, the first captioned "Ledger opened". |

The three registered VINs are the first rows under "Recent lookups" so you can
click instead of typing; the new one joins them once the dealer's submission is
confirmed. The video covers scenario 3 and scenario 2; the others are
there for the live walkthrough.

## The vehicle page

A VIN with no registration on file (scenario 5 before the dealer submits) gets an
**Unregistered VIN** card instead: it decodes, nothing is checked, and a pending
dealer submission is mentioned. The card resolves into the full page the moment
the dealership confirms.

The clerk lands on a summary header, then tabs. The header carries the vehicle
identity, one verdict pill for the whole record ("Checks clear", "Cannot be
issued", "Awaiting owner", "Authorized to issue", "Package issued"), and three
tiles that each summarise one concern and open its tab: record checks, owner
authorization, ledger. A "Sources consulted" strip lists every agency the portal
queries: Transport Canada, CBSA, MTO, CPIC, IBC, NHTSA, PPSR.

When CBSA's last border event is an export with no re-entry, a border alert
sits under the header and tells that story in one sentence. It names an
identity conflict, not a verdict on the person at the counter: the exported
vehicle may have been the clone. No destination is shown; the port of exit and
the missing re-entry are the whole signal. This is the demo's clearest
federal-integration moment: the MTO record alone would show the vehicle as
clear.

Tabs (the tab is in the URL as `?tab=history` or `?tab=ownership`):

- **Record checks** (default). Eight checks, failures first, high before low.
  Two are federal: "Import and export record" (Transport Canada RIV and CBSA)
  and "VIN decode match" (NHTSA vPIC against the MTO record). Each row shows
  its agencies as chips. High-risk failures say "Cannot be overridden"; any
  failure still blocks the package.
- **Vehicle history.** The chronology across Transport Canada, CBSA and the
  MTO: import, customs, first registration, transfers (office number only,
  never a name), renewals and odometer readings. Every event is listed, newest
  first; milestones are set heavier so the record still scans.
- **Ownership and registration.** The MTO record, owner masked.

The right rail is the package panel and the activity feed, sticky, unchanged.

Every history event and every live authorization event carries a
**Blockchain certified** mark with a short certificate. The header tile reads
"no tampering detected · verified 3 minutes ago". There is no ledger page on
purpose: the client asked for the blockchain to stay quiet. Certificates are
derived from the data on every render, so all windows agree; the digest in
`src/lib/ledger.ts` is a deterministic stand-in, not a real hash.

## What each surface does

- **Dealer portal** (`/dealer` → `/dealer/register`). FVBL's dealer side, a
  sibling of the clerk portal: decode a VIN, confirm the New Vehicle Information
  Statement with one check mark, review, **Submit to ministry**. The page then
  witnesses the session: awaiting confirmation, then *Registration recorded* with
  an `FVBL-R-…` reference. Generic look for now; the client is sending reference
  for the real dealer portal, and the reskin lands in
  `src/components/dealer/DealerShell.tsx`.
- **ServiceOntario** (`/serviceontario/` → `/uvip`). The owner verifies with a
  licence number and a photo and puts a 30-day authorization on file, or a buyer
  enters their name, licence and mobile and the owner is texted. The public side
  never shows the plate; the VIN is the identifier and the registered owner is
  masked.
- **Phone** (`/phone`). The owner's SMS carries the vehicle, the plate (safe on
  the owner's side), the requester's name and a 16-character link. The link opens
  a one-page approve/decline; the browser back chevron is the only way back.
  During a first registration the same surface is the dealership's phone: the
  text reads the submission back and the link opens **Confirm a first
  registration?** with the NVIS and first owner.
- **Clerk portal** (`/portal`). Summary header, tabs, then the package panel: applicant
  name, licence and mobile, request owner authorization, and once authorized,
  issue the package. Failed checks block it and escalate to law enforcement.

## Demo people

| Role | Name | Licence | Mobile |
| --- | --- | --- | --- |
| Registered owner (GLE) | Daniel Okafor | `D6101-40706-60905`, matches the specimen card shown in the photo step | ending 0917 |
| Buyer / applicant | Marcus Beaulieu | `B2947-51083-64712` | ending 4410 |
| Registered owner (Highlander) | Priya Raghunathan | — | ending 5528 |
| Registered owner (Range Rover) | Amara Chen | — | ending 2286 |
| Dealer (new GLE 450) | Mercedes-Benz Downtown · Sofia Marchetti, dealer principal · No. 47-1182 · NVIS 2026-MB-0187342 | — | ending 2204 |
| First registered owner (new GLE 450) | Léa Tremblay | `T4418-22067-90315` | ending 7731 |

All invented. Never use a real client or contact name here.

## Demo controls

Press `Shift+D` on a vehicle page to open the hidden panel: owner approves,
owner denies, simulate 24h timeout, reset session. Approve and deny act on
whatever the phone is showing, so they confirm or decline a dealer submission
too. The hub at `/` always shows the same buttons plus **Force state**, which
includes **Dealer submitted** and **Vehicle registered** for the day-one beat.

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
