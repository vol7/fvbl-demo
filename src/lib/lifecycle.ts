import type { RegionPack } from "@/regions/types"

import { formatMonth } from "./format"
import { countryOfOrigin, openExport, sortedHistory, type Vehicle } from "./vehicles"

export type StopKind =
  | "built"
  | "entered"
  | "exported"
  | "noReentry"
  | "registered"
  | "renewed"
  | "transferred"
  | "writtenOff"
  | "secondPlate"
  | "usTitle"

export type LifecycleStop = {
  kind: StopKind
  title: string
  /** One or two short lines under the title: when, then where. */
  lines: string[]
  /** major: a milestone; minor: routine; bad: a flag; open: a gap the record cannot close. */
  tone: "major" | "minor" | "bad" | "open"
  /** Draw the link to the next stop as a broken line: what follows contradicts this stop. */
  brokenAfter?: boolean
  date: string
}

/** "4412 · Toronto" gives "Toronto"; a dealer channel gives the dealer's name. */
function officePlace(office: string): string {
  return office.split(" · ").at(-1) ?? office
}

/** "Windsor, ON" gives "Windsor"; "Port of Montréal, QC" gives "Montréal". */
function portPlace(port: string): string {
  return port.split(",")[0].replace(/^Port of /, "")
}

/**
 * The vehicle's life in a handful of stops, for the strip above the history list:
 * where it was built, border crossings, registrations and ownership changes, and the
 * records that flag it. Consecutive renewals fold into one stop; readings are left out.
 * An export with no re-entry ends on an open stop, the gap the record cannot close.
 */
export function lifecycleStops(pack: RegionPack, vehicle: Vehicle): LifecycleStop[] {
  const stops: LifecycleStop[] = [
    { kind: "built", title: "Built", lines: [countryOfOrigin(vehicle)], tone: "major", date: "" },
  ]
  const open = openExport(vehicle)
  for (const e of sortedHistory(vehicle)) {
    const when = formatMonth(e.date)
    switch (e.kind) {
      case "import":
        stops.push({
          kind: "entered",
          title: `Entered ${pack.place.country}`,
          lines: [when, portPlace(e.port)],
          tone: "major",
          date: e.date,
        })
        break
      case "export":
        stops.push({
          kind: "exported",
          title: "Exported",
          lines: [when, portPlace(e.port)],
          tone: e === open ? "bad" : "major",
          brokenAfter: e === open,
          date: e.date,
        })
        break
      case "firstRegistration":
        stops.push({
          kind: "registered",
          title: "First registration",
          lines: [when, officePlace(e.office)],
          tone: "major",
          date: e.date,
        })
        break
      case "transfer":
        stops.push({
          kind: "transferred",
          title: "Transferred",
          lines: [when, officePlace(e.office)],
          tone: "major",
          date: e.date,
        })
        break
      case "renewal": {
        const last = stops.at(-1)
        if (last?.kind === "renewed") {
          const count = Number(last.title.match(/×(\d+)/)?.[1] ?? 1) + 1
          last.title = `Renewed ×${count}`
          last.lines = [last.lines[0], when]
          last.date = e.date
        } else {
          stops.push({
            kind: "renewed",
            title: "Renewed",
            lines: [when],
            tone: "minor",
            date: e.date,
          })
        }
        break
      }
      case "customsEntry":
      case "odometer":
        break
    }
  }

  const r = vehicle.records
  const flags: LifecycleStop[] = []
  if (r.writeOff) {
    flags.push({
      kind: "writtenOff",
      title: "Written off",
      lines: [formatMonth(r.writeOff.declaredOn), r.writeOff.insurer],
      tone: "bad",
      date: r.writeOff.declaredOn,
    })
  }
  if (r.duplicateIdentity) {
    flags.push({
      kind: "secondPlate",
      title: `VIN on ${r.duplicateIdentity.plate}`,
      lines: [formatMonth(r.duplicateIdentity.since), "Second plate"],
      tone: "bad",
      date: r.duplicateIdentity.since,
    })
  }
  if (r.usTitle) {
    flags.push({
      kind: "usTitle",
      title: `Titled in ${r.usTitle.state}`,
      lines: [formatMonth(r.usTitle.issuedOn), "NMVTIS"],
      tone: "bad",
      date: r.usTitle.issuedOn,
    })
  }
  // Flags slot in by date, after any history stop on the same day.
  for (const flag of flags) {
    const at = stops.findIndex((s, i) => i > 0 && s.date > flag.date)
    stops.splice(at === -1 ? stops.length : at, 0, flag)
  }

  if (open) {
    stops.push({
      kind: "noReentry",
      title: "No re-entry",
      lines: [pack.copy.portal.timeline.notBackSince],
      tone: "open",
      date: open.date,
    })
  }
  return stops
}
