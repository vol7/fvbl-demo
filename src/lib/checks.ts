import { formatDate, formatOdometer } from "./format"
import { odometerEvents, openExport, type OdometerEvent, type Vehicle } from "./vehicles"

export type CheckId =
  "border" | "decode" | "stolen" | "writeOff" | "duplicate" | "collision" | "odometer" | "lien"

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
  collision: "Collision record",
  odometer: "Odometer consistency",
  lien: "Active lien",
}

export const SOURCES: Record<CheckId, string> = {
  border: "Transport Canada RIV · CBSA",
  decode: "NHTSA vPIC · MTO vehicle registry",
  stolen: "CPIC · Canadian Police Information Centre",
  writeOff: "Insurance Bureau of Canada",
  duplicate: "MTO vehicle registry",
  collision: "Ontario collision reporting",
  odometer: "MTO registration history",
  lien: "Ontario PPSR",
}

/** Chips on each row. Short names; the long form is in SOURCES. */
export const AGENCIES: Record<CheckId, string[]> = {
  border: ["Transport Canada", "CBSA"],
  decode: ["NHTSA", "MTO"],
  stolen: ["CPIC"],
  writeOff: ["IBC"],
  duplicate: ["MTO"],
  collision: ["MTO"],
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
  { name: "NHTSA", detail: "VIN decoder (vPIC)" },
  { name: "PPSR", detail: "Ontario Personal Property Security Registration" },
]

export const SEVERITY: Record<CheckId, Severity> = {
  border: "high",
  decode: "high",
  stolen: "high",
  writeOff: "high",
  duplicate: "high",
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
  "collision",
  "odometer",
  "lien",
]

function check(id: CheckId, status: CheckStatus, detail: string): Check {
  return {
    id,
    label: LABELS[id],
    status,
    severity: SEVERITY[id],
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
      `A vehicle carrying this VIN was exported ${formatDate(exported.date)} via ${exported.port} · no re-entry on record`
    )
  }
  const entry = vehicle.history.find((e) => e.kind === "import")
  return check(
    "border",
    "pass",
    entry
      ? `Entered Canada ${formatDate(entry.date)} via ${entry.port} · no export on record`
      : "No border activity on record"
  )
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
    ? check("decode", "pass", `Decodes to ${describe(d)} · matches MTO record`)
    : check("decode", "fail", `Decodes to ${describe(d)} · MTO record says ${describe(vehicle)}`)
}

function odometerCheck(readings: OdometerEvent[]): Check {
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1]
    const curr = readings[i]
    if (curr.km < prev.km) {
      return check(
        "odometer",
        "fail",
        `Rollback: ${formatOdometer(prev.km)} on ${formatDate(prev.date)}, then ${formatOdometer(curr.km)} on ${formatDate(curr.date)}`
      )
    }
  }
  const last = readings.at(-1)
  if (!last) return check("odometer", "pass", "No readings on file yet")
  return check(
    "odometer",
    "pass",
    `${readings.length} readings, consistent · last ${formatOdometer(last.km)} on ${formatDate(last.date)}`
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
            `Reported stolen ${formatDate(r.stolenReport.reportedOn)} · ${r.stolenReport.agency}`
          )
        : check("stolen", "pass", "No active report on CPIC")
    case "writeOff":
      return r.writeOff
        ? check(
            "writeOff",
            "fail",
            `${r.writeOff.reason} · ${r.writeOff.insurer}, ${formatDate(r.writeOff.declaredOn)}`
          )
        : check("writeOff", "pass", "No total-loss declaration on file")
    case "duplicate":
      return r.duplicateIdentity
        ? check("duplicate", "fail", r.duplicateIdentity.detail)
        : check("duplicate", "pass", "VIN and plate match a single registration")
    case "collision":
      return r.collision
        ? check(
            "collision",
            "fail",
            `${r.collision.severity} · ${r.collision.location}, ${formatDate(r.collision.occurredOn)}`
          )
        : check("collision", "pass", "No collision reported")
    case "odometer":
      return odometerCheck(odometerEvents(vehicle))
    case "lien":
      return r.lien
        ? check("lien", "fail", `${r.lien.holder} · registered ${formatDate(r.lien.registeredOn)}`)
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
