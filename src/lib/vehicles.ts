import { normalizeVin } from "./format"
import { FIRST_OWNER } from "./people"
import type { RegistrationState } from "./registration"

export type Agency = "Transport Canada" | "CBSA" | "MTO" | "Insurer" | "Dealer"

/**
 * One dated fact about the vehicle from one agency. Together they are the
 * vehicle's chronology across Transport Canada, CBSA and the MTO. No names:
 * transfers carry the office, never the people.
 */
export type VehicleEvent =
  | { kind: "import"; date: string; agency: "Transport Canada"; port: string; detail: string }
  | { kind: "customsEntry"; date: string; agency: "CBSA"; port: string }
  | { kind: "export"; date: string; agency: "CBSA"; port: string; destination: string }
  | { kind: "firstRegistration"; date: string; agency: "MTO"; office: string }
  | { kind: "transfer"; date: string; agency: "MTO"; office: string }
  | { kind: "renewal"; date: string; agency: "MTO"; office: string }
  | { kind: "odometer"; date: string; agency: Agency; km: number; source: string }

export type EventKind = VehicleEvent["kind"]

export type OdometerEvent = Extract<VehicleEvent, { kind: "odometer" }>
export type BorderEvent = Extract<VehicleEvent, { kind: "import" | "customsEntry" | "export" }>

export const MILESTONES: ReadonlySet<EventKind> = new Set<EventKind>([
  "import",
  "customsEntry",
  "export",
  "firstRegistration",
  "transfer",
])

export type VehicleRecords = {
  stolenReport: { reportedOn: string; agency: string } | null
  writeOff: { insurer: string; declaredOn: string; reason: string } | null
  collision: { occurredOn: string; location: string; severity: string } | null
  duplicateIdentity: { detail: string } | null
  lien: { holder: string; registeredOn: string } | null
}

/** What the VIN itself says the vehicle is (stand-in for the NHTSA vPIC decode). */
export type DecodedVin = {
  year: number
  make: string
  model: string
  bodyStyle: string
  plant: string
}

export type Vehicle = {
  vin: string
  year: number
  make: string
  model: string
  trim: string
  colour: string
  bodyStyle: string
  /** Null until the ministry records a first registration. */
  plate: string | null
  registeredOn: string | null
  odometerKm: number
  owner: { name: string; phoneLast4: string; city: string }
  /** Null until the vehicle has been inspected once. */
  lastInspection: string | null
  riskTier: "high-value" | "standard"
  records: VehicleRecords
  decoded: DecodedVin
  history: VehicleEvent[]
}

export const CLEAN_VIN = "4JGFB8KB5PA812634"
export const CLONED_VIN = "5TDEBRCH7SS041927"
export const EXPORTED_VIN = "SALWR2SE4NA209311"
/** Brand new: decodes, but has no registration until a dealer submits one. */
export const NEW_VIN = "4JGFF5KE9SB412009"

export const DEMO_VEHICLES: Vehicle[] = [
  {
    vin: CLEAN_VIN,
    year: 2023,
    make: "Mercedes-AMG",
    model: "GLE 63 S",
    trim: "4MATIC+",
    colour: "Obsidian Black",
    bodyStyle: "SUV",
    plate: "CKXR 214",
    registeredOn: "2023-04-18",
    odometerKm: 31240,
    owner: { name: "Daniel Okafor", phoneLast4: "0917", city: "Toronto, ON" },
    lastInspection: "2025-04-11",
    riskTier: "high-value",
    records: {
      stolenReport: null,
      writeOff: null,
      collision: null,
      duplicateIdentity: null,
      lien: null,
    },
    decoded: {
      year: 2023,
      make: "Mercedes-AMG",
      model: "GLE 63 S",
      bodyStyle: "SUV",
      plant: "Tuscaloosa, Alabama, USA",
    },
    history: [
      {
        kind: "import",
        date: "2023-02-27",
        agency: "Transport Canada",
        port: "Windsor, ON",
        detail: "Registrar of Imported Vehicles · new vehicle",
      },
      { kind: "customsEntry", date: "2023-02-27", agency: "CBSA", port: "Windsor, ON" },
      { kind: "firstRegistration", date: "2023-04-18", agency: "MTO", office: "4412 · Toronto" },
      { kind: "odometer", date: "2023-04-18", agency: "Dealer", km: 42, source: "Dealer delivery" },
      {
        kind: "odometer",
        date: "2024-05-02",
        agency: "Dealer",
        km: 14880,
        source: "Service record",
      },
      { kind: "renewal", date: "2025-04-11", agency: "MTO", office: "4412 · Toronto" },
      {
        kind: "odometer",
        date: "2025-04-11",
        agency: "MTO",
        km: 31240,
        source: "Registration renewal",
      },
    ],
  },
  {
    vin: CLONED_VIN,
    year: 2025,
    make: "Toyota",
    model: "Highlander",
    trim: "Platinum",
    colour: "Wind Chill Pearl",
    bodyStyle: "SUV",
    plate: "BWTP 903",
    registeredOn: "2025-02-03",
    odometerKm: 8410,
    owner: { name: "Priya Raghunathan", phoneLast4: "5528", city: "Whitby, ON" },
    lastInspection: "2025-08-20",
    riskTier: "high-value",
    records: {
      stolenReport: null,
      writeOff: {
        insurer: "Aviva Canada",
        declaredOn: "2025-06-14",
        reason: "Total loss following collision",
      },
      collision: {
        occurredOn: "2025-06-12",
        location: "Hwy 401 near Whitby, ON",
        severity: "Severe — airbag deployment",
      },
      duplicateIdentity: {
        detail: "Same VIN active on Ontario plate CRHM 118 since August 20, 2025",
      },
      lien: null,
    },
    decoded: {
      year: 2025,
      make: "Toyota",
      model: "Highlander",
      bodyStyle: "SUV",
      plant: "Princeton, Indiana, USA",
    },
    history: [
      {
        kind: "import",
        date: "2025-01-16",
        agency: "Transport Canada",
        port: "Sarnia, ON",
        detail: "Registrar of Imported Vehicles · new vehicle",
      },
      { kind: "customsEntry", date: "2025-01-16", agency: "CBSA", port: "Sarnia, ON" },
      { kind: "firstRegistration", date: "2025-02-03", agency: "MTO", office: "4603 · Whitby" },
      { kind: "odometer", date: "2025-02-03", agency: "Dealer", km: 12, source: "Dealer delivery" },
      {
        kind: "odometer",
        date: "2025-06-12",
        agency: "Insurer",
        km: 6200,
        source: "Collision report",
      },
      { kind: "transfer", date: "2025-08-20", agency: "MTO", office: "4419 · Scarborough" },
      { kind: "odometer", date: "2025-08-20", agency: "MTO", km: 8410, source: "Registration" },
    ],
  },
  {
    vin: EXPORTED_VIN,
    year: 2022,
    make: "Land Rover",
    model: "Range Rover Sport",
    trim: "HSE Dynamic",
    colour: "Santorini Black",
    bodyStyle: "SUV",
    plate: "CPLR 482",
    registeredOn: "2022-01-14",
    odometerKm: 47310,
    owner: { name: "Amara Chen", phoneLast4: "2286", city: "Mississauga, ON" },
    lastInspection: "2025-01-09",
    riskTier: "high-value",
    records: {
      stolenReport: null,
      writeOff: null,
      collision: null,
      duplicateIdentity: null,
      lien: null,
    },
    decoded: {
      year: 2022,
      make: "Land Rover",
      model: "Range Rover Sport",
      bodyStyle: "SUV",
      plant: "Solihull, England, UK",
    },
    history: [
      {
        kind: "import",
        date: "2021-11-22",
        agency: "Transport Canada",
        port: "Halifax, NS",
        detail: "Registrar of Imported Vehicles · new vehicle",
      },
      { kind: "customsEntry", date: "2021-11-22", agency: "CBSA", port: "Halifax, NS" },
      {
        kind: "firstRegistration",
        date: "2022-01-14",
        agency: "MTO",
        office: "4507 · Mississauga",
      },
      { kind: "odometer", date: "2022-01-14", agency: "Dealer", km: 28, source: "Dealer delivery" },
      {
        kind: "odometer",
        date: "2023-01-10",
        agency: "Dealer",
        km: 19640,
        source: "Service record",
      },
      { kind: "renewal", date: "2024-01-11", agency: "MTO", office: "4507 · Mississauga" },
      {
        kind: "odometer",
        date: "2024-01-11",
        agency: "MTO",
        km: 33970,
        source: "Registration renewal",
      },
      { kind: "renewal", date: "2025-01-09", agency: "MTO", office: "4507 · Mississauga" },
      {
        kind: "odometer",
        date: "2025-01-09",
        agency: "MTO",
        km: 47310,
        source: "Registration renewal",
      },
      {
        kind: "export",
        date: "2025-03-18",
        agency: "CBSA",
        port: "Port of Montréal, QC",
        destination: "Lagos, Nigeria",
      },
    ],
  },
  {
    vin: NEW_VIN,
    year: 2026,
    make: "Mercedes-Benz",
    model: "GLE 450",
    trim: "4MATIC",
    colour: "Obsidian Black",
    bodyStyle: "SUV",
    plate: null,
    registeredOn: null,
    odometerKm: 0,
    owner: { name: FIRST_OWNER.name, phoneLast4: FIRST_OWNER.mobileLast4, city: "Toronto, ON" },
    lastInspection: null,
    riskTier: "high-value",
    records: {
      stolenReport: null,
      writeOff: null,
      collision: null,
      duplicateIdentity: null,
      lien: null,
    },
    decoded: {
      year: 2026,
      make: "Mercedes-Benz",
      model: "GLE 450",
      bodyStyle: "SUV",
      plant: "Tuscaloosa, Alabama, USA",
    },
    history: [],
  },
]

export function findVehicle(vin: string): Vehicle | undefined {
  const needle = normalizeVin(vin)
  return DEMO_VEHICLES.find((v) => v.vin === needle)
}

/**
 * The vehicle as the registry sees it. For a registered newborn, the dealer's
 * submission becomes the first two history events; for everything else this is
 * the identity, so authored vehicles never shift.
 */
export function bornVehicle(vehicle: Vehicle, registration: RegistrationState): Vehicle {
  if (registration.status !== "registered" || vehicle.history.length > 0) return vehicle
  const date = registration.registeredAt.slice(0, 10)
  return {
    ...vehicle,
    registeredOn: date,
    odometerKm: registration.deliveryKm,
    history: [
      { kind: "firstRegistration", date, agency: "MTO", office: registration.office },
      {
        kind: "odometer",
        date,
        agency: "Dealer",
        km: registration.deliveryKm,
        source: "Dealer delivery",
      },
    ],
  }
}

export function vehicleTitle(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
}

/** Events sorted oldest first. Ties keep the authored order. */
export function sortedHistory(vehicle: Vehicle): VehicleEvent[] {
  return [...vehicle.history].sort((a, b) => a.date.localeCompare(b.date))
}

export function odometerEvents(vehicle: Vehicle): OdometerEvent[] {
  return sortedHistory(vehicle).filter((e): e is OdometerEvent => e.kind === "odometer")
}

export function borderEvents(vehicle: Vehicle): BorderEvent[] {
  return sortedHistory(vehicle).filter(
    (e): e is BorderEvent => e.kind === "import" || e.kind === "customsEntry" || e.kind === "export"
  )
}

/** The export that has not been followed by a re-entry, if any. */
export function openExport(vehicle: Vehicle): Extract<VehicleEvent, { kind: "export" }> | null {
  const last = borderEvents(vehicle).at(-1)
  return last?.kind === "export" ? last : null
}
