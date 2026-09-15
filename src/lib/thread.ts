import type { AuthorizationState } from "./authorization"
import type { RegistrationState } from "./registration"
import { activeAuthorization, type SessionState } from "./session"
import { findVehicle, type Vehicle } from "./vehicles"

export type Texted = Extract<AuthorizationState, { status: "pending" | "authorized" | "frozen" }>
export type Submitted = Exclude<RegistrationState, { status: "none" }>

/**
 * What the phone is showing. The owner's phone during a UVIP request; the
 * dealership's phone during a first registration. A VIN is never in both
 * flows, so the registration wins whenever one exists for the active VIN.
 */
export type Thread =
  | { kind: "authorization"; vehicle: Vehicle; state: Texted }
  | { kind: "registration"; vehicle: Vehicle; state: Submitted }

/** The request someone was texted about, if there is one. Pre-approvals send no SMS. */
export function liveThread(session: SessionState): Thread | null {
  const vin = session.activeVin
  if (!vin) return null

  const registration = session.registrations[vin]
  if (registration && registration.status !== "none") {
    const vehicle = findVehicle(vin)
    return vehicle ? { kind: "registration", vehicle, state: registration } : null
  }

  const active = activeAuthorization(session)
  if (!active) return null
  const { state } = active
  if (state.status !== "pending" && state.status !== "authorized" && state.status !== "frozen") {
    return null
  }
  if (state.origin === "owner") return null
  const vehicle = findVehicle(active.vin)
  return vehicle ? { kind: "authorization", vehicle, state } : null
}
