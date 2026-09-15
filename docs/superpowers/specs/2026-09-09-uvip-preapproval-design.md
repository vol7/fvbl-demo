# FVBL demo — UVIP pre-approval flow and link-based owner confirmation

Date: 2026-09-09
Status: approved (François Deguire)
Builds on `2026-09-04-two-surface-demo-design.md`. Source: Granola sync of
2026-09-08 ("UVIP pre-approval flow — MTO integration and user-facing design").

## Why

Not every buyer arrives at the counter with a seller who already answered a
text. Polycaro's answer is a **pre-approval**: the registered owner (seller) or
the buyer can start the authorization ahead of time from ServiceOntario. The
demo therefore needs a public, user-facing surface, and the clerk portal must
show an authorization that already exists. The owner's response moves from
reply codes to an SMS link that opens a one-page yes/no, used by every path.

## Decisions

| Question | Decision |
| --- | --- |
| Owner response | One link-based confirm page for clerk- and buyer-initiated requests |
| Seller identity check | Ontario driver's licence number + mocked photo capture that resolves to Verified |
| Entry page | Saved copy of ontario.ca/page/serviceontario, scripts stripped, with a new UVIP card and link |
| Theme | Scoped `.theme-so` override matching ontario.ca: Raleway/Open Sans, #0066CC, ServiceOntario green band |
| Email to seller | Not shown; SMS only |
| Integration story | Standalone; clerk Alt+Tabs to FVBL |

## Session model

`AuthorizationState` gains `origin: "clerk" | "owner" | "buyer"` on every
non-idle state and a `requester` label (applicant name at the counter, buyer
name online, or the owner). Pre-approvals carry `validUntil` (30 days).

New actions:

- `preapprove { vin, owner, at }` — owner verified online → `authorized`
  immediately with origin `owner`, `authorizationCode`, `validUntil`.
- `buyerRequest { vin, buyer, otp, at }` — buyer online → `pending` with origin
  `buyer`, 24h expiry, SMS link sent.
- `request` (clerk) unchanged apart from `origin: "clerk"`.
- `approve` / `deny` / `timeout` unchanged; they keep the origin.

Session `open` from the portal no longer resets an existing authorization for
the same VIN, and, when the VIN differs, only resets if the stored authorization
is not a pre-approval for that new VIN. Practically: the store keys the
authorization by VIN, so a pre-approval made for VIN A survives the clerk
opening VIN A later. Implementation: `SessionState.vin` becomes the currently
open vehicle and `authorization` stays as-is when `open` matches the stored
`authorization.vin`. To keep this simple the authorization object carries `vin`.

## Routes

| Route | Surface | Purpose |
| --- | --- | --- |
| `/serviceontario` | Public | Compact replica of ontario.ca/page/serviceontario: Ontario header bar, hero "We are here to help", "Vehicles" section with tiles (Renew a licence plate sticker, Replace a licence plate, Transfer vehicle ownership, Get a vehicle record, **Get a Used Vehicle Information Package (UVIP)**, Register a vehicle), footer. |
| `/uvip` | Public | Intro + role choice: "I am the registered owner" / "I am buying this vehicle". |
| `/uvip/owner` | Public | Stepper: 1 Vehicle (VIN, plate) → 2 Identity (licence number, photo capture card) → 3 Review → Done (reference, valid until, "the clerk will see this"). |
| `/uvip/buyer` | Public | Stepper: 1 Vehicle (VIN) → 2 Your details (full name, licence number, mobile) → 3 Review → Done ("We texted the registered owner. You will be notified when they respond."). |
| `/phone` | Phone | Thread. Request bubble now ends with a tappable link `fvbl.on.ca/c/XXXX`. |
| `/phone/confirm` | Phone | One-page yes/no: FVBL header, vehicle title and plate, "Requested by {requester} at {where}", expiry, Approve / Deny. Result screen: green check "Authorization recorded · reference" or grey "Request declined", link back to Messages. Thread then shows a system line "You approved this request" / "You declined this request". |

Portal changes:

- `PackagePanel`: `authorized` with origin `owner` renders "Authorization on
  file" (pre-approved by registered owner via ServiceOntario on {date}, valid
  until {date}, reference); origin `buyer` renders "Authorized by registered
  owner" with "Requested online by {buyer}"; origin `clerk` unchanged. The
  request button is hidden when an authorization is on file.
- `pending` with origin `buyer`: "Awaiting registered owner" with "Requested
  online by {buyer} at {time}"; the clerk can still see the countdown.
- Activity timeline: "Pre-approval requested online" / "Pre-approved by owner
  online" events.
- Requests table live row shows the requester.
- Hub: third card "ServiceOntario (public)" → `/serviceontario`, record at
  1440×900. Scenario table gains scenario 3.

## Theme

`.theme-so` on the public pages' root matches ontario.ca: Raleway Modified for
headings, Open Sans for body (both mirrored from the saved theme), `--primary`
#0066CC, near-black `--foreground`, `--radius` 0.25rem. The header bar carries
the real Ontario logo and the band below it is ServiceOntario green (#054426)
with the real ServiceOntario wordmark.

## Demo data

- Owner: Daniel Okafor, licence `D6101-40706-60905` (matches the specimen card
  shown in the capture step; masked on review), mobile ending 0917.
- Buyer: Marcus Beaulieu, licence `B2947-51083-64712`, mobile ending 4410.
- Pre-approval validity 30 days.

## Motion

Stepper panels cross-fade (150 ms out / 200 ms in, y 8). Photo capture: the
specimen licence rests on a white surface with corner brackets, then a 1.4 s
scan line sweeps the whole surface, then the card renders crisp and the header
shows "Verified". No overlay is drawn on the card itself. Confirm page result: check icon
scale 0.25→1 with blur 4→0, spring bounce 0. Phone bubble for the system line
enters staggered like replies.

## Testing

- `authorization.test.ts`: preapprove, buyerRequest, origin preserved through
  approve/deny/timeout.
- `session.test.ts`: open does not reset an authorization already on file for
  the same VIN.
- `ConfirmPage.test.tsx`: renders requester/vehicle, approve and deny dispatch,
  result screens.
- `Uvip*.test.tsx`: owner flow reaches done and writes an `owner` authorization;
  buyer flow reaches done and writes a `buyer` pending.
- `PackagePanel.test.tsx`: on-file and buyer-origin states.
- Visual pass at 1440×900 (portal, ServiceOntario, UVIP) and 390×844 (phone,
  confirm).

## Out of scope

Waiting-room priority coupon, predictive risk model, blockchain tag, real
identity verification, email channel, real SMS.
