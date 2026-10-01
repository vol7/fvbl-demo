import type { RegionPack } from "@/regions/types"

import type { AuthorizationState } from "./authorization"
import type { ExportState } from "./exports"
import type { RegistrationState } from "./registration"
import { activeAuthorization, type SessionState } from "./session"
import { findVehicle, type Vehicle } from "./vehicles"

export type Texted = Extract<AuthorizationState, { status: "pending" | "authorized" | "frozen" }>
export type Submitted = Exclude<RegistrationState, { status: "none" }>
export type Declared = Exclude<ExportState, { status: "none" }>

/**
 * What the phone is showing. The owner's phone during an authorization request or
 * an export declaration; the dealership's phone during a first registration. A VIN
 * is never in two flows, so a registration or an export wins over an
 * authorization for the active VIN.
 */
export type Thread =
  | { kind: "authorization"; vehicle: Vehicle; state: Texted }
  | { kind: "registration"; vehicle: Vehicle; state: Submitted }
  | { kind: "export"; vehicle: Vehicle; state: Declared }

/** The request someone was texted about, if there is one. Pre-approvals send no SMS. */
export function liveThread(pack: RegionPack, session: SessionState): Thread | null {
  const vin = session.activeVin
  if (!vin) return null

  const registration = session.registrations[vin]
  if (registration && registration.status !== "none") {
    const vehicle = findVehicle(pack, vin)
    return vehicle ? { kind: "registration", vehicle, state: registration } : null
  }

  // An export and an owner authorization on the same VIN: the phone shows the
  // latest text, so a clerk's request on a declared vehicle still reaches the owner.
  const declared = session.exports?.[vin]
  const authorization = session.authorizations[vin]
  const authorizationSent = authorization && "sentAt" in authorization ? authorization.sentAt : ""
  if (declared && declared.status !== "none" && declared.sentAt >= authorizationSent) {
    const vehicle = findVehicle(pack, vin)
    return vehicle ? { kind: "export", vehicle, state: declared } : null
  }

  const active = activeAuthorization(session)
  if (!active) return null
  const { state } = active
  if (state.status !== "pending" && state.status !== "authorized" && state.status !== "frozen") {
    return null
  }
  if (state.origin === "owner") return null
  const vehicle = findVehicle(pack, active.vin)
  return vehicle ? { kind: "authorization", vehicle, state } : null
}
