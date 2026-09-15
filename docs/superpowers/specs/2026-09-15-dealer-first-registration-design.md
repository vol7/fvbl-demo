# FVBL demo — dealer first registration ("birth of the VIN")

Source: client feedback (Francesco, 2026-09-15): "One item we forgot to add is
the birth of that VIN when the dealer registers the car for the first time. It
should be the same process that we do with the New Vehicle Information
Statement (NVIS) and it should have a simple check mark and pushed over to the
ministry as coming from the dealer and it would still need that two step
authentication." Reference for the real dealer portal is to follow; this pass
builds a generic dealer surface in FVBL's own style and expects a reskin.

## What we are adding

The demo's story starts today at the first *resale*: a UVIP request, an owner's
approval, a clerk's package. This adds the day-one beat: a dealer registers a
brand-new vehicle for the first time, the submission goes to the ministry as a
dealer submission, and it is confirmed from the dealership's registered mobile
with the same two-step the client has already seen. From that moment the VIN
has a record, and the record has a ledger.

Reading the client: the actor is the dealer from start to finish, and "as
coming from the dealer" is a statement of provenance. The second step
therefore attests the **dealer**, not a buyer. The phone surface is reused with
a dealership persona; no new authentication mechanic.

## Decisions

| Question | Decision |
| --- | --- |
| Who does the second step | The dealership, from its registered mobile, via the existing SMS link → confirm page. |
| Build now or wait for reference | Build now, generic dealer portal as a sibling of the clerk portal. Reskin later in one shell file. |
| State model | A separate `registration` reducer beside `authorization`, never overloaded. |
| Where the newborn lives | A fifth static vehicle with empty history and no plate; the session says whether it is born. |
| Video / screenplay | **Not in this pass.** The flow is described below so it is ready to record; `docs/screenplay.md` and `video/` are unchanged. |

## 1. State model and data

### A fifth vehicle, unborn

`NEW_VIN` joins `DEMO_VEHICLES`: a 2026 Mercedes-Benz GLE 450, colour and
decode filled in, `records` all null, and two markers of "not yet registered":

- `history: []`
- `plate: null`

`Vehicle.plate` becomes `string | null` and `Vehicle.registeredOn` becomes
`string | null`. Every consumer that prints a plate gets a "no plate" branch
(summary header, phone context bubble, ownership card, recent-lookups row).
`findVehicle` still finds it: the VIN is real to the decoder before it is real
to the registry, which is the point of the beat.

### A registration reducer beside the authorization one

New `src/lib/registration.ts`, mirroring `authorization.ts` in shape:

```ts
type RegistrationState =
  | { status: "none" }
  | { status: "pending";    ...Submission; otp; link; sentAt; expiresAt }
  | { status: "registered"; ...Submission; otp; link; sentAt; registrationRef; registeredAt; office }
  | { status: "declined";   ...Submission; otp; link; sentAt; declinedAt }

type Submission = {
  dealer: string            // "Mercedes-Benz Downtown"
  dealerMobileLast4: string // "2204"
  nvis: string              // "NVIS 2026-MB-0187342"
  deliveryKm: number        // 12
  firstOwner: string        // invented, not Daniel Okafor
}

type RegistrationAction =
  | { type: "submit"; submission: Submission; otp; link; at }
  | { type: "confirm"; registrationRef; at }
  | { type: "decline"; at }
  | { type: "reset" }
```

Pure reducer. Illegal transitions return the same object. `expiresAt` is
`sentAt + 24 h`. `registrationRef` is `FVBL-R-<yyyy-mm-dd>-<nnnn>`, generated
like case references with an injectable random. `office` is the fixed string
`"Dealer channel · Mercedes-Benz Downtown"`.

### One new slot in the session

```ts
type SessionState = {
  authorizations: Record<string, AuthorizationState>
  registrations: Record<string, RegistrationState>
  activeVin: string | null
}
```

- `submit` writes the slot **and sets `activeVin`**, exactly as `buyerRequest`
  does. This is what makes the phone follow the dealer beat.
- `confirm` / `decline` are targeted by VIN, like `approve` / `deny`.
- `clear` and `force` reset the whole object as today.
- Storage key stays `fvbl-demo:session:v2`. `isSession` accepts a missing
  `registrations` and fills `{}`, so sessions stored before this change load.

### What "born" means downstream

One helper in `vehicles.ts`:

```ts
bornHistory(vehicle: Vehicle, registration: RegistrationState): VehicleEvent[]
```

Returns `vehicle.history`, plus — when `registration.status === "registered"` —
two synthesized events dated `registeredAt`:

- `{ kind: "firstRegistration", agency: "MTO", office }`
- `{ kind: "odometer", agency: "Dealer", km: deliveryKm, source: "Dealer delivery" }`

Every reader of history on the vehicle page goes through this helper: checks,
timeline, summary, ledger. `sortedHistory`, `odometerEvents`, `borderEvents`
and `evaluateChecks` take a `history` argument rather than reading
`vehicle.history`. For the four authored vehicles the helper is the identity and
nothing shifts.

### People

`people.ts` gains:

```ts
DEALER = { name: "Mercedes-Benz Downtown", principal: "Sofia Marchetti",
           number: "47-1182", mobile: "(416) 555-2204", mobileLast4: "2204",
           nvis: "NVIS 2026-MB-0187342" }
FIRST_OWNER = { name: <invented>, licence: <invented>, mobileLast4: <invented> }
```

All invented. Never a real client or contact name.

## 2. The dealer surface

### Routes

`paths.dealer = { signIn: "/dealer", register: "/dealer/register" }`. Recorded at
1440×900.

### Shell

A thin `DealerShell` rather than parameterizing the clerk `Sidebar`: same
shield wordmark reading **FVBL · Dealer Portal**, same top-bar treatment, a
single nav item ("Register a new vehicle"), and a footer identity block
*Mercedes-Benz Downtown · Dealer no. 47-1182 · Sofia Marchetti*. Reuses the
same primitives so it reads as a sibling of the clerk portal. This is the one
file the reskin lands in.

### Sign-in

`SignIn` lifts its title, subtitle and destination to props with the clerk copy
as defaults. `/dealer` renders it with *"Dealer Portal — Sign in with your
dealer credentials to register new vehicles"*, landing on `/dealer/register`.

### The form — "Register a new vehicle"

Three steps with the existing `StepHeader` / `StepPanel`, styled with the
portal's shadcn components (not the ontario.ca theme). Everything is prefilled
except the check mark; on camera the dealer only clicks.

1. **Vehicle.** VIN field prefilled with `NEW_VIN`. Continue decodes it:
   *"2026 Mercedes-Benz GLE 450 · Obsidian Black · built Tuscaloosa, AL"* and,
   under it in quiet grey, **No registration on file. This VIN has not been
   registered in any jurisdiction.** Step 2 cross-fades in after a beat.
2. **NVIS and delivery.** First and largest: ☐ **I confirm the New Vehicle
   Information Statement for this VIN is in hand and matches the vehicle.**
   Below: read-only NVIS number, delivery odometer (12 km), first registered
   owner (name, masked licence), *Submitting as* Mercedes-Benz Downtown.
   Continue is disabled until ticked.
3. **Review and submit.** Summary rows, one line of consequence — *"The
   registration is pushed to the ministry as a dealer submission and must be
   confirmed from the dealership's registered mobile ending 2204."* — and the
   button **Submit to ministry**.

### Result state

Submit dispatches `submit` (sets `activeVin`). The panel becomes
**Submitted to the ministry · awaiting confirmation** with *"Text sent to
mobile ending 2204"* and the link token, and subscribes to the session:

- confirmed → green check, **Registration recorded**, the `FVBL-R-…` reference,
  and a "View in FVBL" link to the clerk vehicle page;
- declined → grey **Submission withdrawn**.

The dealer window is a live witness during the phone beat, as the
ServiceOntario "Request sent" card is today.

## 3. The phone

### Selecting the thread

`liveThread(session)` returns a discriminated union:

```ts
type Thread =
  | { kind: "authorization"; vehicle: Vehicle; state: Texted }
  | { kind: "registration";  vehicle: Vehicle; state: Exclude<RegistrationState, { status: "none" }> }
```

Precedence: if `registrations[activeVin]` is past `none`, that is the thread;
otherwise today's authorization logic. A VIN is never in both flows during the
demo.

### Persona

`PhoneScreen` reads the persona off the thread kind: registration →
`aria-label="Dealership phone"`, header contact *FVBL ›* unchanged, context
bubble shows the decoded vehicle with *no plate yet*. The bubble prop
`from: "fvbl" | "owner"` is renamed to `"fvbl" | "them"` so the dealer's side
isn't labelled "owner" in code.

### Copy

- Inbound: *"FVBL: Mercedes-Benz Downtown submitted the first registration of a
  2026 Mercedes-Benz GLE 450 (VIN …{last4}) to the ministry. Confirm this
  submission: fvbl.on.ca/c/XXXX. Expires in 24 hours."*
- After confirm (delayed like today): *"Confirmed. Registration FVBL-R-… is
  recorded and the vehicle's ledger has been opened."*
- After decline: *"Understood. The submission has been withdrawn."*

### Confirm page

For a registration thread: heading **Confirm a first registration?**; rows for
vehicle (decoded title), VIN, *Submitted by* Mercedes-Benz Downtown, *First
owner* (name only), *NVIS* number, expiry; buttons **Confirm** / **Decline**.
Dispatches `confirm { vin, registrationRef, at }` or `decline { vin, at }`.
Result screen: green check **Registration recorded · FVBL-R-…**, or grey
**Submission declined**; back chevron to Messages as today. Address bar shows
`fvbl.on.ca/c/XXXX`.

### Hub label

The "Registered owner phone" card becomes **Phone** — *"Owner's or dealership's
messages, follows the latest request. Record at 390×844."* Same route.

## 4. Clerk portal and ledger

### Before birth — an Unregistered VIN card

`Vehicle.tsx` gains a branch between "not found" and the full view: when the
vehicle is found, `history` is empty and the registration is not `registered`,
render a compact card: decoded title; *"This VIN decodes to a 2026
Mercedes-Benz GLE 450 but has no registration on file with the ministry or any
other jurisdiction."*; and, when a submission is pending, a quiet amber line
*"A dealer submission is awaiting confirmation."* No checks, tiles or package
panel. It subscribes to the session so it resolves into the full page live.

### After birth — the ordinary page, read through `bornHistory`

`VehicleView` computes `history = bornHistory(vehicle, registration)` and passes
it down. For the newborn the clerk sees:

- **Header** — decoded title, plate *"Not yet plated"*, verdict **Checks
  clear**, authorization tile *Not yet requested*.
- **Record checks** — eight green rows.
- **Vehicle history** — *First registration · MTO · Dealer channel ·
  Mercedes-Benz Downtown · today* and *Odometer 12 km · Dealer delivery ·
  today*, both Blockchain certified. The first row carries the caption
  **Ledger opened** — first entry for this VIN.
- **Ownership** — first owner masked as every owner is; *Registered today via
  dealer submission*.
- **Ledger tile** — *"2 events · no tampering detected · verified just now"*.

### Ledger

`historyDrafts` handles the born events with titles such as *"First
registration recorded (dealer submission)"*. The chain stays deterministic
because `submit`/`confirm` timestamps live in the session, so all windows
agree. The registration confirmation also appears in the vehicle's activity
feed as *Registration confirmed from dealership mobile* with a certificate.

### Home, Requests, Cases, Hub

- `recentRows()` excludes the unborn GLE until registered, then lists it first
  as *Today, just now · Clear*.
- Requests and Cases are untouched; a registration is neither.
- Hub: scenario row 5 — *New vehicle · dealer first registration* — with the
  VIN and the three-window recipe. Force state gains **Dealer submitted** and
  **Vehicle registered**. A fourth surface card, **Dealer portal**, opens
  `/dealer` at 1440×900.

## 5. The flow, as it will be recorded (not built in this pass)

Kept here so the beat is ready when the screenplay is next revised. Day one,
first: after the Mission card and before the UVIP entry-point card.

1. **Card — Day one.** *"Every vehicle's record begins the day a dealer
   registers it."*
2. **Dealer portal (≈ 15 s).** Signed in on `/dealer/register`, VIN prefilled.
   Continue → decode and "No registration on file" (hold). Tick the NVIS box.
   Continue → Review → **Submit to ministry** → "Submitted · awaiting
   confirmation".
3. **Card — Two-step.** *"The submission is confirmed from the dealership's
   registered mobile — the same safeguard that protects every later request."*
4. **Phone (≈ 12 s).** Text arrives. Tap link → Confirm page → **Confirm** →
   *Registration recorded*.
5. **Portal (≈ 8 s).** The Unregistered VIN card already on screen resolves
   into the full page. History tab: two rows, the first captioned *Ledger
   opened*.

Then the existing story runs unchanged. Roughly +55 s on the current cut.

## Testing

- `registration.test.ts` — transitions, illegal moves return the same object,
  `expiresAt` is 24 h from `sentAt`, reference format.
- `session.test.ts` — `submit` sets `activeVin`; `confirm`/`decline` targeted;
  stored sessions without `registrations` load; `clear` resets both maps.
- `vehicles.test.ts` — `bornHistory` is identity for authored vehicles;
  synthesizes two events dated `registeredAt` for the newborn.
- `thread.test.ts` (new) — registration takes precedence; falls through
  otherwise.
- `ledger.test.ts` — newborn has zero entries before, two after; stable.
- `Vehicle.test.tsx` — Unregistered branch before, full page after `confirm`;
  existing assertions untouched.
- `DealerRegister.test.tsx` — Continue disabled until ticked; Submit dispatches
  with `NEW_VIN`; card flips to *Registration recorded* on confirm.
- `PhoneScreen.test.tsx` / `ConfirmPage.test.tsx` — registration copy and
  Confirm/Decline; owner cases unchanged.

## Out of scope

- Screenplay and video project changes (section 5 is the brief for later).
- Editing or cancelling a registration after confirmation.
- Dealer sign-in validation, multiple dealers, dealer inventory.
- The NVIS as a document or image; the client asked for a check mark.
- The real dealer-portal look — waiting on the client's reference; lands in
  `DealerShell`.
