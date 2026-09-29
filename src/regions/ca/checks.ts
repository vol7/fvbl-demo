import type { CheckDefinition, CheckId, CheckStatus, Severity } from "@/lib/checks"
import { formatDate, formatOdometer } from "@/lib/format"
import { odometerEvents, openExport, type OdometerEvent, type Vehicle } from "@/lib/vehicles"

const LABELS: Record<CheckId, string> = {
  border: "Import and export record",
  decode: "VIN decode match",
  stolen: "Stolen vehicle report",
  writeOff: "Insurer write-off",
  duplicate: "Duplicate identity",
  usTitle: "US title record",
  collision: "Collision record",
  odometer: "Odometer consistency",
  lien: "Active lien",
}

const SOURCES: Record<CheckId, string> = {
  border: "Transport Canada RIV · CBSA",
  decode: "NHTSA vPIC · MTO vehicle registry",
  stolen: "CPIC · Canadian Police Information Centre",
  writeOff: "Insurance Bureau of Canada · Carfax Canada",
  duplicate: "MTO vehicle registry",
  usTitle: "NMVTIS · US National Motor Vehicle Title Information System",
  collision: "Ontario collision reporting · Carfax Canada",
  odometer: "MTO registration history",
  lien: "Ontario PPSR",
}

/** Chips on each row. Short names; the long form is in SOURCES. */
const AGENCIES: Record<CheckId, string[]> = {
  border: ["Transport Canada", "CBSA"],
  decode: ["NHTSA", "MTO"],
  stolen: ["CPIC"],
  writeOff: ["IBC", "Carfax"],
  duplicate: ["MTO"],
  usTitle: ["NMVTIS"],
  collision: ["MTO", "Carfax"],
  odometer: ["MTO"],
  lien: ["PPSR"],
}

/** Every integration the portal consults, in the order the header lists them. */
export const INTEGRATIONS: { name: string; detail: string }[] = [
  { name: "Transport Canada", detail: "Registrar of Imported Vehicles" },
  { name: "CBSA", detail: "Canada Border Services Agency" },
  { name: "MTO", detail: "Ontario vehicle registry" },
  { name: "CPIC", detail: "Canadian Police Information Centre" },
  { name: "IBC", detail: "Insurance Bureau of Canada" },
  { name: "Carfax", detail: "Carfax Canada vehicle history reports" },
  { name: "NHTSA", detail: "VIN decoder (vPIC)" },
  { name: "NMVTIS", detail: "US federal title records, all states" },
  { name: "PPSR", detail: "Ontario Personal Property Security Registration" },
]

const SEVERITY: Record<CheckId, Severity> = {
  border: "high",
  decode: "high",
  stolen: "high",
  writeOff: "high",
  duplicate: "high",
  usTitle: "high",
  collision: "low",
  odometer: "low",
  lien: "low",
}

type Outcome = { status: CheckStatus; result: string; detail?: string }

const pass = (result: string, detail?: string): Outcome => ({ status: "pass", result, detail })
const fail = (result: string, detail?: string): Outcome => ({ status: "fail", result, detail })

function borderCheck(vehicle: Vehicle): Outcome {
  const exported = openExport(vehicle)
  if (exported) {
    return fail(
      "Export reported, no re-entry",
      `Reported exported through ${exported.port} on ${formatDate(exported.date)}`
    )
  }
  const entry = vehicle.history.filter((e) => e.kind === "import").at(-1)
  return entry
    ? pass("No export reported", `Entered Canada ${formatDate(entry.date)} via ${entry.port}`)
    : pass("No border activity")
}

function describe(v: { year: number; make: string; model: string; bodyStyle: string }): string {
  return `${v.year} ${v.make} ${v.model} ${v.bodyStyle}`
}

function decodeCheck(vehicle: Vehicle): Outcome {
  const d = vehicle.decoded
  const matches =
    d.year === vehicle.year &&
    d.make === vehicle.make &&
    d.model === vehicle.model &&
    d.bodyStyle === vehicle.bodyStyle
  return matches
    ? pass("Matches MTO record", `Decodes to ${describe(d)}`)
    : fail(
        "Does not match MTO record",
        `Decodes to ${describe(d)}, MTO record says ${describe(vehicle)}`
      )
}

function odometerCheck(readings: OdometerEvent[]): Outcome {
  const km = (value: number) => formatOdometer(value, "km")
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1]
    const curr = readings[i]
    if (curr.reading < prev.reading) {
      return fail(
        "Rolled back",
        `${km(prev.reading)} on ${formatDate(prev.date)}, then ${km(curr.reading)} on ${formatDate(curr.date)}`
      )
    }
  }
  const last = readings.at(-1)
  if (!last) return pass("No readings on file yet")
  return pass(
    "Consistent",
    `${readings.length} ${readings.length === 1 ? "reading" : "readings"}, last ${km(last.reading)} on ${formatDate(last.date)}`
  )
}

const EVALUATE: Record<CheckId, (vehicle: Vehicle) => Outcome> = {
  border: borderCheck,
  decode: decodeCheck,
  stolen: ({ records: r }) =>
    r.stolenReport
      ? fail(
          "Reported stolen",
          `${r.stolenReport.agency}, ${formatDate(r.stolenReport.reportedOn)}`
        )
      : pass("No stolen report"),
  writeOff: ({ records: r }) =>
    r.writeOff
      ? fail("Declared a total loss", `${r.writeOff.insurer}, ${formatDate(r.writeOff.declaredOn)}`)
      : pass("No total loss on file"),
  duplicate: ({ records: r }) =>
    r.duplicateIdentity
      ? fail(
          "VIN on a second plate",
          `Also on Ontario plate ${r.duplicateIdentity.plate} since ${formatDate(r.duplicateIdentity.since)}`
        )
      : pass("Single registration", "VIN and plate match one record"),
  usTitle: ({ records: r }) =>
    r.usTitle
      ? fail(
          "Active US title",
          `Active ${r.usTitle.state} title, issued ${formatDate(r.usTitle.issuedOn)}`
        )
      : pass("No US title", "No active title in any state"),
  collision: ({ records: r }) =>
    r.collision
      ? fail(
          "Collision reported",
          `${r.collision.severity} on ${r.collision.location}, ${formatDate(r.collision.occurredOn)}`
        )
      : pass("No collision reported"),
  odometer: (vehicle) => odometerCheck(odometerEvents(vehicle)),
  lien: ({ records: r }) =>
    r.lien
      ? fail("Active lien", `${r.lien.holder}, registered ${formatDate(r.lien.registeredOn)}`)
      : pass("No lien registered"),
}

/** Display order when nothing fails. Failures are pulled to the front. */
const ORDER: CheckId[] = [
  "border",
  "decode",
  "stolen",
  "writeOff",
  "duplicate",
  "usTitle",
  "collision",
  "odometer",
  "lien",
]

export const CHECKS: CheckDefinition[] = ORDER.map((id) => ({
  id,
  label: LABELS[id],
  severity: SEVERITY[id],
  source: SOURCES[id],
  agencies: AGENCIES[id],
  evaluate: EVALUATE[id],
}))
