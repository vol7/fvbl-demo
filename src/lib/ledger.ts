import type { AuthorizationState } from "./authorization"
import { OFFICE } from "./office"
import { sortedHistory, type Vehicle } from "./vehicles"

/**
 * The per-vehicle chain shown as "Blockchain certified". Derived, never stored:
 * a pure function of the vehicle's history and the live authorization state,
 * so every window renders the same certificates.
 *
 * Public entries carry their facts as recorded. Private entries (odometer
 * readings) are certified by fingerprint only. No entry carries a person's
 * name, plate or phone number.
 */
export type LedgerEntry = {
  seq: number
  at: string
  kind: string
  title: string
  vin: string
  office?: string
  visibility: "public" | "private"
  hash: string
}

type Draft = Omit<LedgerEntry, "seq" | "hash"> & { payload: string }

/**
 * Deterministic 64-hex digest. A synchronous stand-in for the demo: a real
 * deployment would sign with a cryptographic hash. The UI never names the
 * algorithm.
 */
export function fingerprint(input: string): string {
  let out = ""
  for (let seed = 0; seed < 8; seed++) {
    let h = (0x811c9dc5 ^ (seed * 0x9e3779b9)) >>> 0
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    h = (h ^ (h >>> 15)) >>> 0
    h = Math.imul(h, 0x2c1b3c6d) >>> 0
    h = (h ^ (h >>> 12)) >>> 0
    out += h.toString(16).padStart(8, "0")
  }
  return out
}

/** "a3f9…c21e" */
export function shortHash(hash: string): string {
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`
}

const HISTORY_TITLE: Record<Vehicle["history"][number]["kind"], string> = {
  import: "Entered Canada",
  customsEntry: "Cleared customs",
  export: "Exported",
  firstRegistration: "First registration",
  transfer: "Ownership transferred",
  renewal: "Registration renewed",
  odometer: "Odometer reading",
}

function historyDrafts(vehicle: Vehicle): Draft[] {
  const vin = vehicle.vin
  return sortedHistory(vehicle).map((e): Draft => {
    switch (e.kind) {
      case "import":
        return {
          at: e.date,
          kind: "vehicle.import",
          title: HISTORY_TITLE[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.port}`,
        }
      case "customsEntry":
        return {
          at: e.date,
          kind: "vehicle.customsEntry",
          title: HISTORY_TITLE[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.port}`,
        }
      case "export":
        return {
          at: e.date,
          kind: "vehicle.export",
          title: HISTORY_TITLE[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.port}|${e.destination}`,
        }
      case "firstRegistration":
      case "transfer":
      case "renewal":
        return {
          at: e.date,
          kind: `registration.${e.kind}`,
          title: HISTORY_TITLE[e.kind],
          vin,
          office: e.office,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.office}`,
        }
      case "odometer":
        return {
          at: e.date,
          kind: "vehicle.odometer",
          title: HISTORY_TITLE[e.kind],
          vin,
          visibility: "private",
          payload: `${e.date}|${e.agency}|${e.km}`,
        }
    }
  })
}

/** Which live-session events are on the chain, keyed by the activity event id. */
export type AuthorizationEventId =
  "sent" | "preapproved" | "approved" | "frozen" | "issued" | "escalated"

function authorizationDrafts(
  vin: string,
  state: AuthorizationState
): (Draft & { eventId: AuthorizationEventId })[] {
  const office = OFFICE.name
  const out: (Draft & { eventId: AuthorizationEventId })[] = []
  const entry = (
    eventId: AuthorizationEventId,
    at: string,
    kind: string,
    title: string,
    payload: string,
    withOffice = true
  ) =>
    out.push({
      eventId,
      at,
      kind,
      title,
      vin,
      office: withOffice ? office : undefined,
      visibility: "public",
      payload: `${at}|${kind}|${payload}`,
    })

  switch (state.status) {
    case "idle":
    case "blocked":
      break
    case "escalated":
      entry(
        "escalated",
        state.escalatedAt,
        "case.opened",
        "Escalated for review",
        state.caseReference
      )
      break
    case "pending":
      entry(
        "sent",
        state.sentAt,
        "authorization.requested",
        "Authorization requested",
        state.origin,
        state.origin === "clerk"
      )
      break
    case "authorized":
      if (state.origin === "owner") {
        entry(
          "preapproved",
          state.approvedAt,
          "authorization.preapproved",
          "Pre-approved by registered owner",
          state.authorizationCode,
          false
        )
      } else {
        entry(
          "sent",
          state.sentAt,
          "authorization.requested",
          "Authorization requested",
          state.origin,
          state.origin === "clerk"
        )
        entry(
          "approved",
          state.approvedAt,
          "authorization.approved",
          "Owner approved",
          state.authorizationCode,
          false
        )
      }
      if (state.issued) {
        entry(
          "issued",
          state.issued.at,
          "package.issued",
          "Package issued",
          state.issued.packageNumber
        )
      }
      break
    case "frozen":
      entry(
        "sent",
        state.sentAt,
        "authorization.requested",
        "Authorization requested",
        state.origin,
        state.origin === "clerk"
      )
      entry(
        "frozen",
        state.frozenAt,
        "authorization." + state.reason,
        state.reason === "denied" ? "Owner denied" : "Authorization expired",
        state.reason,
        false
      )
      break
  }
  return out
}

function chain(vin: string, drafts: Draft[]): LedgerEntry[] {
  let prev = fingerprint(`fvbl|${vin}`)
  return drafts.map(({ payload, ...rest }, i) => {
    const hash = fingerprint(`${prev}|${rest.kind}|${payload}`)
    prev = hash
    return { ...rest, seq: i + 1, hash }
  })
}

/** The full chain for a vehicle, oldest first. */
export function ledgerEntries(vehicle: Vehicle, state: AuthorizationState): LedgerEntry[] {
  return chain(vehicle.vin, [...historyDrafts(vehicle), ...authorizationDrafts(vehicle.vin, state)])
}

/** Certificates for the live-session events, keyed by activity event id. */
export function authorizationCertificates(
  vehicle: Vehicle,
  state: AuthorizationState
): Partial<Record<AuthorizationEventId, string>> {
  const history = historyDrafts(vehicle)
  const auth = authorizationDrafts(vehicle.vin, state)
  const entries = chain(vehicle.vin, [...history, ...auth])
  const out: Partial<Record<AuthorizationEventId, string>> = {}
  auth.forEach((d, i) => {
    out[d.eventId] = entries[history.length + i].hash
  })
  return out
}

/** Certificates for the vehicle's history events, in `sortedHistory` order. */
export function historyCertificates(vehicle: Vehicle): string[] {
  return chain(vehicle.vin, historyDrafts(vehicle)).map((e) => e.hash)
}
