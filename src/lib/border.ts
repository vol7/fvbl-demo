import type { BorderCopy, BorderPack } from "@/regions/types"

import { NO_EXPORT, type Examination, type ExportState } from "./exports"
import { formatTime } from "./format"
import { exportState, examination, type SessionState } from "./session"

/**
 * The vehicles declared for export at a port, as the border officer sees them
 * (Canada, from the 2026-09-30 call with Policaro). The shipping company's bill of
 * lading names each car's container; FVBL answers for each VIN from the ledger.
 *
 * Only what the officer needs to decide whether to open a container (2026-09-30
 * review): does the declared permit match the one on file for this VIN, is the car
 * reported stolen, who is the registered owner, and did the owner authorize the
 * export. Nothing else from the record: no insurer, collision or odometer data, no
 * history, no previous owners.
 *
 * The rules, as the call set them out:
 * - The permit number on the declaration must exist, and must be the one on file
 *   for this VIN. A fake permit or another car's permit fails, whatever the owner says.
 * - Some cars ship with only a bill of sale. The VIN still finds the registered owner.
 * - The registered owner is texted for every export and has to confirm. A car sold
 *   on a deposit and shipped under the seller's name has a genuine permit and isn't
 *   reported stolen; only the owner's "no" catches it.
 *
 * FVBL informs; the officer decides whether to hold the container.
 */
export type DeclaredVehicle = {
  vin: string
  year: number
  make: string
  model: string
  container: string
  /** Where the container sits in the terminal: "Block 4C · row 15 · tier 1". */
  position: string
  billOfLading: string
  declared: {
    /** What the exporter presented: the vehicle permit, or only a bill of sale. */
    document: "permit" | "billOfSale"
    /** Null when only a bill of sale was presented. */
    permit: string | null
    /** The exporter the declaration names. */
    exporter: string
  }
  /** What the registry has on file for this VIN. */
  record: {
    permit: string
    /** When the declared number is on file for a different vehicle: that vehicle. */
    declaredPermitBelongsTo?: string
    stolen: boolean
    /** The registered owner: a person, or a company for a dealer's stock. */
    owner: string
  }
  /**
   * The owner's answer. Fixed for the seeded rows (a time of day, "8:14 a.m.");
   * `live` reads the session, for the one declaration the demo plays.
   */
  owner: { status: "confirmed" | "noReply"; at: string } | "live"
}

export type PermitResult = "match" | "notPresented" | "notOnFile" | "otherVehicle"

/** Times are ready to read ("8:14 a.m."); `expiresAt` stays ISO for the countdown. */
export type OwnerResult =
  | { status: "confirmed"; at: string }
  | { status: "noReply"; at: string }
  | { status: "pending"; sentAt: string; expiresAt: string }
  | { status: "denied"; at: string }
  | { status: "expired"; at: string }

/** "hold": doesn't clear, "awaiting" the owner, or "cleared" to load. */
export type Verdict = "hold" | "awaiting" | "cleared"

/**
 * A declared permit is checked against the one on file for the VIN. Numbers
 * nowhere on file fail, and so does a number on file for a different vehicle. With
 * only a bill of sale, the VIN alone finds the record.
 */
export function permitResult(vehicle: DeclaredVehicle): PermitResult {
  const { permit } = vehicle.declared
  if (permit === null) return "notPresented"
  if (permit === vehicle.record.permit) return "match"
  return vehicle.record.declaredPermitBelongsTo ? "otherVehicle" : "notOnFile"
}

export function permitPasses(result: PermitResult): boolean {
  return result === "match" || result === "notPresented"
}

/** The owner's answer, or null while the live vehicle hasn't been declared. */
export function ownerResult(vehicle: DeclaredVehicle, state: ExportState): OwnerResult | null {
  if (vehicle.owner !== "live") return vehicle.owner
  switch (state.status) {
    case "none":
      return null
    case "pending":
      return { status: "pending", sentAt: formatTime(state.sentAt), expiresAt: state.expiresAt }
    case "confirmed":
      return { status: "confirmed", at: formatTime(state.confirmedAt) }
    case "denied":
      return { status: "denied", at: formatTime(state.deniedAt) }
    case "expired":
      return { status: "expired", at: formatTime(state.expiredAt) }
  }
}

export function verdictFor(vehicle: DeclaredVehicle, owner: OwnerResult | null): Verdict {
  if (!permitPasses(permitResult(vehicle))) return "hold"
  if (vehicle.record.stolen) return "hold"
  if (!owner) return "awaiting"
  if (owner.status === "denied" || owner.status === "expired") return "hold"
  if (owner.status === "pending" || owner.status === "noReply") return "awaiting"
  return "cleared"
}

/** What the card leads with: a failed permit, then a stolen report, then the owner. */
export type Reason = "otherVehicle" | "notOnFile" | "stolen" | OwnerResult["status"]

export type DeclaredView = {
  vehicle: DeclaredVehicle
  permit: PermitResult
  owner: OwnerResult | null
  verdict: Verdict
  reason: Reason
  /** The declaration names the registered owner as the exporter. */
  exporterIsOwner: boolean
  hold: Examination | null
}

function reasonFor(
  vehicle: DeclaredVehicle,
  permit: PermitResult,
  owner: OwnerResult | null
): Reason {
  if (permit === "otherVehicle" || permit === "notOnFile") return permit
  if (vehicle.record.stolen) return "stolen"
  return owner?.status ?? "pending"
}

function viewOf(vehicle: DeclaredVehicle, session: SessionState): DeclaredView {
  const permit = permitResult(vehicle)
  const owner = ownerResult(vehicle, exportState(session, vehicle.vin))
  return {
    vehicle,
    permit,
    owner,
    verdict: verdictFor(vehicle, owner),
    reason: reasonFor(vehicle, permit, owner),
    exporterIsOwner: vehicle.declared.exporter === vehicle.record.owner,
    hold: examination(session, vehicle.container),
  }
}

function isDeclared(vehicle: DeclaredVehicle, session: SessionState): boolean {
  return vehicle.owner !== "live" || exportState(session, vehicle.vin) !== NO_EXPORT
}

/** Open holds first, then cars awaiting their owner, then held containers, then the cleared. */
function rank(view: DeclaredView): number {
  if (view.verdict === "hold") return view.hold ? 2 : 0
  return view.verdict === "awaiting" ? 1 : 3
}

/**
 * The vehicles declared for export, in the order the officer works them. The live
 * declaration joins the list only once it has been declared.
 */
export function declaredViews(border: BorderPack, session: SessionState): DeclaredView[] {
  return border.declared
    .filter((v) => isDeclared(v, session))
    .map((v) => viewOf(v, session))
    .sort((a, b) => rank(a) - rank(b))
}

/** One declared vehicle, or null when it isn't on the list (yet). */
export function declaredView(
  border: BorderPack,
  session: SessionState,
  vin: string
): DeclaredView | null {
  const vehicle = border.declared.find((v) => v.vin === vin)
  return vehicle && isDeclared(vehicle, session) ? viewOf(vehicle, session) : null
}

/** The status pill: held once the officer has held it, otherwise the verdict. */
export function statusLabel(copy: BorderCopy, view: DeclaredView): string {
  return view.hold ? copy.status.held : copy.status[view.verdict]
}

/** "HBLU4205174" reads "HBLU 420517 4": owner code, serial, check digit. */
export function formatContainer(container: string): string {
  return `${container.slice(0, 4)} ${container.slice(4, 10)} ${container.slice(10)}`
}
