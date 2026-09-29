import { formatDate, formatOdometer } from "./format"
import { odometerEvents, openExport, type OdometerEvent, type Vehicle } from "./vehicles"

export type CheckId =
  | "border"
  | "decode"
  | "stolen"
  | "writeOff"
  | "duplicate"
  | "usTitle"
  | "collision"
  | "odometer"
  | "lien"

export type CheckStatus = "pass" | "fail"

/**
 * How much weight a failure carries. Displayed only in this round: any failure
 * blocks the package. The split is the shape of the future override rule
 * (low may be acknowledged by the clerk, high never).
 */
export type Severity = "high" | "low"

export type Check = {
  id: CheckId
  label: string
  status: CheckStatus
  severity: Severity
  /** The condition in a few words ("No export reported"), set heavier than the detail. */
  result: string
  /** The evidence behind the result. Empty when the result says it all. */
  detail: string
  source: string
  /** Short agency names shown as chips on the row. */
  agencies: string[]
}

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

export const SOURCES: Record<CheckId, string> = {
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
export const AGENCIES: Record<CheckId, string[]> = {
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

export const SEVERITY: Record<CheckId, Severity> = {
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

function check(id: CheckId, status: CheckStatus, result: string, detail = ""): Check {
  return {
    id,
    label: LABELS[id],
    status,
    severity: SEVERITY[id],
    result,
    detail,
    source: SOURCES[id],
    agencies: AGENCIES[id],
  }
}

function borderCheck(vehicle: Vehicle): Check {
  const exported = openExport(vehicle)
  if (exported) {
    return check(
      "border",
      "fail",
      "Export reported, no re-entry",
      `Reported exported through ${exported.port} on ${formatDate(exported.date)}`
    )
  }
  const entry = vehicle.history.filter((e) => e.kind === "import").at(-1)
  return entry
    ? check(
        "border",
        "pass",
        "No export reported",
        `Entered Canada ${formatDate(entry.date)} via ${entry.port}`
      )
    : check("border", "pass", "No border activity")
}

function describe(v: { year: number; make: string; model: string; bodyStyle: string }): string {
  return `${v.year} ${v.make} ${v.model} ${v.bodyStyle}`
}

function decodeCheck(vehicle: Vehicle): Check {
  const d = vehicle.decoded
  const matches =
    d.year === vehicle.year &&
    d.make === vehicle.make &&
    d.model === vehicle.model &&
    d.bodyStyle === vehicle.bodyStyle
  return matches
    ? check("decode", "pass", "Matches MTO record", `Decodes to ${describe(d)}`)
    : check(
        "decode",
        "fail",
        "Does not match MTO record",
        `Decodes to ${describe(d)}, MTO record says ${describe(vehicle)}`
      )
}

function odometerCheck(readings: OdometerEvent[]): Check {
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1]
    const curr = readings[i]
    if (curr.km < prev.km) {
      return check(
        "odometer",
        "fail",
        "Rolled back",
        `${formatOdometer(prev.km)} on ${formatDate(prev.date)}, then ${formatOdometer(curr.km)} on ${formatDate(curr.date)}`
      )
    }
  }
  const last = readings.at(-1)
  if (!last) return check("odometer", "pass", "No readings on file yet")
  return check(
    "odometer",
    "pass",
    "Consistent",
    `${readings.length} ${readings.length === 1 ? "reading" : "readings"}, last ${formatOdometer(last.km)} on ${formatDate(last.date)}`
  )
}

function evaluateOne(id: CheckId, vehicle: Vehicle): Check {
  const r = vehicle.records
  switch (id) {
    case "border":
      return borderCheck(vehicle)
    case "decode":
      return decodeCheck(vehicle)
    case "stolen":
      return r.stolenReport
        ? check(
            "stolen",
            "fail",
            "Reported stolen",
            `${r.stolenReport.agency}, ${formatDate(r.stolenReport.reportedOn)}`
          )
        : check("stolen", "pass", "No stolen report")
    case "writeOff":
      return r.writeOff
        ? check(
            "writeOff",
            "fail",
            "Declared a total loss",
            `${r.writeOff.insurer}, ${formatDate(r.writeOff.declaredOn)}`
          )
        : check("writeOff", "pass", "No total loss on file")
    case "duplicate":
      return r.duplicateIdentity
        ? check(
            "duplicate",
            "fail",
            "VIN on a second plate",
            `Also on Ontario plate ${r.duplicateIdentity.plate} since ${formatDate(r.duplicateIdentity.since)}`
          )
        : check("duplicate", "pass", "Single registration", "VIN and plate match one record")
    case "usTitle":
      return r.usTitle
        ? check(
            "usTitle",
            "fail",
            "Active US title",
            `Active ${r.usTitle.state} title, issued ${formatDate(r.usTitle.issuedOn)}`
          )
        : check("usTitle", "pass", "No US title", "No active title in any state")
    case "collision":
      return r.collision
        ? check(
            "collision",
            "fail",
            "Collision reported",
            `${r.collision.severity} on ${r.collision.location}, ${formatDate(r.collision.occurredOn)}`
          )
        : check("collision", "pass", "No collision reported")
    case "odometer":
      return odometerCheck(odometerEvents(vehicle))
    case "lien":
      return r.lien
        ? check(
            "lien",
            "fail",
            "Active lien",
            `${r.lien.holder}, registered ${formatDate(r.lien.registeredOn)}`
          )
        : check("lien", "pass", "No lien registered")
  }
}

/** All checks, failures first (high before low), then passes in display order. */
export function evaluateChecks(vehicle: Vehicle): Check[] {
  const all = ORDER.map((id) => evaluateOne(id, vehicle))
  const rank = (c: Check) => (c.status === "fail" ? (c.severity === "high" ? 0 : 1) : 2)
  return all
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i)
    .map(({ c }) => c)
}

export function allPass(checks: Check[]): boolean {
  return checks.every((c) => c.status === "pass")
}

export function failingChecks(checks: Check[]): Check[] {
  return checks.filter((c) => c.status === "fail")
}

export function highRiskChecks(checks: Check[]): Check[] {
  return failingChecks(checks).filter((c) => c.severity === "high")
}
