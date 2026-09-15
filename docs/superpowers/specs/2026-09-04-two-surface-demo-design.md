# FVBL demo — two-surface layout and finished-product pass

Date: 2026-09-04
Status: approved (François Deguire)
Supersedes parts of `2026-09-02-fvbl-demo-design.md` (phone mock placement, shell, screens).

## Why

The recordings will capture the clerk portal and the registered owner's phone as
two separate screen captures. Rendering the phone beside the portal on the same
page no longer works. Separately, the portal reads as a bare proof of concept;
viewers should not be distracted by missing context. This pass moves the phone
to its own route, adds a hub page to open each surface, and builds the portal
out to look like a shipped internal tool while keeping the shadcn components
already in the repo.

## Decisions

| Question | Decision |
| --- | --- |
| Phone recording device | Second Chrome window on the same Mac |
| State sharing | Shared store: localStorage + BroadcastChannel, pure reducer, both windows can act |
| Hub contents | Clerk portal + owner phone cards, scenario VINs, live status, reset |
| Portal shell | Left sidebar app shell with four live nav items |
| Phone look | iOS Messages thread, quick-reply chips |
| Visual references | Mobbin: Attio / Neon / Vanta (shell, record page), Deel (checks summary tiles) |

## Routes

| Route | Purpose |
| --- | --- |
| `/demo` | Hub. Not for camera. |
| `/` | Sign-in (unchanged URL). |
| `/home` | Portal home / dashboard. Landing after sign-in. |
| `/lookup` | Vehicle lookup. |
| `/vehicle/:vin` | Vehicle profile. |
| `/requests` | Authorization requests table. |
| `/cases` | Cases table. |
| `/phone` | Owner phone, full viewport. |

## Shared session store (`src/lib/session.ts`)

```ts
type SessionState = {
  vin: string | null              // vehicle currently open in the portal
  authorization: AuthorizationState
}
type SessionAction =
  | { type: "open"; vin: string; canRequest: boolean }   // portal opened a vehicle; resets if vin changed
  | { type: "clear" }                                     // hub reset
  | AuthorizationAction                                   // forwarded to authorizationReducer
```

- `sessionReducer` is pure and unit tested.
- `createSessionStore()` wraps it: reads `localStorage["fvbl-demo:session:v1"]` on
  start, writes on every dispatch, posts `{ state }` on `BroadcastChannel("fvbl-demo")`,
  and also listens to the `storage` event as a fallback. Falls back to memory when
  storage is unavailable.
- `useSession()` exposes `[state, dispatch]` via `useSyncExternalStore`.
- `Vehicle` dispatches `open` on mount. `PhoneScreen`, `DemoControls`, the hub,
  and the Home/Requests pages all read the same store.

### Authorization state changes

- `frozen` gains `otp` and `sentAt` so the SMS bubble never rewrites its code.
- `escalated` unchanged. An `activity(state)` helper derives a timeline from the
  timestamps present in the state.

## Portal shell

- Sidebar (240px): FVBL wordmark + "Authorized User Portal"; nav group
  "Workspace": Home, Vehicle lookup, Authorization requests, Cases; footer with
  clerk avatar (initials), name, office, and Sign out. Active item highlighted.
- Top bar (56px): breadcrumb, global VIN search (submits to `/vehicle/:vin`),
  notifications bell (static badge), environment chip "Ontario · Production".
- Content area max-width 1200px, `bg-muted/40`.

## Pages

### Sign in
Split layout: left 45% brand panel in primary blue with "FVBL" wordmark, one-line
description, small footer text. Right: card with username, password, Sign in,
"Authorized users only. Access is logged." Accepts any input, navigates to `/home`.

### Home
Greeting with weekday/date and office. Lookup field as hero (same validation as
Lookup). Three stat tiles: Lookups today, Authorizations pending, Cases opened
(seed numbers, pending increments from the live session). "Recent lookups" table:
plate, vehicle, VIN, outcome badge (Clear / Blocked / Pending), time. Rows for
the two demo vehicles link to their profile. "Pending authorizations" list shows
the live request when one exists, else an empty state.

### Lookup
Kept, restyled to match Home (same lookup form component). Recent lookups table
instead of the two-line list, with chevron affordance.

### Vehicle
- Breadcrumb: Vehicle lookup › {plate}.
- Identity header card: title, subtitle (colour · body · plate), VIN in mono with
  copy button, badges: "Registered · Ontario", "High-value model · owner
  authorization required" (clean) or "Record conflicts" (cloned). Fields grid:
  registration date, odometer, registered owner (masked), phone (last 4), lien,
  last inspection.
- Left column: Record checks card with summary strip ("6 sources checked · 6
  verified" or "3 of 6 failed"), rows with source agency and last-updated date;
  Ownership and registration card; Odometer history table.
- Right rail (sticky): Used vehicle package panel; Activity timeline derived from
  the session.
- Summary strip, helper copy, and blocked status wait for the check stagger to
  finish.

### Requests, Cases
Simple tables (shadcn Table) with 4–5 seed rows each plus the live row when the
session has a pending/authorized/frozen request or an escalated case.

### Phone
- Full-viewport dark backdrop; a 390px-wide iOS Messages surface centered, full
  height when the window is that size.
- Status bar (time, signal, battery), header with circular "O" avatar and "FVBL",
  subtitle "Text message".
- Thread: day separator "Earlier" with one older context bubble ("Your Ontario
  registration for plate {plate} was renewed…"), then "Today {time}" separator and
  the live request bubble when pending/authorized/frozen.
- Owner reply and FVBL confirmation bubbles animate in staggered (owner reply,
  then FVBL after ~400ms). "Delivered" caption under owner reply.
- Quick-reply chips "YES {otp}" and "NO" while pending; disabled input bar below.
- Idle: only the context bubble; footer hint "Waiting for a request…" is not
  shown (nothing on screen should look like a dev aid).

### Hub (`/demo`)
Neutral page. Title "FVBL demo". Two cards: Clerk portal (opens `/` in a new
window, note "record at 1440×900") and Registered owner phone (opens `/phone`,
note "resize window to 390×844"). Scenario table with VIN copy buttons. Live
status line (vehicle, authorization status). Buttons: Owner approves, Owner
denies, Simulate 24h timeout, Reset session.

## Motion and polish (from 2026-09-04 review)

- Status box transitions wrapped in `AnimatePresence mode="wait" initial={false}`
  with a short exit (opacity 0, y −12, blur 4px, 150ms).
- Phone slide-in removed (the phone is its own page); bubbles use the stagger above.
- `transition-all` removed from Button and Badge; explicit property lists.
- Press feedback `scale(0.96)` on Button.
- Frozen status uses an amber tone.
- "Authorization reference" label; "Owner code {otp} verified" line.
- Icon buttons use `data-icon="inline-start"`.

## Demo controls

`Shift+D` panel stays on the portal, now dispatching to the shared store. The hub
exposes the same actions permanently.

## Testing

- Vitest: `session.ts` reducer and store round trip (mock localStorage and
  BroadcastChannel), `authorization.ts` updates, PhoneScreen per state,
  activity derivation.
- Existing component tests updated for the new shell/routes.
- Visual pass in Chrome at 1440×900 (portal) and 390×844 (phone).

## Out of scope

Police/insurer screens, real device sync, backend, real auth.
