import type { RegionPack } from "@/regions/types"

import type { AuthorizationState } from "./authorization"
import { authorizationCertificates, historyCertificates, type AuthorizationEventId } from "./ledger"
import type { RegistrationState } from "./registration"
import type { Vehicle } from "./vehicles"

export type ActivityEvent = {
  id: string
  at: string
  title: string
  detail?: string
  tone: "neutral" | "info" | "success" | "warning" | "danger"
  /** Ledger certificate, present on events that are on the chain. */
  certificate?: string
}

/**
 * Timeline derived from the timestamps present in the authorization state.
 * Pass the vehicle to stamp on-chain events with their certificate; views
 * ("Record retrieved", "Held for review") never get one.
 */
export function deriveActivity(
  pack: RegionPack,
  state: AuthorizationState,
  openedAt: string | null,
  clerk: string,
  vehicle?: Vehicle
): ActivityEvent[] {
  const events: ActivityEvent[] = []
  if (openedAt) {
    events.push({
      id: "lookup",
      at: openedAt,
      title: "Record retrieved",
      detail: `Lookup by ${clerk}`,
      tone: "neutral",
    })
  }
  switch (state.status) {
    case "idle":
      break
    case "blocked":
      if (openedAt) {
        events.push({
          id: "blocked",
          at: openedAt,
          title: "Held for review",
          detail: "Record checks returned conflicts",
          tone: "danger",
        })
      }
      break
    case "escalated":
      if (openedAt) {
        events.push({
          id: "blocked",
          at: openedAt,
          title: "Held for review",
          detail: "Record checks returned conflicts",
          tone: "danger",
        })
      }
      events.push({
        id: "escalated",
        at: state.escalatedAt,
        title: pack.copy.portal.activity.escalatedTitle,
        detail: `Case ${state.caseReference}`,
        tone: "danger",
      })
      break
    case "pending":
      events.push(sentEvent(pack, state))
      break
    case "authorized":
      if (state.origin === "owner") {
        events.push({
          id: "preapproved",
          at: state.approvedAt,
          title: "Pre-approved by registered owner",
          detail: pack.copy.portal.activity.preapprovedDetail(state.authorizationCode),
          tone: "success",
        })
        break
      }
      events.push(sentEvent(pack, state), {
        id: "approved",
        at: state.approvedAt,
        title: pack.copy.portal.activity.approvedTitle,
        detail: `Reference ${state.authorizationCode}`,
        tone: "success",
      })
      break
    case "frozen":
      events.push(sentEvent(pack, state), {
        id: "frozen",
        at: state.frozenAt,
        title: pack.copy.portal.activity.frozen[state.reason],
        detail: pack.copy.portal.activity.frozen.detail(state.reason),
        tone: "warning",
      })
      break
  }
  if (state.status === "authorized" && state.issued) {
    events.push({
      id: "issued",
      at: state.issued.at,
      title: pack.copy.portal.activity.issuedTitle,
      detail: state.issued.reference,
      tone: "success",
    })
  }
  if (vehicle) {
    const certificates = authorizationCertificates(pack, vehicle, state)
    for (const event of events) {
      const hash = certificates[event.id as AuthorizationEventId]
      if (hash) event.certificate = hash
    }
  }
  return events.sort((a, b) => a.at.localeCompare(b.at))
}

/**
 * The birth, when it happened in this session: one feed event carrying the
 * certificate of the chain's first entry. Pass the born vehicle.
 */
export function registrationActivity(
  pack: RegionPack,
  vehicle: Vehicle,
  registration: RegistrationState
): ActivityEvent[] {
  if (registration.status !== "registered" || vehicle.history.length === 0) return []
  const titled = Boolean(pack.place.registry.titles)
  const events: ActivityEvent[] = [
    {
      id: "registered",
      at: registration.registeredAt,
      title: titled ? "First title recorded" : "First registration recorded",
      detail: `Submitted by ${registration.dealer}, confirmed from the dealership mobile ending ${registration.dealerMobileLast4}. Reference ${registration.registrationRef}`,
      tone: "success",
      certificate: historyCertificates(pack, vehicle)[0],
    },
  ]
  if (registration.titleAlerts) {
    events.push({
      id: "titleAlerts",
      at: registration.registeredAt,
      title: `Title alerts on for mobile ending ${registration.titleAlerts.mobileLast4}`,
      detail: "Turned on by the first owner at delivery",
      tone: "info",
    })
  }
  return events
}

function sentEvent(
  pack: RegionPack,
  state: { origin: "clerk" | "owner" | "buyer"; requester: string; sentAt: string }
): ActivityEvent {
  const { requested } = pack.copy.portal.activity
  return state.origin === "buyer"
    ? {
        id: "sent",
        at: state.sentAt,
        title: requested.buyer,
        detail: `By ${state.requester}, owner texted`,
        tone: "info",
      }
    : {
        id: "sent",
        at: state.sentAt,
        title: requested.clerk,
        detail: "Confirmation link sent to registered owner",
        tone: "info",
      }
}
