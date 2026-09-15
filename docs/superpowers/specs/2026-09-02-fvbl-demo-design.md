# FVBL demo prototype — design

Date: 2026-09-02
Status: approved (François Deguire)

## Purpose

A clickable web prototype of the FVBL "VIN hub" clerk portal, built so it can be
screen-recorded into two demo videos. The videos are a proof of concept to help
Fawaz (police contact) and Francesco sell the idea to Ontario stakeholders.
It is not a real product: no backend, no auth, invented data.

Source material: Granola call of 2026-09-02 ("Plateforme de traçabilité
automobile Canada") and the FVBL deck (`FVBL.pptx`).

## Two scenarios, one UI

Both scenarios share the same screens. The VIN entered decides which one plays.

**Scenario 1 — Used vehicle package, clean vehicle.**
Clerk at an MTO office looks up a VIN. All record checks pass. Clerk requests
owner authorization. The registered owner (RGO) receives a text with a one-time
code and approves. Portal shows the transaction as authorized and clear to
proceed. If the owner denies or does not respond within 24h, the transaction is
frozen and flagged for security review.

**Scenario 2 — Cloned VIN, blocked.**
Same lookup. Record checks surface red indicators (insurer write-off, collision
record, duplicate identity). The authorization button is disabled with an inline
reason. Panel shows "Transaction blocked" with an escalate action that produces
a case reference.

Framing from the call: this is "a lookup followed by 2FA for vehicles". Only
high-risk vehicles (top stolen models, high value) would trigger the
authorization step in the real product; the demo does not model that filter.

## Decisions taken during brainstorming

| Question | Decision |
| --- | --- |
| Deliverable form | Clickable HTML prototype, recorded to video |
| Flow assumption | Clerk-initiated at the MTO desk, as in the deck. Owner pre-authorization variant deferred until Francesco answers |
| Owner side | Phone mock rendered in the same page beside the portal |
| Visual direction | Neutral government-tool look, shadcn preset `bIpUBt2` |
| Stack | Vite + React + TypeScript + Tailwind + shadcn, new repo `~/Documents/GitHub/fvbl-demo` |
| Blockchain | Not shown anywhere |
| Branding | "FVBL" as plain text in the header, no logo |

## Screens

### 1. Sign in (`/`)
Username, password, "Sign in" button. Accepts any input. Lands on lookup.
Exists so the video can open on a credible first frame.

### 2. VIN lookup (`/lookup`)
- Single VIN input with a "Look up" button. Basic 17-character validation.
- "Recent lookups" list containing the demo VINs so the presenter can click
  instead of typing on camera.
- Header: "FVBL · Authorized User Portal", clerk name, office name, sign out.

### 3. Vehicle profile (`/vehicle/:vin`)
Header block:
- Year, make, model, trim, colour, body style.
- Ontario plate, registration date, odometer at last registration.
- Registered owner shown masked (e.g. `D***** O*****`), phone ending in 4 digits.

**Record checks** (list, resolves with a short stagger on load):
- Stolen vehicle report
- Insurer write-off / total loss
- Collision record
- Odometer consistency
- Duplicate identity / VIN mismatch
- Active lien

Each check is `pass` or `fail` with a one-line detail on fail.

**Used vehicle package** panel:
- Applicant name field (prefilled "Marcus B." in demo data).
- Primary button: "Request owner authorization".
  - Enabled when all checks pass.
  - Disabled with inline reason when any check fails.
- Status area, driven by the authorization state machine below.
- Scenario 2 shows a "Transaction blocked" state instead, with an
  "Escalate to Insurance Hub / Law Enforcement" button that yields a case
  reference like `FVBL-2026-09-02-0417`.

### Phone mock
When a request is sent, a phone frame animates in beside the portal showing an
SMS thread:

> FVBL: A used vehicle package was requested for your 2023 Mercedes-AMG GLE 63 S
> (plate CKXR 214) at MTO Toronto Downtown. Approve with code 482 193 or deny.
> Expires in 24 hours.

Below the message: "Approve" and "Deny" buttons the presenter can tap. The
same actions are available from the demo controls.

## Authorization state machine

```
idle
  └─ request ──────────▶ pending (24h countdown shown, phone appears)
                           ├─ approve ──▶ authorized (code + timestamp, "Clear to proceed")
                           ├─ deny ─────▶ frozen ("Frozen — flagged for security review")
                           └─ timeout ──▶ frozen (same, reason "No response within 24h")
blocked  (entered directly when any record check fails; request is not available)
  └─ escalate ─────────▶ escalated (case reference shown)
```

The countdown is a display element only. "Timeout" is triggered from demo
controls, never by the real clock.

## Demo data

Two vehicles, keyed by VIN. Invented values.

**Clean (scenario 1)**
- 2023 Mercedes-AMG GLE 63 S 4MATIC+, Obsidian Black, SUV
- Plate CKXR 214, registered 2023-04-18, odometer 31 240 km
- Owner Daniel Okafor (shown masked), phone ending 0917
- All checks pass

**Cloned (scenario 2)**
- 2025 Toyota Highlander Platinum, Wind Chill Pearl, SUV
- Plate BWTP 903, registered 2025-02-03, odometer 8 410 km
- Owner (shown masked), phone ending 5528
- Fails: insurer write-off (total loss 2025-06-14), collision record
  (2025-06-12, Hwy 401), duplicate identity (same VIN active on a second
  Ontario plate). Others pass.

A third clean vehicle may be added for variety in live demos; not required.

## Demo controls

Hidden panel toggled with a keyboard shortcut (`Shift+D`). Buttons:
- Owner approves
- Owner denies
- Simulate 24h timeout
- Reset scenario

Not visible unless opened, so it stays out of recordings.

## Motion

Motion library for: record-check stagger, phone frame slide-in, status
transitions. Respect `prefers-reduced-motion`. Durations short (150–350 ms) so
recordings do not feel sluggish.

## Architecture

```
src/
  main.tsx                 router, providers
  routes/
    SignIn.tsx
    Lookup.tsx
    Vehicle.tsx
  components/
    PortalShell.tsx        header, layout
    RecordChecks.tsx
    PackagePanel.tsx
    PhoneMock.tsx
    DemoControls.tsx
    ui/                    shadcn components (generated)
  lib/
    vehicles.ts            demo data + lookup by VIN
    checks.ts              evaluateChecks(vehicle) -> Check[]; allPass(checks)
    authorization.ts       pure reducer for the state machine
    format.ts              masking, plate/odometer formatting
```

- `lib/*` is framework-free and unit tested.
- State lives in the `Vehicle` route via `useReducer` over
  `authorization.ts`; demo controls dispatch the same actions as the phone.
- No global store, no network, no persistence.

## Error handling

- Unknown VIN: lookup shows "No record found for this VIN" inline.
- Malformed VIN (not 17 chars, contains I/O/Q): inline validation message.
- Nothing else can fail; there is no I/O.

## Testing

- Vitest for `checks.ts`, `authorization.ts`, `format.ts`, `vehicles.ts`.
- Screens verified visually in Chrome (screenshots) at 1440×900, the
  recording resolution.
- No end-to-end tests.

## Out of scope

- Owner pre-authorization flow (pending Francesco)
- MTO system integration or an "embedded" variant
- Real SMS, real timers, backend, auth
- Blockchain / ledger visuals
- Police or insurer-facing screens
