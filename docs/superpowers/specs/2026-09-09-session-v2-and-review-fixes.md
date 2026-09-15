# FVBL demo — session model v2 and video-review fixes

Date: 2026-09-09
Status: approved (François Deguire)
Supersedes the session model in `2026-09-04-two-surface-demo-design.md` and
`2026-09-09-uvip-preapproval-design.md`. Review source: Granola
"Federal VIN Blockchain Ledger — video review and product feedback",
2026-09-09.

## Why

The v1 session held one `vin` and one `authorization`. The vehicle page wrote
`vin` on mount, so browsing was a write: opening another vehicle reset the
authorization, and every screen carried its own "is this session about my
vehicle" check. Windows also each kept an authoritative in-memory copy and
broadcast whole snapshots, so a stale window could overwrite a fresh one.

## Session model v2

```ts
type SessionState = {
  authorizations: Record<string /* VIN */, AuthorizationState>
  activeVin: string | null   // what the phone follows; set only by request actions
}
```

- Browsing is read-only. The vehicle page reads `authorizations[vin]` and falls
  back to `initialState(canRequest)`. There is no `open` action and no effect
  that dispatches on mount.
- Every action names its `vin` and touches only that slot. Several vehicles can
  hold state at once.
- `activeVin` is set by `request`, `buyerRequest` and `preapprove` only. Reset
  clears the map. Force writes one slot and sets `activeVin`.
- One selector, `vehicleState(session, vin, canRequest)`, is the only place the
  fallback lives. `activeAuthorization(session)` serves the phone and hub.

## Single source of truth

`dispatch` reads the current state from `localStorage`, applies the reducer,
writes back, then notifies. Windows never apply the reducer to their own copy.
Cross-window notification is a ping; receivers re-read storage. Storage key is
`fvbl-demo:session:v2`; v1 is ignored.

## Loud illegal transitions

When the reducer returns the same state, the store logs
`[fvbl] ignored <action> in <status>` in dev. A stuck flow becomes a one-line
diagnosis instead of a silent no-op.

## Review fixes (client, 2026-09-09)

| Item | Change |
| --- | --- |
| Plate is too sensitive for the public tool | Removed from the public VIN result card, both review steps, and both done screens. Kept on the clerk portal and in the SMS (owner-side). |
| Owner identity step | Full-name field removed. Licence number plus mobile plus photo. Review shows the registered owner masked from the record. |
| Review screens | Driver's licence shown in full; the user typed it seconds earlier. |
| SMS link | 16-character alphanumeric token stored on the authorization, shown as `fvbl.on.ca/c/<token>`. |
| Confirm page | "Requested by" shows the name only, no source. "Back to Messages" removed; the browser back chevron remains. |
| Clerk request form | Applicant name, driver's licence, mobile. Name becomes the requester in the SMS and tables. |
| Clerk lookup hint | Removed. Clerks are in an office. |
| Escalate button | "Escalate to law enforcement". Live case routes to OPP Auto Theft Unit. |
| Brand colour on UVIP pages | Left as is; the review ended on "keep it like that". |

Not changed: outro card (video edit), 2FA on the requester's phone (discussed as
likely, deferred).

## Hosting

`vercel.json` and `public/_redirects` route `/serviceontario` to the static page
and everything else to the SPA, so a one-shot deploy behaves like `pnpm dev`.

## Testing

Reducer and store tests rewritten for v2. Two regression tests encode the bugs
that motivated this: a pending request survives navigating to another vehicle
and back, and two vehicles hold independent state. Component tests updated for
the new form fields and copy. Browser checks for approve sync, reset then
re-request, and force buttons re-run against v2.
