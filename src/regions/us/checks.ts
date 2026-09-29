import type { CheckDefinition, CheckId, CheckStatus } from "@/lib/checks"
import { formatDate, formatOdometer } from "@/lib/format"
import {
  odometerEvents,
  openExport,
  sortedHistory,
  type OdometerEvent,
  type Vehicle,
} from "@/lib/vehicles"

/** The checks an Ohio title counter runs, in display order (US plan, Task 6). */
type UsCheckId = Extract<
  CheckId,
  | "border"
  | "decode"
  | "stolen"
  | "nmvtis"
  | "otherJurisdiction"
  | "brand"
  | "odometer"
  | "lien"
  | "ownerConfirmed"
>

type Outcome = { status: CheckStatus; result: string; detail?: string }

const pass = (result: string, detail?: string): Outcome => ({ status: "pass", result, detail })
const fail = (result: string, detail?: string): Outcome => ({ status: "fail", result, detail })

/** The most recent title on the vehicle's record, first or on a transfer. */
export function latestTitle(vehicle: Vehicle) {
  return sortedHistory(vehicle)
    .filter((e) => e.kind === "firstTitle" || e.kind === "titleTransfer")
    .at(-1)
}

function describe(v: { year: number; make: string; model: string; bodyStyle: string }): string {
  return `${v.year} ${v.make} ${v.model} ${v.bodyStyle}`
}

function odometerCheck(readings: OdometerEvent[]): Outcome {
  const mi = (value: number) => formatOdometer(value, "mi")
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1]
    const curr = readings[i]
    if (curr.reading < prev.reading) {
      return fail(
        "Rolled back",
        `${mi(prev.reading)} on ${formatDate(prev.date)}, then ${mi(curr.reading)} on ${formatDate(curr.date)}`
      )
    }
  }
  const last = readings.at(-1)
  if (!last) return pass("No readings on file yet")
  return pass(
    "Consistent",
    `${readings.length} ${readings.length === 1 ? "reading" : "readings"}, last ${mi(last.reading)} on ${formatDate(last.date)}`
  )
}

const DEFINITIONS: Record<UsCheckId, Omit<CheckDefinition, "id">> = {
  border: {
    label: "Import and export record",
    severity: "high",
    source: "CBP · US Customs and Border Protection export records",
    agencies: ["CBP"],
    evaluate: (vehicle) => {
      const exported = openExport(vehicle)
      return exported
        ? fail(
            "Export reported, no re-entry",
            `Reported exported through ${exported.port} on ${formatDate(exported.date)}`
          )
        : pass("No export reported")
    },
  },
  decode: {
    label: "VIN decode match",
    severity: "high",
    source: "NHTSA vPIC · the title application",
    agencies: ["NHTSA"],
    evaluate: (vehicle) => {
      const d = vehicle.decoded
      const matches =
        d.year === vehicle.year &&
        d.make === vehicle.make &&
        d.model === vehicle.model &&
        d.bodyStyle === vehicle.bodyStyle
      return matches
        ? pass("Matches the application", `Decodes to ${describe(d)}`)
        : fail(
            "Does not match the application",
            `Decodes to ${describe(d)}, the application says ${describe(vehicle)}`
          )
    },
  },
  stolen: {
    label: "Stolen vehicle report",
    severity: "high",
    source: "NICB · National Insurance Crime Bureau",
    agencies: ["NICB"],
    evaluate: ({ records: r }) =>
      r.stolenReport
        ? fail(
            "Reported stolen",
            `${r.stolenReport.agency}, ${formatDate(r.stolenReport.reportedOn)}`
          )
        : pass("No stolen report"),
  },
  // FVBL sits alongside the NMVTIS check the clerk already runs, never in place of
  // it: a brand NMVTIS reports shows here too.
  nmvtis: {
    label: "NMVTIS title check",
    severity: "high",
    source: "NMVTIS · National Motor Vehicle Title Information System",
    agencies: ["NMVTIS"],
    evaluate: (vehicle) => {
      const brand = vehicle.records.brand
      if (brand) {
        return fail(
          `${brand.brand} brand reported`,
          `${brand.state}, ${formatDate(brand.brandedOn)}`
        )
      }
      const title = latestTitle(vehicle)
      return pass(
        "No brand or theft reported",
        title ? `Current title: ${title.state}, ${formatDate(title.date)}` : undefined
      )
    },
  },
  otherJurisdiction: {
    label: "Title or registration elsewhere",
    severity: "high",
    source: "FVBL ledger · participating states and Ontario",
    agencies: ["FVBL ledger"],
    evaluate: ({ records: r }) => {
      const other = r.otherJurisdiction
      return other
        ? fail(
            `Active ${other.jurisdiction} ${other.kind}`,
            `${other.kind === "registration" ? "Registered" : "Titled"} in ${other.jurisdiction} since ${formatDate(other.since)}`
          )
        : pass("No active title in another state or Canada")
    },
  },
  brand: {
    label: "Title brand history",
    severity: "high",
    source: "NMVTIS · the branding state's record on the FVBL ledger",
    agencies: ["NMVTIS", "FVBL ledger"],
    evaluate: ({ records: r }) =>
      r.brand
        ? fail(
            `${r.brand.brand} brand not carried forward`,
            `${r.brand.state} ${r.brand.brand.toLowerCase()} title ${formatDate(r.brand.brandedOn)}, then a clean ${r.brand.cleanTitle.state} title ${formatDate(r.brand.cleanTitle.issuedOn)}`
          )
        : pass("No brand on record"),
  },
  odometer: {
    label: "Odometer consistency",
    severity: "low",
    source: "Odometer disclosures on each title",
    agencies: ["Ohio titles"],
    evaluate: (vehicle) => odometerCheck(odometerEvents(vehicle)),
  },
  lien: {
    label: "Lien on title",
    severity: "low",
    source: "The current title record",
    agencies: ["Ohio titles"],
    evaluate: ({ records: r }) =>
      r.lien
        ? fail("Lien on the title", `${r.lien.holder}, noted ${formatDate(r.lien.registeredOn)}`)
        : pass("No lien on the title"),
  },
  // Evidence, not a gate: shown when the owner answered, left out otherwise.
  ownerConfirmed: {
    label: "Owner confirmed the sale",
    severity: "high",
    source: "Ohio title alert · the registered owner's answer",
    agencies: ["Title alert"],
    evaluate: (_vehicle, { authorization: a }) => {
      if (a?.status === "authorized") {
        return pass("Owner confirmed", `From the title alert, ${formatDate(a.approvedAt.slice(0, 10))}`)
      }
      if (a?.status === "frozen" && a.reason === "denied") {
        return fail("Owner answered “Not me”", `From the title alert, ${formatDate(a.frozenAt.slice(0, 10))}`)
      }
      return null
    },
  },
}

const ORDER: UsCheckId[] = [
  "border",
  "decode",
  "stolen",
  "nmvtis",
  "otherJurisdiction",
  "brand",
  "odometer",
  "lien",
  "ownerConfirmed",
]

export const CHECKS: CheckDefinition[] = ORDER.map((id) => ({ id, ...DEFINITIONS[id] }))

/** Every source the portal consults, in the order the header lists them. */
export const INTEGRATIONS: { name: string; detail: string }[] = [
  { name: "CBP", detail: "US Customs and Border Protection export records" },
  { name: "NHTSA", detail: "VIN decoder (vPIC)" },
  { name: "NICB", detail: "National Insurance Crime Bureau" },
  { name: "NMVTIS", detail: "Federal title records, all states" },
  { name: "Ohio titles", detail: "Statewide title records, all 88 counties" },
  { name: "FVBL ledger", detail: "Records from participating states and Ontario" },
]
