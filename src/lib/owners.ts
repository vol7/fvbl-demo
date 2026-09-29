import type { RegionPack } from "@/regions/types"

import { daysBetween, formatDate, formatDuration, formatOdometer } from "./format"
import { isDealerChannel, officeLabel } from "./ledger"
import { isOwnershipStart, openExport, sortedHistory, type Vehicle } from "./vehicles"

export type OwnerNote = {
  tone: "plain" | "warn" | "bad"
  kind: "renewed" | "exported" | "loss" | "transfer" | "usTitle" | "brand" | "otherJurisdiction"
  text: string
}

export type Ownership = {
  /** 1 for the first registered owner. */
  number: number
  current: boolean
  since: string
  until: string | null
  duration: string
  acquired: string
  office: string
  odometerAtStart: string | null
  notes: OwnerNote[]
}

const within = (date: string, since: string, until: string | null) =>
  date >= since && (until === null || date < until)

/**
 * The vehicle's chronology told per owner: each first registration or transfer opens
 * an ownership, the next one closes it. Owners carry no names here; only the current
 * owner can be revealed, and that happens in the view. Notes say what happened on
 * each owner's watch, in whole sentences.
 */
export function ownershipPeriods(pack: RegionPack, vehicle: Vehicle, today: string): Ownership[] {
  const history = sortedHistory(vehicle)
  const starts = history.filter(isOwnershipStart)
  const r = vehicle.records
  const open = openExport(vehicle)

  return starts
    .map((start, i): Ownership => {
      const until = starts[i + 1]?.date ?? null
      const reading = history.find((e) => e.kind === "odometer" && e.date === start.date)
      const notes: OwnerNote[] = []

      for (const e of history) {
        if (e.kind === "export" && within(e.date, start.date, until)) {
          notes.push({
            tone: "bad",
            kind: "exported",
            text: pack.copy.portal.ownersExported(formatDate(e.date), e === open && until === null),
          })
        }
      }
      if (r.collision && within(r.collision.occurredOn, start.date, until)) {
        const loss =
          r.writeOff && within(r.writeOff.declaredOn, start.date, until)
            ? ` ${r.writeOff.insurer} declared it a total loss on ${formatDate(r.writeOff.declaredOn)}.`
            : ""
        notes.push({
          tone: "bad",
          kind: "loss",
          text: `Collision on ${formatDate(r.collision.occurredOn)}.${loss}`,
        })
      }
      if (start.kind === "transfer" && r.writeOff && r.writeOff.declaredOn < start.date) {
        const days = daysBetween(r.writeOff.declaredOn, start.date)
        const plate =
          r.duplicateIdentity?.since === start.date
            ? ` On the same day, this VIN became active on plate ${r.duplicateIdentity.plate}.`
            : ""
        notes.push({
          tone: "warn",
          kind: "transfer",
          text: `The transfer came ${days} days after the insurer write-off.${plate}`,
        })
      }
      if (r.usTitle && within(r.usTitle.issuedOn, start.date, until)) {
        notes.push({
          tone: "bad",
          kind: "usTitle",
          text: `NMVTIS reports an active ${r.usTitle.state} title for this VIN, issued ${formatDate(r.usTitle.issuedOn)}, while it was registered to this owner.`,
        })
      }
      if (
        r.brand &&
        start.kind === "titleTransfer" &&
        start.state === r.brand.cleanTitle.state &&
        start.date === r.brand.cleanTitle.issuedOn
      ) {
        notes.push({
          tone: "bad",
          kind: "brand",
          text: `${r.brand.state} branded this vehicle ${r.brand.brand.toLowerCase()} on ${formatDate(r.brand.brandedOn)}. The ${start.state} title that opened this ownership carries no brand.`,
        })
      }
      if (r.otherJurisdiction && until === null) {
        const what = r.otherJurisdiction.kind === "registration" ? "registration" : "title"
        notes.push({
          tone: "bad",
          kind: "otherJurisdiction",
          text: `${r.otherJurisdiction.jurisdiction} reports an active ${what} for this VIN since ${formatDate(r.otherJurisdiction.since)}.`,
        })
      }
      if (notes.length === 0) {
        const renewals = history.filter(
          (e) => e.kind === "renewal" && within(e.date, start.date, until)
        )
        const last = renewals.at(-1)
        if (last) {
          notes.push({
            tone: "plain",
            kind: "renewed",
            text:
              renewals.length === 1
                ? `Renewed on ${formatDate(last.date)}.`
                : `Renewed ${renewals.length} times, most recently on ${formatDate(last.date)}.`,
          })
        }
      }

      return {
        number: i + 1,
        current: until === null,
        since: start.date,
        until,
        duration: formatDuration(start.date, until ?? today),
        acquired:
          start.kind === "transfer" || start.kind === "titleTransfer"
            ? "Transfer"
            : isDealerChannel(start.office)
              ? "New, dealer submission"
              : "New vehicle",
        office: officeLabel(start.office),
        odometerAtStart:
          reading?.kind === "odometer" ? formatOdometer(reading.reading, pack.odometerUnit) : null,
        notes,
      }
    })
    .reverse()
}
