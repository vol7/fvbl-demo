import type { RegionPack } from "@/regions/types"

import { normalizeVin } from "./format"
import type { RegistrationState } from "./registration"

/**
 * The registry that owns the record, per region: the MTO in Ontario; in Ohio the
 * county clerks title vehicles and the BMV registers them.
 */
export type RegistryAgency = "MTO" | "County clerk" | "Ohio BMV"

export type Agency =
  | "Transport Canada"
  | "CBSA"
  | "CBP"
  | "NMVTIS"
  | RegistryAgency
  /** Another US state's title or registration office. */
  | "State registry"
  | "Insurer"
  | "Dealer"

/**
 * One dated fact about the vehicle from one agency. Together they are the
 * vehicle's chronology across border agencies and the registry. No names:
 * transfers carry the office, never the people.
 */
export type VehicleEvent =
  | {
      kind: "import"
      date: string
      agency: "Transport Canada"
      port: string
      /** The country the vehicle arrived from. */
      from: string
      detail: string
    }
  | { kind: "customsEntry"; date: string; agency: "CBSA"; port: string }
  | { kind: "export"; date: string; agency: "CBSA" | "CBP"; port: string }
  | { kind: "firstRegistration"; date: string; agency: RegistryAgency; office: string }
  /**
   * A US title, first or on a transfer. `office` is the titling office ("Franklin
   * County, Ohio" or a dealer channel); `state` is the state that issued it.
   */
  | { kind: "firstTitle"; date: string; agency: TitleAgency; office: string; state: string }
  | { kind: "titleTransfer"; date: string; agency: TitleAgency; office: string; state: string }
  /** A state branded the title ("Salvage"). */
  | {
      kind: "titleBrand"
      date: string
      agency: TitleAgency
      state: string
      brand: TitleBrand
      detail: string
    }
  | { kind: "transfer"; date: string; agency: RegistryAgency; office: string }
  | { kind: "renewal"; date: string; agency: RegistryAgency; office: string }
  /** A reading in the region's odometer unit (`RegionPack.odometerUnit`). */
  | { kind: "odometer"; date: string; agency: Agency; reading: number; source: string }

export type TitleAgency = "County clerk" | "State registry"
export type TitleBrand = "Salvage" | "Rebuilt" | "Flood"

export type EventKind = VehicleEvent["kind"]

export type OdometerEvent = Extract<VehicleEvent, { kind: "odometer" }>
export type BorderEvent = Extract<VehicleEvent, { kind: "import" | "customsEntry" | "export" }>

export const MILESTONES: ReadonlySet<EventKind> = new Set<EventKind>([
  "import",
  "customsEntry",
  "export",
  "firstRegistration",
  "transfer",
  "firstTitle",
  "titleTransfer",
  "titleBrand",
])

export type VehicleRecords = {
  stolenReport: { reportedOn: string; agency: string } | null
  writeOff: { insurer: string; declaredOn: string; reason: string } | null
  collision: { occurredOn: string; location: string; severity: string } | null
  /** The same VIN active on another plate in the same registry. */
  duplicateIdentity: { plate: string; since: string } | null
  /** An active title for the same VIN in a US state, reported through NMVTIS. */
  usTitle: { state: string; issuedOn: string } | null
  /**
   * The same VIN active in another jurisdiction than the one titling it here: an
   * Ontario registration behind a US title presented at an Ohio counter.
   */
  otherJurisdiction: {
    jurisdiction: string
    kind: "title" | "registration"
    since: string
  } | null
  /** A brand one state put on the title that a later title no longer carries. */
  brand: {
    state: string
    brand: TitleBrand
    brandedOn: string
    cleanTitle: { state: string; issuedOn: string }
  } | null
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
  /**
   * Null until the registry records a first registration, and for a US vehicle
   * whose title application is the one at the counter.
   */
  plate: string | null
  registeredOn: string | null
  /** In the region's odometer unit. */
  odometer: number
  /** The full phone shows only when the clerk reveals it; the last four are for copy. */
  owner: { name: string; phone: string; phoneLast4: string; city: string }
  /** Null until the vehicle has been inspected once. */
  lastInspection: string | null
  riskTier: "high-value" | "standard"
  records: VehicleRecords
  decoded: DecodedVin
  history: VehicleEvent[]
}

export function findVehicle(pack: RegionPack, vin: string): Vehicle | undefined {
  const needle = normalizeVin(vin)
  return pack.vehicles.find((v) => v.vin === needle)
}

/**
 * The vehicle as the registry sees it. For a registered newborn, the dealer's
 * submission becomes the first two history events; for everything else this is
 * the identity, so authored vehicles never shift.
 */
export function bornVehicle(
  pack: RegionPack,
  vehicle: Vehicle,
  registration: RegistrationState
): Vehicle {
  if (registration.status !== "registered" || vehicle.history.length > 0) return vehicle
  const date = registration.registeredAt.slice(0, 10)
  const titles = pack.place.registry.titles
  return {
    ...vehicle,
    registeredOn: date,
    odometer: registration.deliveryKm,
    history: [
      titles
        ? {
            kind: "firstTitle",
            date,
            agency: "County clerk",
            office: registration.office,
            state: titles.state,
          }
        : {
            kind: "firstRegistration",
            date,
            agency: pack.place.registry.agency,
            office: registration.office,
          },
      {
        kind: "odometer",
        date,
        agency: "Dealer",
        reading: registration.deliveryKm,
        source: "Dealer delivery",
      },
    ],
  }
}

const COUNTRY_NAMES: Record<string, string> = { USA: "United States", UK: "United Kingdom" }

/** Where the vehicle was built, from the plant in its VIN decode. */
export function countryOfOrigin(vehicle: Vehicle): string {
  const country = vehicle.decoded.plant.split(",").at(-1)!.trim()
  return COUNTRY_NAMES[country] ?? country
}

export type OwnershipStart = Extract<
  VehicleEvent,
  { kind: "firstRegistration" | "transfer" | "firstTitle" | "titleTransfer" }
>

/** An event that opens an ownership: a registration or a title, first or on a transfer. */
export function isOwnershipStart(event: VehicleEvent): event is OwnershipStart {
  return (
    event.kind === "firstRegistration" ||
    event.kind === "transfer" ||
    event.kind === "firstTitle" ||
    event.kind === "titleTransfer"
  )
}

export function isBorderEvent(event: VehicleEvent): event is BorderEvent {
  return event.kind === "import" || event.kind === "customsEntry" || event.kind === "export"
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
  return sortedHistory(vehicle).filter(isBorderEvent)
}

/** The export that has not been followed by a re-entry, if any. */
export function openExport(vehicle: Vehicle): Extract<VehicleEvent, { kind: "export" }> | null {
  const last = borderEvents(vehicle).at(-1)
  return last?.kind === "export" ? last : null
}
