import type { RegionPack } from "@/regions/types"

import { allPass, evaluateChecks } from "./checks"
import { plateLabel } from "./format"
import { registrationState, type SessionState } from "./session"
import { bornVehicle, type Vehicle, vehicleTitle } from "./vehicles"

/** Rows that make the portal look in use. Each region seeds its own (`pack.seed`). */

export type Outcome = "clear" | "blocked" | "pending" | "frozen"

export type RecentLookup = {
  vin: string
  plate: string
  vehicle: string
  outcome: Outcome
  when: string // human label
}

export type RequestRow = {
  reference: string
  vehicle: string
  plate: string
  applicant: string
  status: "Authorized" | "Issued" | "Pending" | "Frozen" | "Expired"
  when: string
}

export type CaseRow = {
  reference: string
  vehicle: string
  plate: string
  reason: string
  routedTo: string
  status: "Open" | "Under review" | "Closed"
  when: string
}

export const OUTCOME_LABEL: Record<RecentLookup["outcome"], string> = {
  clear: "Clear",
  blocked: "Blocked",
  pending: "Pending",
  frozen: "Frozen",
}

/**
 * Demo vehicles first (they are the clickable ones), then static filler. A vehicle
 * with no registration yet is not a lookup anyone made; it joins the list, at the
 * top, the moment the dealer's submission is confirmed.
 */
export function recentRows(
  pack: RegionPack,
  session: SessionState
): (RecentLookup & { live: boolean })[] {
  const row = (v: Vehicle, when: string) => ({
    vin: v.vin,
    plate: plateLabel(v.plate),
    vehicle: vehicleTitle(v),
    outcome: (allPass(evaluateChecks(pack, v)) ? "clear" : "blocked") as RecentLookup["outcome"],
    when,
    live: true,
  })
  const born: ReturnType<typeof row>[] = []
  const authored: ReturnType<typeof row>[] = []
  pack.vehicles.forEach((v, i) => {
    if (v.history.length > 0) {
      authored.push(row(v, pack.seed.demoLookupTimes[i] ?? "Today"))
      return
    }
    const registration = registrationState(session, v.vin)
    if (registration.status === "registered") {
      born.push(row(bornVehicle(pack, v, registration), "Today, just now"))
    }
  })
  return [...born, ...authored, ...pack.seed.recentLookups.map((r) => ({ ...r, live: false }))]
}
