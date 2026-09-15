# OVIL demo — federal integrations, vehicle history and ledger

Date: 2026-09-10
Status: approved and built 2026-09-10 (François Deguire). Amended 2026-09-12: the
ledger page was removed and the vehicle page restructured, see
`2026-09-12-vehicle-page-summary-and-tabs.md`.
Builds on `2026-09-09-session-v2-and-review-fixes.md`. Review source: Granola
"FBVIL x V7 - Visual Review", 2026-09-10 (Frank Marineau, François Deguire,
Francesco Policaro, Fawaz Owayda, Gus Stamatiou).

## Why

The clerk portal shows six Ontario-side record checks and nothing federal.
Policaro Group needs the pitch to show the two integrations they are going to
ask for next, Transport Canada (RIV) and CBSA, and the fraud signal they
described: a vehicle recorded as exported, never re-entered, and someone asking
for a UVIP on it. They also want the blockchain to be visible: every approval,
denial and vehicle event recorded, with a "snapshot of what it looks like on
the blockchain" as a talking point. The VIN decode cross-check (NHTSA vPIC
versus the MTO record) came up as a background check that should hard-block on
mismatch.

Out of this round, by decision in the room or after: clerk override of low-risk
flags (Frank: future direction; the loud green list is right for now),
ownership names in the history (privacy), out-of-province vehicles with no MTO
record, the denial escalation path, a tampered-record red state, and hosting
the clickable demo (separate task, low priority).

## Vehicle history

Each demo vehicle gains a `history: VehicleEvent[]`, the vehicle's chronology
across agencies. The odometer readings move into it; `records.odometerReadings`
is removed.

```ts
type Agency = "Transport Canada" | "CBSA" | "MTO" | "Insurer" | "Dealer"

type VehicleEvent =
  | { kind: "import"; date: string; agency: "Transport Canada"; port: string; detail: string }
  | { kind: "customsEntry"; date: string; agency: "CBSA"; port: string }
  | { kind: "export"; date: string; agency: "CBSA"; port: string; destination: string }
  | { kind: "firstRegistration"; date: string; agency: "MTO"; office: string }
  | { kind: "transfer"; date: string; agency: "MTO"; office: string }
  | { kind: "renewal"; date: string; agency: "MTO"; office: string }
  | { kind: "odometer"; date: string; agency: Agency; km: number; source: string }
```

`office` is an MTO office number and city, e.g. `"4412 · Toronto"`. No names
anywhere in history: Gus and Fawaz asked for transfer dates without the people.

Each vehicle also gains `decoded`, standing in for the NHTSA vPIC response:

```ts
decoded: { year: number; make: string; model: string; bodyStyle: string; plant: string }
```

### Milestones versus detail

`import`, `customsEntry`, `export`, `firstRegistration` and `transfer` are
milestones. `renewal` and `odometer` are detail. The timeline card shows
milestones collapsed and everything expanded.

## Checks

`Check` gains `severity: "high" | "low"`. Two checks join the existing six,
for eight in total:

| Id | Label | Source | Severity | Fails when |
| --- | --- | --- | --- | --- |
| `border` | Import and export record | Transport Canada RIV · CBSA | high | The latest border event (`import`, `customsEntry`, `export`) is an `export`. |
| `decode` | VIN decode match | NHTSA vPIC · MTO registry | high | `decoded` disagrees with the MTO record on year, make, model or body style. |
| `stolen` | Stolen vehicle report | CPIC | high | unchanged |
| `writeOff` | Insurer write-off | IBC | high | unchanged |
| `duplicate` | Duplicate identity | MTO vehicle registry | high | unchanged |
| `collision` | Collision record | Ontario collision reporting | low | unchanged |
| `odometer` | Odometer consistency | MTO registration history | low | Reads `odometer` events from history; logic unchanged. |
| `lien` | Active lien | Ontario PPSR | low | unchanged |

Pass details: border "Entered Canada {date} via {port} · no export on record";
decode "Decodes to {year} {make} {model} {body} · matches MTO record".
Fail details: border "Exported {date} via {port} to {destination} · no re-entry
on record"; decode "Decodes to {decoded} · MTO record says {registered}".

`allPass` and `failingChecks` are unchanged. Blocking stays binary: any failed
check blocks the package and the online pre-approval. Severity is displayed,
not acted on, in this round. `evaluateChecks` returns failures first (high
before low), then passes in the table order above.

## Third scenario: the exported vehicle

| | |
| --- | --- |
| VIN | `SALWR2SE4NA209311` |
| Vehicle | 2022 Land Rover Range Rover Sport HSE Dynamic, Santorini Black, SUV |
| Plate | `CPLR 482` |
| Owner | Amara Chen, Mississauga, ON, phone ending 2286 |
| Story | Imported Halifax 2021-11, first registered 2022-01, CBSA export Montréal 2025-03-18 to Lagos, no re-entry. MTO record still shows Ontario registration. Everything else passes. |

One red row, high risk, blocks the package. On ServiceOntario the VIN returns
the existing "cannot be pre-approved online" message with no code change. The
VIN is exported as `EXPORTED_VIN` and appears third under Recent lookups, which
already maps `DEMO_VEHICLES`.

The cloned Highlander keeps its three failures; `border` and `decode` pass for
it. The GLE passes all eight.

## Vehicle history card

New `VehicleTimeline` component in the left column under the record checks. It
replaces `OdometerHistory`; the `OwnershipCard` stays.

- Title "Vehicle history", caption "{n} events · Transport Canada, CBSA, MTO".
- Collapsed: milestones only, newest first. A "Show all {n} events" button
  expands renewals and odometer readings in place; "Show milestones" collapses.
- Each row: date, title ("Entered Canada", "Cleared customs", "First
  registration", "Ownership transferred", "Registration renewed", "Odometer
  reading", "Exported"), detail (port, office, km), an agency chip, and the
  ledger mark from the section below.
- An `export` row with no later border event is rendered in the danger tone,
  so the flag on the timeline matches the red check above it.
- Entrance animation follows `ActivityTimeline` (stagger, reduced motion off).

## Ledger

`src/lib/ledger.ts` derives a per-vehicle chain from history plus the live
authorization state. Nothing is stored; the chain is a pure function of
what the page already has, so it is identical on every render and in every
window.

```ts
type LedgerEntry = {
  seq: number
  at: string
  kind: string            // "import" | "export" | "transfer" | "authorization.approved" | ...
  vin: string
  office?: string         // MTO office for MTO events and clerk actions
  visibility: "public" | "fingerprint"
  hash: string            // 64 hex chars
}

function ledgerEntries(vehicle: Vehicle, state: AuthorizationState): LedgerEntry[]
function fingerprint(input: string): string
function shortHash(hash: string): string   // "a3f9…c21e"
```

- `fingerprint` is a deterministic 64-hex stand-in (FNV-1a over several seeds,
  synchronous). The UI never names an algorithm; the code comment says it is a
  stand-in for the demo.
- Each entry hashes its own payload plus the previous entry's hash, so the
  list reads as a chain.
- Visibility: border, registration, transfer and authorization events are
  `public`. Odometer readings are `fingerprint` (private, hashed only). This is
  the split Frank described: post public facts as-is, fingerprint the rest.
- Authorization events come from the session: requested, pre-approved,
  approved, denied, expired, issued, escalated. No names, no plate, no phone in
  the payload: kind, VIN, timestamp, office, reference code.

### Ledger mark

Small inline mark used on timeline rows and activity rows: a shield-check icon,
"Blockchain certified", and the short hash in mono. One label for every entry;
the public/private split is a data detail shown only on the ledger page. Muted
tone; the mark should be legible in a screenshot without competing with the
check result.

### Ledger page

Route `/portal/vehicle/:vin/ledger`, reached from a "View ledger" outline
button in the vehicle header. It is Francesco's snapshot: a table of the chain,
newest first, columns Seq, Recorded, Event, MTO office, Visibility ("Public" or
"Private"), Certificate (full hash, mono, wraps). Header repeats the vehicle
title and VIN with a back link to the vehicle, and a "Blockchain certified"
badge with the count of entries. Caption: "Every event on this vehicle is
certified on the blockchain. Public events are recorded as-is. Private events
are certified without exposing their contents." Nothing on this page identifies
a person and nothing names an algorithm.

## Activity feed

`ActivityEvent` gains an optional `ledger: { hash: string; visibility }`.
`deriveActivity` takes the VIN and attaches the mark to every event that is on
the chain (everything except "Record retrieved" and "Package not issued", which
are views, not ledger events). The mark renders under the detail line.

## Other changes

- `VehicleHeader`: "View ledger" button; blocked badge unchanged.
- `RecordChecks`: header caption "{n} checks · as of {date}"; summary "1 of 8
  checks failed · high risk" when any failing check is high, otherwise
  "· low risk"; failed rows show a "High risk" or "Low risk" badge next to
  "Fail" and, for high, the sentence "Cannot be overridden" in the detail.
  Pass rows unchanged and visible.
- `PackagePanel`: blocked copy mentions severity: "{n} record checks failed,
  {m} high risk. This package cannot be issued …".
- `seed.ts`: no change needed for the third row; `recentRows` maps
  `DEMO_VEHICLES`. Add a `when` label for it.
- README: third VIN in the demo table, eight checks, ledger page, demo person
  Amara Chen. Screenplay: shot 2.1 caption becomes "8 checks … 8 verified",
  and a note that the ledger page is a candidate insert after 2.1 when the
  video is re-cut.
- `people.ts` unchanged.

## Testing

- `checks.test.ts`: border passes on import-only history, fails on export with
  no re-entry, passes on export followed by import; decode fails on a model
  mismatch; ordering puts high failures first; the GLE passes eight, the
  Highlander fails three, the Range Rover fails one.
- `ledger.test.ts`: `fingerprint` is deterministic and 64 hex; entries chain
  (changing an earlier payload changes every later hash); odometer entries are
  `fingerprint`, border and authorization entries `public`; no payload contains
  the owner name, plate or phone.
- `activity.test.ts`: approved and issued events carry a ledger mark, "Record
  retrieved" does not.
- Component tests: `VehicleTimeline` collapsed shows milestones only and
  expands; `RecordChecks` shows the severity badge on failures.
- Browser check: the exported VIN on ServiceOntario returns the not-eligible
  message; the three portal pages and the ledger page at 1440×900.
