# OVIL demo — vehicle page: summary header, tabs, border story

Date: 2026-09-12
Status: approved and built (François Deguire)
Amends `2026-09-10-integrations-timeline-ledger-design.md`. Review sources:
Granola "OVIL — blockchain integration, video pacing, et handoff avec client",
2026-09-11 (Frank Marineau, François Deguire), plus François's layout notes.

## Why

The vehicle page had five cards in two columns scrolling past each other, and
a header that said nothing beyond the identity. Frank asked for a group-level
"everything checks out" indicator, for the blockchain to stay quiet (no
dedicated page; a card on the profile and marks on events), and for
"Package not issued" to become "cannot be issued". François wanted the
CBSA and Transport Canada integration to be unmistakable, with the exported
vehicle as the classic example.

## Layout

```
┌ Summary header ───────────────────────────────────────────────┐
│ identity · VIN · plate                     [verdict pill]      │
│ [Record checks] [Owner authorization] [Ledger]   ← tiles       │
│ facts row (registered on, odometer, owner masked, phone, …)    │
│ Sources consulted: Transport Canada · CBSA · MTO · CPIC · …    │
└────────────────────────────────────────────────────────────────┘
┌ Border alert (only when an export has no re-entry) ───────────┐
├ Tabs: Record checks (8) · Vehicle history (n) · Ownership ─────┤ ┌ Package panel ┐
│ active tab content                                             │ │ Activity      │
```

- **Verdict pill** (`src/lib/verdict.ts`): Checks clear · Cannot be issued ·
  Awaiting owner · Owner denied · Request expired · Authorized to issue ·
  Package issued · Escalated. Same tone map as the outcome badges.
- **Tiles**: record checks ("All 8 checks passed" or "N high-risk flags" with
  the worst check and its agencies), owner authorization (state-driven, with the
  live countdown while pending), ledger ("Blockchain certified · n events · no
  tampering detected · verified 3 minutes ago", anchored three minutes before
  the page opened and ticking). Checks and ledger tiles open their tab.
- **Sources strip**: `INTEGRATIONS` in `checks.ts`, seven agencies, green dot
  each, "Queried just now".
- **Border alert** (`BorderAlert.tsx`): shown when `openExport` is set. Names
  CBSA, the export date, port and destination, Transport Canada's missing
  re-entry, and that the MTO record alone would have shown the vehicle as
  clear.
- **Tabs** (`Tabs.tsx`): underlined tab list, arrow-key roving focus, panel
  fades in. Default tab is Record checks so the recorded landing shot is
  unchanged. Tab is `?tab=` in the URL; the default has no param.
- **Record checks rows** show agency chips (`AGENCIES` in `checks.ts`) in
  place of the grey source line. The long source name is the chip's tooltip.
- **Right rail** unchanged: package panel and activity, sticky.

## Removed

The ledger page (`/portal/vehicle/:vin/ledger`), its route, tests and the
"View ledger" button. `ledger.ts` stays: it powers the marks and the tile.
`VehicleHeader.tsx` is replaced by `VehicleSummary.tsx`. `OdometerHistory`
was already gone.

## Copy

"Package not issued" is now "Package cannot be issued" in the package panel and
the activity feed. The video cards carry the same fix separately.

## Out of scope

Video pacing, interstitials and re-recording (screenplay notes updated; the
cut is a separate task). Hosting. Override flow. Branding.

## Testing

Route tests for tab switching through the URL, the header summary, the border
story on the exported VIN, and the verdict following the session. Component
tests for `Tabs` (click, arrow keys, aria), `VehicleSummary` (tiles, sources,
click-through), `BorderAlert`, and `formatRelative`. Headless screenshots of
the clean, cloned, exported and history-tab states at 1440 wide.
