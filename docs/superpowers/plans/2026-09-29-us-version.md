# US version of the demo apps: implementation plan

> **For agentic workers:** work task by task, in order. Steps use checkbox
> (`- [ ]`) syntax. Run `pnpm test && pnpm typecheck && pnpm lint` before each
> commit.

**Goal:** One app that plays both cuts. `/ca/*` is today's Ontario demo,
unchanged. `/us/*` is the Ohio demo from `docs/us-version.md`: a dealer's
first title with title-alert opt-in, a mock of Ohio's title search where the
buyer asks the owner to confirm, the owner's title alert on the phone
(Approve or **Not me**), and a county title clerk who issues the title with
FVBL informing the decision.

**Brief:** `docs/us-version.md`. Read it first, especially "FVBL informs;
the clerk decides", "The flow" and "The catches, flipped".

**Architecture:** the country comes from the first segment of the URL. A
`RegionProvider` exposes a region pack (data, copy, rules) and a
region-scoped session store. Shared components (portal shell, vehicle page,
decision card, record checks, timeline, ownership, ledger, phone, dealer
page, sign-in, hub) read what differs from the pack. Only the buyer-facing
public page is per country: ServiceOntario/UVIP for Canada, the Ohio title
search for the US.

## Decisions already made

- **Route prefix, not duplicate apps or a build flag.** `/ca/...` and
  `/us/...`; `/` is a two-card picker. Legacy unprefixed routes redirect to
  `/ca/...` so the Canadian setup and shared links keep working.
- **Session storage per region**: `fvbl-demo:session:v2:ca` and
  `…:us`, with a BroadcastChannel name per region. A US reset never touches
  a Canadian setup. Existing `fvbl-demo:session:v2` data migrates to `:ca`
  once.
- **The context defaults to `ca`**, like `video/src/audience.ts`, so the
  existing tests pass without a provider.
- **The buyer page lives at `/us/ohio`.** It's a React page in a generic
  state-government style, not a saved copy of bmvonline.dps.ohio.gov (unlike
  ServiceOntario), with the watermark "Concept mock-up. Not a government
  page." and no seals or officials' names. No fake address bar showing a
  real .gov URL.
- **FVBL never gates the title** (brief, "FVBL informs; the clerk decides").
  The US decision card says "Hold for review", not "Hold, do not issue".
- **A missing owner confirmation is neutral** in the US. Only "Not me" turns
  it red.
- **US spelling and units in US copy**: color, license, miles.
- **The FVBL mark**: use `FvblMark` in every US shell. Don't copy the path.
  Placeholder rules in `CLAUDE.md` apply.

## Open questions (defaults in brackets; each is a one-line change in the US pack)

1. Title alert sender on the phone. [`Ohio Title Alert`]. Brief: the state,
   not FVBL; BMV or county clerks is unresolved.
2. SMS link domain. [`fvbl.us/c/…`]. Never a `.gov` domain.
3. Clerk office. [`Franklin County Title Office · Columbus`, Counter 3]. The
   Canadian cut names "MTO Toronto Downtown", so a real county follows
   precedent; switch to a generic "County Title Office" if Policaro prefers.
4. Referral target. ["state investigators", no unit named] until the US
   contact confirms who a clerk refers a suspect title to.
5. Stolen-vehicle source. [NICB]. NCIC would read as law-enforcement
   surveillance; keep the conditional wording either way.
6. Dealer and people names: invented. Check that no dealer name matches a
   real Ohio dealership before recording.

---

## File structure (new and changed)

```
src/
  regions/
    types.ts            Region id, RegionPack interface
    context.tsx         RegionProvider, useRegion(), useRegionPaths()
    ca/index.ts         today's constants moved here (office, people, vehicles, copy, checks config)
    us/index.ts         the Ohio pack
    us/vehicles.ts      Ohio demo vehicles
    us/people.ts        Ohio demo people
    us/copy.ts          every US string the shared components need
  lib/
    paths.ts            regionPaths(region), legacy paths kept for redirects
    session.ts          storage key and channel per region; store from context
    authorization.ts    policy option: confirmation "required" | "optional"
    checks.ts           check set and sources come from the pack; new check ids
    story.ts            story text from the pack
    format.ts           formatOdometer(value, unit)
  routes/
    Picker.tsx          `/`: Canada | United States
    Hub.tsx             takes the region; scenarios and force states from the pack
    public/ohio/TitleSearch.tsx   the buyer's page
  main.tsx              /:region routes, legacy redirects
```

---

### Task 0: Commit the current redesign work (François)

The branch `redesign/vehicle-page` has about 30 modified files, and the
region split touches most of them. Commit or stash them before Task 1 so
the refactor diff stays readable. This one isn't for an agent.

---

### Task 1: Region context and prefixed routes, Canada only

**Files:** `src/regions/types.ts`, `src/regions/context.tsx`,
`src/lib/paths.ts`, `src/main.tsx`, `src/routes/Picker.tsx`,
`src/routes/Hub.tsx`, every `paths.` call site.

- [ ] `type RegionId = "ca" | "us"`. `RegionProvider` reads `:region` with
      `useParams`, renders a 404 for anything else, and defaults to `ca`
      outside a route (tests).
- [ ] `regionPaths(region)` returns today's `paths` shape with the prefix.
      `useRegionPaths()` returns it for the current region. Replace every
      `paths.portal.*`, `paths.dealer.*`, `paths.phone*`, `paths.uvip*` call
      site with it.
- [ ] Router: `/:region` → Hub; `/:region/portal/...`, `/:region/dealer/...`,
      `/:region/phone/...`; `/ca/uvip...` (Canada only); `/us/ohio` (Task 7).
- [ ] Legacy redirects: `/portal*`, `/dealer*`, `/phone*`, `/uvip*`,
      `/demo` → the same path under `/ca`, query string kept. The static
      `/serviceontario/` page still links to `/uvip`; the redirect covers it.
- [ ] `/` is `Picker`: two cards, "Canada · Ontario" and "United States ·
      Ohio", each linking to its hub. Not part of the product; plain styling
      like today's hub.
- [ ] Hub windows open prefixed routes.
- [ ] Tests: legacy redirect keeps path and `?tab=`; unknown region renders
      not-found; `useRegionPaths` outside a route gives `/ca/...`.
- [ ] Commit: `refactor: route every surface under a region prefix`

### Task 2: Session store per region

**Files:** `src/lib/session.ts`, `src/lib/session.test.ts`,
`src/regions/context.tsx`.

- [ ] `STORAGE_KEY` becomes `storageKey(region)` →
      `fvbl-demo:session:v2:<region>`; `CHANNEL_NAME` becomes
      `channelName(region)`.
- [ ] One store per region, created lazily; `useSession()` reads the
      region from context.
- [ ] One-time migration: if `fvbl-demo:session:v2` exists and `:ca`
      doesn't, copy it to `:ca` and delete the old key.
- [ ] Tests: a `us` dispatch doesn't change `ca` storage; the Canadian
      reset leaves `us` alone; migration runs once.
- [ ] Commit: `refactor(session): one session per region`

### Task 3: Move Canada's data and copy into `src/regions/ca`

No visible change. This is the step that proves the seams.

**Files:** `src/regions/types.ts`, `src/regions/ca/index.ts`, and the files
with the most Canadian strings: `lib/vehicles.ts`, `lib/checks.ts`,
`lib/story.ts`, `lib/people.ts`, `lib/office.ts`, `lib/sms.ts`,
`lib/registration.ts`, `lib/activity.ts`, `lib/ledger.ts`,
`lib/forceStates.ts`, `components/DecisionCard.tsx`,
`components/phone/PhoneScreen.tsx`, `components/phone/ConfirmPage.tsx`,
`routes/dealer/Register.tsx`, `routes/SignIn.tsx`, `routes/Hub.tsx`,
`routes/Home.tsx`, `routes/Vehicle.tsx`, `components/Plate.tsx`.

- [ ] Define `RegionPack` with:
  - `office`, `people` (owner, buyer, dealer, first owner)
  - `vehicles`, `recentVins` (the sidebar and "Recent lookups" order)
  - `checks`: the ordered list of check ids, `LABELS`, `SOURCES`,
    `AGENCIES`, `SEVERITY`, `INTEGRATIONS`
  - `story`: per-check title, body and footnote builders, and referral
    wording (`referredTo`, `notifyAfterReview`)
  - `copy`: decision-card labels and texts, phone sender and SMS bodies,
    confirm-page texts, dealer page, sign-in variants, hub scenarios
  - `sms.link(token)`, `odometerUnit: "km" | "mi"`, `plateStyle`
  - `policy.ownerConfirmation: "required" | "optional"` (Task 5)
  - `forceStates`
- [ ] Move today's values into `regions/ca` verbatim. Shared modules take
      the pack as an argument (pure `lib` functions) or read it with
      `useRegion()` (components). No Canadian literal left outside
      `regions/ca`, except the static ServiceOntario page and `public/uvip`
      routes, which are Canada-only.
- [ ] `formatOdometer(value, unit)`.
- [ ] Guard: a test that greps shared `src/` (outside `regions/`,
      `routes/public/`, `components/public/`) for `MTO|Ontario|ServiceOntario|CBSA|UVIP|ministry|licence|colour`
      and fails on a hit. Comments may mention them; strip comments first
      or allow-list them.
- [ ] Existing tests pass unchanged, apart from imports. Record one
      Canadian take (scenario 3) and compare it by eye with the last one.
- [ ] Commit: `refactor: Canada's data and copy live in a region pack`

### Task 4: The US pack: people, office, vehicles

**Files:** `src/regions/us/{index,people,vehicles,copy}.ts`,
`src/lib/vehicles.ts` (types), `src/lib/format.ts`.

- [ ] Widen types without changing Canadian data:
  - `Agency` gains `"CBP" | "Ohio BMV" | "County clerk" | "NMVTIS"` and a
    generic `"State registry"` for other states.
  - `VehicleEvent` gains `firstTitle`, `titleTransfer` and
    `titleBrand` (salvage), carrying `state` and `county` where they apply.
  - `VehicleRecords` gains `otherJurisdiction: { jurisdiction, kind:
    "title" | "registration", since } | null` and `brand: { state,
    brand: "Salvage" | …, brandedOn } | null`. `usTitle` stays for Canada.
- [ ] People (invented, 555-01xx numbers, Ohio area codes 614/216/419):
      registered owner of the 2023 GLE, buyer, dealership with a dealer
      principal and dealer number, first owner of the new vehicle, the
      county clerk. No real names; check the dealer name (open question 6).
- [ ] Office: open question 3.
- [ ] Vehicles, each with its own VIN (valid check digit, run through
      `isValidVin`) and Ohio plate (`ABC 1234`):
  1. **Happy path**: 2023 Mercedes-AMG GLE, titled in Ohio, one prior
     transfer, title alerts on. All checks pass.
  2. **Exported, no re-entry**: CBP export record, no US re-entry. Border
     security story.
  3. **One VIN, two countries**: an out-of-state title presented at the
     Ohio counter for a VIN the ledger shows on an active Ontario
     registration.
  4. **Salvage re-titled clean**: salvage brand in one state, clean title
     in a second. Not Pennsylvania (the Canadian cut uses it) and not
     Michigan (brief).
  5. **New vehicle**: 2026 Mercedes-Benz GLE, decodes, no title on file
     until the dealer submits.
- [ ] Tests: every VIN valid, every VIN unique within the pack, every
      vehicle's checks evaluate to the scenario's expected pass/fail set.
- [ ] Commit: `feat(us): Ohio demo people, office and vehicles`

### Task 5: Owner confirmation as optional evidence, and issuing a title

**Files:** `src/lib/authorization.ts`, `src/lib/authorization.test.ts`,
`src/lib/session.ts`, `src/lib/verdict.ts`, `src/routes/Vehicle.tsx`.

The US machine differs from Canada's in one rule: issuing does not need an
approval.

- [ ] `authorizationReducer(state, action, policy)`. With
      `ownerConfirmation: "optional"`:
  - `issue` is allowed from `idle`, `pending`, `authorized` and
    `frozen/timeout`. It records `issued: { at, titleNumber }` (rename the
    field to `reference` for both regions, keeping `packageNumber` readable
    from stored Canadian sessions).
  - `issue` is refused from `frozen/denied` ("Not me") and `blocked`
    (failed checks) unless it carries `reviewNote` (Task 9).
  - `request` works as today: the buyer's page or the clerk can ask.
- [ ] With `"required"`, behaviour is exactly today's. The existing tests
      prove it.
- [ ] `verdictLabel` reads its labels from the pack. US labels: "Checks
      clear", "Awaiting owner", "Owner confirmed", "Title issued", "Hold for
      review" (failed checks or "Not me"), "No reply" (timeout, neutral),
      "Referred to investigators".
- [ ] Tests, US policy: issue from idle; issue after timeout; no issue after
      deny; no issue when blocked; approve after issue is ignored.
- [ ] Commit: `feat(us): the owner's confirmation is evidence, not a gate`

### Task 6: US record checks and stories

**Files:** `src/lib/checks.ts`, `src/lib/story.ts`, their tests,
`src/regions/us/index.ts`, `src/components/RecordChecks.tsx`.

- [ ] New check ids: `nmvtis` ("NMVTIS title check"), `otherJurisdiction`
      ("No active title in another state or Canada"), `brand` ("Title brand
      history"), `ownerConfirmed` ("Owner confirmed the sale").
- [ ] US check order: border (CBP), decode (NHTSA vPIC · Ohio title
      record), stolen (open question 5), nmvtis, otherJurisdiction, brand,
      odometer (miles), lien (on the Ohio title), then ownerConfirmed.
- [ ] `ownerConfirmed` comes from the authorization state, not the vehicle:
      pass with its ledger certificate when `authorized`, fail (high) on
      "Not me", **omitted** otherwise. `evaluateChecks(vehicle, pack, auth)`.
- [ ] The "Blockchain certified" mark (`LedgerMark`) on the
      `ownerConfirmed` row opens the confirmation's certificate.
- [ ] US stories (the brief's framing; conditional wording for every
      federal, third-party and cross-border source):
  - border: CBP export on file, no re-entry; "either vehicle may carry a
    cloned identity, or a re-entry went unrecorded".
  - otherJurisdiction: the title presented here is for a VIN with an active
    Ontario registration, "reported to the ledger by Ontario's registry".
    Footnote names the reach ("A record held in another jurisdiction"),
    never "the Ohio record alone would have shown it clear".
  - brand: salvage brand in state A, clean title in state B, found
    alongside the NMVTIS check. The exact evidence line is settled in the
    screenplay (Task 11).
  - ownerConfirmed on "Not me": "The registered owner said this sale isn't
    theirs." Pitch as title-theft protection.
  - Every red card ends: "Your office decides whether to issue."
- [ ] Tests: each US scenario tells its story; no US story contains
      "blocked", "denied by", "will not allow" or "alone would have".
- [ ] Commit: `feat(us): Ohio record checks and stories`

### Task 7: The Ohio title search (buyer, shot 1a)

**Files:** `src/routes/public/ohio/TitleSearch.tsx`, a test beside it,
`src/components/public/StateShell.tsx`.

- [ ] `StateShell`: generic state-government header ("Ohio · Title search",
      no seal, no officials), footer, and a fixed watermark banner:
      "Concept mock-up. Not a government page." Reuse `VinStep`.
- [ ] Steps:
  1. Enter a VIN → result card "Title active in Ohio" with year, make and
     model only. No owner, no history, no NMVTIS data (the brief explains
     why).
  2. **Ask the owner to confirm** → the buyer's name and mobile, one line
     on what happens ("The registered owner gets a text and decides. We
     never show you their name or number."), Send.
  3. Waiting → "Owner confirmed" (green, with time) or "The owner said this
     isn't their sale" (red, with a plain next step: don't pay, and contact
     the county title office). Follows the session live like `UvipBuyer`.
- [ ] Dispatches `buyerRequest` on the US session; the phone follows it.
- [ ] Tests: no owner name or phone rendered in any state; watermark
      present; approve on the session flips the page green, deny red.
- [ ] Commit: `feat(us): mock Ohio title search with owner confirmation`

### Task 8: The owner's title alert (phone, shot 1b)

**Files:** `src/components/phone/PhoneScreen.tsx`,
`src/components/phone/ConfirmPage.tsx`, their tests,
`src/regions/us/copy.ts`.

- [ ] Sender from the pack (open question 1). Thread history shows the
      earlier opt-in text ("You turned on Ohio title alerts for your 2023
      GLE, VIN …1234. We'll text you if someone asks to transfer it.
      Reply STOP to turn them off.") so the opt-in is on screen.
- [ ] The alert: "Ohio title alert: a buyer asked you to confirm the sale
      of your 2023 Mercedes-AMG GLE (VIN …1234). Review: fvbl.us/c/…" It
      asks for nothing.
- [ ] Confirm page: the car, the last four of the VIN, the buyer's first
      name and initial, the time; **Approve** and **Not me**. A line that
      it asks for no login, ID or payment. Result screens for both.
- [ ] Dealer mode (flow 0) reads the first-title submission back (Task 10).
- [ ] Tests: no request for personal information on any US phone screen;
      "Not me" dispatches deny.
- [ ] Commit: `feat(us): the owner's title alert and confirmation`

### Task 9: The county title clerk (shot 2)

**Files:** `src/components/DecisionCard.tsx`, `src/routes/Vehicle.tsx`,
`src/routes/SignIn.tsx`, `src/components/RequestDialog.tsx`,
`src/routes/Home.tsx`, `src/routes/Cases.tsx`.

- [ ] Sign-in variant from the pack: county title office, "Authorized
      users only".
- [ ] Decision card, US:
  - Checks clear, with or without a confirmation: one sentence on what
    was checked; if confirmed, "The owner confirmed the sale at … from their
    title alert." Primary: **Issue title**. Secondary: **Ask the owner to
    confirm** when none is on file.
  - Title issued: "{clerk} issued the title at … ." Reference `OH-T-…`.
  - Hold for review: the story, then "Your office decides whether to
    issue." Primary: **Refer to investigators**. Quiet secondary:
    **Issue after review…**, which asks for a one-line note and records
    "Issued after review" with the note on the ledger. Not used in the
    video; it makes "the clerk decides" true.
  - Referred: "Referred to state investigators" (open question 4), what
    went with the file, and that the reason isn't shared with the customer.
- [ ] The strip under the card names what was checked, with the
      confirmation's certificate when present.
- [ ] Tests: US card never renders "do not issue", "blocked" or "package";
      Issue title works from idle; Issue after review needs a note.
- [ ] Commit: `feat(us): county title clerk issues the title`

### Task 10: First title from the dealer (flow 0)

**Files:** `src/routes/dealer/Register.tsx`, `src/lib/registration.ts`,
`src/components/dealer/DealerShell.tsx`, tests.

- [ ] `Submission` gets a region-neutral `sourceDocument` (NVIS for Canada;
      "Manufacturer's certificate of origin" and its number for the US) and
      `titleAlerts: { mobileLast4 } | null`.
- [ ] US page: "First title application, from the manufacturer's
      certificate of origin". The one live check mark confirms the MCO.
      A second, pre-ticked row: "The first owner turned on title alerts for
      mobile ending …", with a line that the owner can turn them off any
      time.
- [ ] After confirmation: "Title application recorded", reference
      `FVBL-T-…`, the ledger's first entry, and an activity row "Title alerts
      on for mobile ending …".
- [ ] The clerk's Unregistered VIN card resolves live, as in Canada.
- [ ] Commit: `feat(us): dealer's first title with title-alert opt-in`

### Task 11: US hub, force states and README

**Files:** `src/routes/Hub.tsx`, `src/lib/forceStates.ts`,
`src/regions/us/index.ts`, `README.md`.

- [ ] US hub lists the US surfaces (dealer, Ohio title search, clerk,
      phone) with the same window sizes, the US scenarios table, and
      **Reset session** and **Force state** for the US session: dealer
      submitted, title recorded, buyer asked, owner confirmed, owner said
      "Not me", title issued, held, referred.
- [ ] README: the region prefix, both hubs, the US demo VINs and people
      tables, and a note that legacy routes redirect to `/ca`.
- [ ] Commit: `feat(us): US hub and force states`

### Task 12: US footage and voice (video)

Not app code; listed so the order is clear.

- [ ] US shot list in `docs/screenplay.md` from the brief's flow table,
      one line per on-screen action.
- [ ] Rewrite US lines 05–35 in `video/src/lines.ts`, keeping the marks
      where possible. Memory rules: no AI tells; the voice follows the
      screen; test with `pnpm voice:scratch --audience us`. The voice says
      the clerk issues the title.
- [ ] Record into `video/public/clips/us/` with the same file names, at
      1440×900 and 390×844, from `/us`.
- [ ] Takes in `video/public/audio/vo/us/`, mix to
      `soundtrack-us.wav`, `pnpm render:review:us`, then `pnpm render:us`.

---

## Before recording the US cut

- Open questions 1–6 answered or accepted with their defaults.
- The brief's "To verify" list is checked, in particular what a clerk can
  do with a suspect title and the DPPA question.
- Policaro has seen the Ohio title search mock-up and the watermark.
