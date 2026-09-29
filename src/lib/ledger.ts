import type { RegionPack } from "@/regions/types"

import type { AuthorizationState } from "./authorization"
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

/** A registration that came through a dealer rather than a counter. */
export function isDealerChannel(office: string): boolean {
  return office.startsWith("Dealer channel")
}

/** "4412 · Toronto" reads "Toronto office 4412"; a dealer channel gives the dealer's name. */
export function officeLabel(office: string): string {
  if (isDealerChannel(office)) return office.split(" · ").at(-1) ?? office
  const [number, city] = office.split(" · ")
  return city ? `${city} office ${number}` : office
}

function historyDrafts(pack: RegionPack, vehicle: Vehicle): Draft[] {
  const vin = vehicle.vin
  const titles = pack.copy.portal.historyTitle
  return sortedHistory(vehicle).map((e): Draft => {
    switch (e.kind) {
      case "import":
        return {
          at: e.date,
          kind: "vehicle.import",
          title: titles[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.port}`,
        }
      case "customsEntry":
        return {
          at: e.date,
          kind: "vehicle.customsEntry",
          title: titles[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.port}`,
        }
      case "export":
        return {
          at: e.date,
          kind: "vehicle.export",
          title: titles[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.port}`,
        }
      case "firstRegistration":
      case "transfer":
      case "renewal":
        return {
          at: e.date,
          kind: `registration.${e.kind}`,
          title:
            e.kind === "firstRegistration" && isDealerChannel(e.office)
              ? "First registration (dealer submission)"
              : titles[e.kind],
          vin,
          office: e.office,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.office}`,
        }
      case "firstTitle":
      case "titleTransfer":
        return {
          at: e.date,
          kind: `title.${e.kind}`,
          title:
            e.kind === "firstTitle" && isDealerChannel(e.office)
              ? "First title (dealer submission)"
              : titles[e.kind],
          vin,
          office: e.office,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.state}|${e.office}`,
        }
      case "titleBrand":
        return {
          at: e.date,
          kind: "title.titleBrand",
          title: titles[e.kind],
          vin,
          visibility: "public",
          payload: `${e.date}|${e.agency}|${e.state}|${e.brand}`,
        }
      case "odometer":
        return {
          at: e.date,
          kind: "vehicle.odometer",
          title: titles[e.kind],
          vin,
          visibility: "private",
          payload: `${e.date}|${e.agency}|${e.reading}`,
        }
    }
  })
}

/** Which live-session events are on the chain, keyed by the activity event id. */
export type AuthorizationEventId =
  "sent" | "preapproved" | "approved" | "frozen" | "issued" | "escalated"

function authorizationDrafts(
  pack: RegionPack,
  vin: string,
  state: AuthorizationState
): (Draft & { eventId: AuthorizationEventId })[] {
  const office = pack.office.name
  const { issuedKind, issuedTitle } = pack.copy.portal.ledger
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
        "Referred for investigation",
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
        entry("issued", state.issued.at, issuedKind, issuedTitle, state.issued.reference)
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
export function ledgerEntries(
  pack: RegionPack,
  vehicle: Vehicle,
  state: AuthorizationState
): LedgerEntry[] {
  return chain(vehicle.vin, [
    ...historyDrafts(pack, vehicle),
    ...authorizationDrafts(pack, vehicle.vin, state),
  ])
}

/** Certificates for the live-session events, keyed by activity event id. */
export function authorizationCertificates(
  pack: RegionPack,
  vehicle: Vehicle,
  state: AuthorizationState
): Partial<Record<AuthorizationEventId, string>> {
  const history = historyDrafts(pack, vehicle)
  const auth = authorizationDrafts(pack, vehicle.vin, state)
  const entries = chain(vehicle.vin, [...history, ...auth])
  const out: Partial<Record<AuthorizationEventId, string>> = {}
  auth.forEach((d, i) => {
    out[d.eventId] = entries[history.length + i].hash
  })
  return out
}

/** Certificates for the vehicle's history events, in `sortedHistory` order. */
export function historyCertificates(pack: RegionPack, vehicle: Vehicle): string[] {
  return chain(vehicle.vin, historyDrafts(pack, vehicle)).map((e) => e.hash)
}
